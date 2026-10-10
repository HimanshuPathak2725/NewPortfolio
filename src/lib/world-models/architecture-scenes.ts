/** Paper-specific computational graphs. Coordinates are editorial, not tensor sizes. */
import type {ArchitectureId} from './architecture-diagrams';
export type Art='image'|'video'|'mask'|'masked-tokens'|'encoder'|'decoder'|'memory'|'distribution'|'state'|'tokens'|'sequence'|'transformer'|'mlp'|'policy'|'tree'|'trajectories'|'elites'|'loss'|'robot'|'noise'|'flow';
export type Tone='blue'|'green'|'orange'|'purple';
export interface ArchNode {id:string;art:Art;title:string;detail:string;at:[number,number];mobile:[number,number];step:number;tone:Tone;symbol?:string;}
export interface ArchEdge {from:string;to:string;step:number;tone?:Tone;dash?:boolean;relation?:'supervision'|'parameter'|'recurrence';path?:string;mobilePath?:string;}
export interface ArchScene {id:string;title:string;intro:string;nodes:ArchNode[];edges:ArchEdge[];steps:string[];equation?:string;footnote:string;}
const n=(id:string,art:Art,title:string,detail:string,at:[number,number],mobile:[number,number],step=0,tone:Tone='blue',symbol?:string):ArchNode=>({id,art,title,detail,at,mobile,step,tone,symbol});
const e=(from:string,to:string,step=0,tone:Tone='green',extra:Partial<ArchEdge>={}):ArchEdge=>({from,to,step,tone,...extra});
export const architectureScenes:Record<ArchitectureId,ArchScene[]>={
 dreamer:[{
  id:'rssm',title:'A state has two parts: memory and uncertainty.',
  intro:'DreamerV3 · one observed step. The image corrects a prediction made from previous experience.',
  nodes:[
   n('history','state','Previous state','hₜ₋₁, zₜ₋₁, aₜ₋₁',[90,70],[110,55]),
   n('transition','mlp','Recurrent transition','hₜ = fθ(hₜ₋₁,zₜ₋₁,aₜ₋₁)',[310,70],[330,55],0,'blue','fθ'),
   n('memory','memory','Deterministic memory','hₜ',[530,70],[330,245]),
   n('prior','distribution','Prior','pθ(zₜ | hₜ)',[750,70],[110,245],0,'green'),
   n('image','image','Observation','oₜ from replay',[90,285],[110,435],1),
   n('encoder','encoder','Visual encoder','eₜ = enc(oₜ)',[310,285],[330,435],1),
   n('posterior','distribution','Posterior','qθ(zₜ | hₜ,eₜ)',[530,285],[330,625],1,'green'),
   n('state','state','Model state','sₜ = [hₜ,zₜ], zₜ ∼ qθ',[750,285],[110,625],1,'green'),
   n('decoder','decoder','Observation decoder','reconstruct replay oₜ',[160,505],[110,830],2,'green'),
   n('reward','distribution','Reward head','likelihood of replay rₜ',[395,505],[330,830],2,'green','scalar'),
   n('continue','mlp','Continue head','likelihood of 1 − terminal',[630,505],[110,1035],2,'green','ĉ'),
   n('kl','loss','Balanced KL losses','prior ↔ posterior',[880,505],[330,1035],2,'purple','KL'),
  ],edges:[e('history','transition'),e('transition','memory'),e('memory','prior'),
   e('image','encoder',1),e('encoder','posterior',1),e('memory','posterior',1,'blue',{mobilePath:'M378 245H410V625H380'}),e('posterior','state',1),
   e('memory','state',1,'blue',{path:'M580 70H637V231H750V240',mobilePath:'M378 245H425V385H220V570H110V581'}),
   ...['decoder','reward','continue'].map((to,i)=>e('state',to,2,'green',{path:`M798 285H1018V432H${[160,395,630][i]}V460`,mobilePath:[
    'M110 735V785','M160 625H218V780H330V785','M60 625H18V1035H60'][i]})),
   e('prior','kl',2,'purple',{dash:true,relation:'supervision',path:'M798 70H995V425H880V460',mobilePath:'M60 245H9V1169H430V1035H380'}),
   e('posterior','kl',2,'purple',{dash:true,relation:'supervision',path:'M578 285H630V409H880V460',mobilePath:'M378 625H412V1035H380'}),
  ],steps:[
   'The recurrent transition combines the previous memory, stochastic state, and action. Its new memory predicts a prior over zₜ.',
   'The encoder adds the current observation. The posterior uses that evidence and memory; its sampled zₜ joins hₜ to form the model state.',
   'Prediction heads learn observation, reward, and continuation targets. Opposite stop-gradient directions balance prior and posterior learning.',
  ],equation:'Ldyn = KL[sg(q) ‖ p]     Lrep = KL[q ‖ sg(p)]',footnote:'DreamerV3. Categorical grids are schematic; sg denotes stop-gradient. Free-nats clipping, loss weights, layer widths, and normalization are omitted.'
 },{
  id:'imagination',title:'The actor learns from futures the model invents.',
  intro:'DreamerV3 · imagined trajectories. The same dynamics parameters are reused at each step.',
  nodes:[
   n('s0','state','Start state','posterior from replay',[100,100],[110,55],0,'green'),
   n('policy','policy','Actor πφ','sample action aₜ',[340,100],[330,55],0,'orange'),
   n('dynamics','mlp','RSSM prior step','hₜ₊₁, zₜ₊₁ ∼ pθ',[580,100],[330,245],0,'green','fθ, pθ'),
   n('s1','state','Next imagined state','sₜ₊₁ → repeat to H',[830,100],[110,245],0,'green'),
   n('predictions','distribution','Predicted signals','reward, continuation',[150,330],[110,445],1,'green','scalar'),
   n('value','mlp','Critic Vψ','bootstrap future value',[400,330],[330,445],1,'purple','Vψ'),
   n('returns','loss','λ-return targets','accumulate, bootstrap',[660,330],[330,645],1,'purple','Rλ'),
   n('actorloss','policy','Improve actor','advantage + entropy',[400,555],[110,845],2,'orange'),
   n('criticloss','loss','Fit critic','return targets + slow V',[830,555],[330,845],2,'purple','LV'),
  ],edges:[e('s0','policy',0,'orange'),e('policy','dynamics',0,'orange'),e('dynamics','s1'),
   e('s0','dynamics',0,'green',{path:'M50 100H18V245H510V100H530',mobilePath:'M60 55H16V195H245V245H280'}),
   e('s1','policy',0,'orange',{dash:true,path:'M830 55V15H340V55',mobilePath:'M110 355V389H424V55H380'}),
   e('s1','predictions',1,'green',{path:'M880 100H1008V263H150V285',mobilePath:'M110 355V400'}),
   e('s1','value',1,'purple',{path:'M830 210V263H400V285',mobilePath:'M160 245H220V390H330V400'}),
   e('predictions','returns',1,'green',{path:'M198 330H232V465H587V330H610',mobilePath:'M110 555V600H330V600'}),e('value','returns',1,'purple'),
   e('returns','actorloss',2,'orange'),e('returns','criticloss',2,'purple'),e('policy','actorloss',2,'orange',{path:'M390 100H475V491H400V510',mobilePath:'M380 55H432V785H110V801'}),e('value','actorloss',2,'purple',{path:'M350 330H280V555H350',mobilePath:'M280 445H208V770H110V801'}),e('value','criticloss',2,'purple',{path:'M448 330H940V555H880',mobilePath:'M380 445H417V845H380'}),
  ],steps:['The actor samples an action from the current latent state. The RSSM generates the next state without a new image; the loop repeats.',
   'Reward and continuation predictions combine with critic values to produce bootstrapped λ-return targets.',
   'The actor is trained using advantage-weighted log probabilities and entropy. The critic fits return targets with slow-value regularization.'],
  equation:'Deployment: observation → posterior state → actor → environment',footnote:'The diagram follows the DreamerV3 implementation. Imagined features and the actor’s value baseline are detached. Orange inputs carry log-probabilities and entropy; purple inputs carry critic predictions. PlaNet instead searches action sequences online with CEM; it does not use this Dreamer actor-training path.'
 },{
  id:'planet',title:'PlaNet searches at the moment an action is needed.',intro:'PlaNet · the behavior branch diverges here: online planning uses latent rollouts and predicted rewards.',
  nodes:[n('posterior','state','Inferred state','memory + Gaussian latent',[95,80],[110,55],0,'green','gaussian'),n('actions','trajectories','Sample sequences','candidate actions aₜ:ₜ₊H',[345,80],[330,55],0,'orange'),n('rollouts','state','RSSM prior rollouts','future states under actions',[605,80],[330,255],1,'green','gaussian'),n('rewards','distribution','Predicted rewards','score each trajectory',[880,80],[110,255],1,'green','scalar'),n('elite','elites','CEM refinement','fit distribution to elites',[605,340],[110,455],2,'orange'),n('execute','robot','Execute first action','discard the rest; observe',[345,340],[330,455],2,'orange'),n('next','image','New observation','update posterior state',[95,340],[330,660],2,'blue')],
  edges:[e('posterior','actions',0,'orange'),e('actions','rollouts',1,'orange'),e('posterior','rollouts',1,'green',{path:'M95 195V225H530V80H555',mobilePath:'M60 55H15V202H250V255H280'}),e('rollouts','rewards',1),e('rewards','elite',2,'orange'),e('elite','execute',2,'orange'),e('elite','actions',2,'orange',{dash:true,path:'M655 340H1015V15H345V35',mobilePath:'M60 455H8V8H330V12'}),e('execute','next',2),e('next','posterior',2,'blue',{dash:true,path:'M45 340H15V80H45',mobilePath:'M380 660H425V15H110V15'})],
  steps:['Infer a latent state from the current observation history. Initialize a distribution over candidate action sequences.',
   'Roll each candidate through the RSSM prior and use the reward model to score its predicted trajectory.',
   'CEM refits the action distribution to elite sequences and repeats. Execute only the first action, observe, update the posterior, and plan again.'],
  equation:'PlaNet: optimize actions online. Dreamer: train an actor in imagination.',footnote:'Original PlaNet uses Gaussian stochastic latents. This contrasts with the categorical DreamerV3 state shown above. The planner is CEM in a receding-horizon loop; it is not Dreamer’s actor–critic objective.'
 }],
 planning:[{
  id:'muzero',title:'MuZero builds a search tree inside a learned state.',intro:'MuZero · representation h, dynamics g, prediction f. Rewards belong to transitions; policies and values belong to states.',
  nodes:[n('obs','video','Observation history','o₁ … oₜ',[95,65],[110,55]),n('h','encoder','Representation h','history → root s⁰',[330,65],[330,55]),n('root','tokens','Root state s⁰','start of the search',[575,65],[330,245],0,'green','dense'),n('froot','distribution','Root prediction f','policy priors + value',[850,65],[110,245],0,'purple','pv'),
   n('a','mlp','Dynamics g · action a','(s⁰,a) → (s¹,r¹)',[330,295],[110,455],1,'green','g'),n('b','mlp','Dynamics g · action b','(s⁰,b) → (s¹,r¹)',[810,295],[330,455],1,'green','g'),
   n('fa','distribution','Prediction f(s¹)','policy prior p, value v',[330,515],[110,655],1,'purple','pv'),n('fb','distribution','Prediction f(s¹)','policy prior p, value v',[810,515],[330,655],1,'purple','pv'),
   n('tree','tree','Expand + back up','deeper g steps; returns',[95,515],[110,850],2,'orange'),n('visits','policy','Root visit counts','choose an action',[575,735],[330,850],2,'orange'),
  ],edges:[e('obs','h'),e('h','root'),e('root','froot',0,'purple'),e('froot','tree',2,'purple',{path:'M900 65H1020V455H95V470',mobilePath:'M60 245H16V850H60'}),e('root','a',1),e('root','b',1),e('a','fa',1,'purple'),e('b','fb',1,'purple'),e('fa','tree',2,'orange'),e('fb','tree',2,'orange',{path:'M860 515H1015V683H18V515H45'}),e('tree','visits',2,'orange')],
  steps:['Representation h maps the observation history to a root state. This state is trained for search-relevant predictions.',
   'Each hypothetical action goes through g, producing the next hidden state and reward. Function f supplies policy priors and a value at that state.',
   'Search repeatedly selects, expands, and backs up returns. Root visits determine the search policy used to choose the real action.'],
  equation:'Training targets: search policy π, return z, observed reward u',footnote:'Branches show different hypothetical actions with shared g and f parameters. Joint training unrolls real replay actions and fits policy, value, and reward targets. No observation reconstruction objective is required.'
 },{
  id:'tdmpc',title:'TD-MPC2 optimizes a short sequence of actions.',intro:'TD-MPC2 · continuous control. Candidate trajectories are scored using rewards and a terminal value estimate.',
  nodes:[n('obs','image','Observation','current state oₜ',[95,65],[110,55]),n('enc','encoder','Encoder','zₜ = enc(oₜ)',[330,65],[330,55]),n('proposal','policy','Policy proposals','candidate action paths',[570,65],[330,245],0,'orange'),n('samples','trajectories','Sample + roll out','z′ = d(z,a)',[820,65],[110,245],1,'green'),
   n('reward','distribution','Reward model','r(z,a) along trajectory',[160,295],[110,445],1,'green','scalar'),n('q','mlp','Q ensemble','terminal Q(zH,π(zH))',[420,295],[330,445],1,'purple','Q'),n('score','loss','Trajectory score','rewards + terminal Q',[705,295],[330,645],1,'purple','J'),
   n('elites','elites','Refine distribution','weighted elite sequences',[310,520],[110,645],2,'orange'),n('action','robot','Execute first action','observe again; replan',[770,520],[110,850],2,'orange')],
  edges:[e('obs','enc'),e('enc','proposal',0,'orange'),e('proposal','samples',0,'orange'),e('enc','samples',1,'green',{path:'M330 175V210H740V65H770',mobilePath:'M330 165V197H110V200'}),e('samples','reward',1,'green',{path:'M870 65H1010V230H160V250',mobilePath:'M110 355V400'}),e('samples','q',1,'purple'),e('reward','score',1,'green',{path:'M208 295H241V424H600V295H655',mobilePath:'M110 555V601H330V600'}),e('q','score',1,'purple'),e('score','elites',2,'orange'),e('elites','action',2,'orange'),e('elites','samples',2,'orange',{dash:true,path:'M262 520H15V15H820V20',mobilePath:'M60 645H16V245H60'})],
  steps:['Encode the current observation. The policy contributes action-sequence proposals alongside sampled candidates.',
   'The latent dynamics model rolls each sequence forward. Predicted rewards and an ensemble-based terminal Q estimate determine its score.',
   'Weighted elites update the sampling distribution. Refine again, then execute only the first action and replan after observing the environment.'],
  equation:'J = Σₖ γᵏ r(zk,ak) + γᴴ Q(zH,π(zH))',footnote:'Curves illustrate candidates, not benchmark results. Training combines latent consistency, reward regression, and bootstrapped Q objectives. Task embeddings and implementation-specific value aggregation are omitted.'
 }],
 tokens:[{
  id:'iris',title:'A frame becomes a vocabulary; dynamics become a sequence.',intro:'Original IRIS · a visual tokenizer and a causal Transformer have separate training objectives.',
  nodes:[n('image','image','Observation','64 × 64 RGB frame',[95,65],[110,55]),n('enc','encoder','Visual encoder','continuous feature map',[325,65],[330,55]),n('vq','tokens','Vector quantization','nearest codebook entries',[555,65],[330,245],0,'green'),n('seq','sequence','Interleaved sequence','zₜ¹ … zₜᴷ, aₜ, zₜ₊₁¹ …',[845,65],[110,245],0,'green'),
   n('decoder','decoder','Tokenizer decoder','reconstruct the input',[325,290],[330,445],1),n('recon','loss','Tokenizer objective','reconstruction + VQ losses',[95,500],[330,645],1,'purple','Ltok'),
   n('transformer','transformer','Causal Transformer','predict the next token',[720,290],[110,445],1,'green'),
   n('obshead','tokens','Observation head','next visual-token logits',[460,520],[110,645],2,'green'),n('rewhead','distribution','Reward head','reward classification',[710,520],[110,845],2,'green','scalar'),n('endhead','mlp','End head','episode-end probability',[930,520],[330,845],2,'green','end')],
  edges:[e('image','enc'),e('enc','vq'),e('vq','seq'),e('vq','decoder',1),e('decoder','recon',1,'purple'),e('image','recon',1,'purple',{dash:true,relation:'supervision',path:'M45 65H16V500H45',mobilePath:'M60 55H16V801H425V645H380'}),e('seq','transformer',1),e('transformer','obshead',2),e('transformer','rewhead',2,'green',{mobilePath:'M160 445H218V790H110V801'}),e('transformer','endhead',2,'green',{mobilePath:'M160 445H218V790H330V801'})],
  steps:['The visual encoder and codebook turn each image into discrete IDs. Actions occupy their own positions in the temporal sequence.',
   'A decoder trains the visual vocabulary through reconstruction. The causal Transformer receives token IDs; its objective does not update the tokenizer.',
   'Separate heads predict observation tokens, reward, and episode end. Cross-entropy trains these discrete predictions.'],
  equation:'… [zₜ¹, …, zₜᴷ, aₜ] [zₜ₊₁¹, …, zₜ₊₁ᴷ, aₜ₊₁] …',footnote:'Grid size is illustrative; K depends on the tokenizer. Action embeddings and observation embeddings are separate. The causal mask prevents access to future sequence positions.'
 },{
  id:'iris-behavior',title:'The policy sees an image decoded from imagination.',intro:'Original IRIS · the actor–critic interacts with the world model through an image interface.',
  nodes:[n('tokens','tokens','Sample visual tokens','world-model continuation',[95,80],[110,55],0,'green'),n('decoder','decoder','Tokenizer decoder','tokens → RGB frame',[330,80],[330,55],0,'green'),n('frame','image','Imagined frame','64 × 64 × 3',[575,80],[330,255],0,'green'),n('cnn','encoder','Actor visual network','4 convolution/pool layers',[820,80],[110,255],1),
   n('world','transformer','World-model step','sample z; predict r / end',[95,310],[330,455],2,'green'),n('lstm','memory','LSTM memory','512-dimensional state',[575,310],[110,455],1),n('actor','policy','Actor head','next environment action',[310,530],[110,660],2,'orange'),n('critic','mlp','Value head','train actor–critic',[825,530],[330,660],2,'purple','V')],
  edges:[e('tokens','decoder'),e('decoder','frame'),e('frame','cnn',1),e('cnn','lstm',1),e('lstm','actor',2,'orange'),e('lstm','critic',2,'purple'),e('actor','world',2,'orange',{path:'M260 530H225V310H145',mobilePath:'M160 660H218V455H280'}),e('world','tokens',2,'green',{dash:true,path:'M45 310H15V80H45',mobilePath:'M380 455H425V8H110V12'})],
  steps:['Predicted visual tokens are decoded back to pixels before the actor consumes them.',
   'The actor’s convolutional network processes the imagined image. An LSTM retains temporal context.',
   'The actor supplies the next action token to the world model. Reward and end predictions supply the imagined learning signals.'],
  footnote:'The action enters the next Transformer step. The imagined environment is evaluated without actor gradients through the world model. Layer counts follow the original IRIS implementation.'
 }],
 jepa:[{
  id:'jepa-pretrain',title:'Two branches meet in a feature-prediction loss.',intro:'V-JEPA 2 · action-free pretraining. A moving-average teacher supplies the target representation.',
  nodes:[n('context','mask','Visible video patches','masked context',[105,85],[110,55]),n('encoder','encoder','Context encoder','trainable ViT',[355,85],[330,55]),n('predictor','transformer','Predictor','features + mask positions',[650,85],[330,255],1,'green','vit'),n('prediction','tokens','Predicted features','target locations',[920,85],[110,255],1,'green','dense'),
   n('full','video','Full video','includes target regions',[105,350],[110,460]),n('target','encoder','Target encoder','EMA of context encoder',[355,350],[330,460],0),n('features','tokens','Target features','stop gradient',[650,350],[330,660],2,'green','dense'),n('loss','loss','Feature loss','normalized target patches',[920,350],[110,660],2,'purple','L')],
  edges:[e('context','encoder'),e('encoder','predictor',1),e('predictor','prediction',1),e('full','target'),e('target','features',2),e('encoder','target',0,'blue',{dash:true,relation:'parameter',path:'M405 85H480V350H405',mobilePath:'M380 55H425V460H380'}),e('prediction','loss',2,'purple',{mobilePath:'M60 255H5V660H60'}),e('features','loss',2,'purple')],
  steps:['The student encodes the visible context. A separate encoder sees the full video and follows the student by exponential moving average.',
   'Mask-location embeddings tell the predictor which missing regions to estimate from context features.',
   'The loss compares predicted and target representations. Gradients train the student and predictor; the target branch uses stop-gradient.'],
  equation:'θtarget ← τ θtarget + (1 − τ) θcontext',footnote:'Dashed connection: parameter update by EMA, not a video-feature connection. Pretraining is action-free. It predicts representations rather than reconstructing pixels.'
 },{
  id:'jepa-control',title:'Actions enter during a separate adaptation stage.',intro:'V-JEPA 2-AC · inference and planning after adaptation. Frozen image features feed an action-conditioned predictor.',
  nodes:[n('current','image','Current image','robot observation xₖ',[95,65],[110,55]),n('encoder','encoder','Frozen encoder','current state features',[340,65],[330,55]),n('actions','policy','Actions + robot state','candidate sequence',[590,65],[110,255],0,'orange'),n('predictor','transformer','AC predictor','roll future features',[840,65],[330,255],1,'green','ac'),
   n('goal','image','Goal image','desired visual outcome',[95,295],[110,455]),n('goalenc','encoder','Same frozen encoder','goal features',[340,295],[330,455]),n('cost','loss','Goal-feature distance','predicted state vs goal',[640,295],[330,655],1,'purple','L1'),n('mpc','trajectories','CEM / MPC','refine; execute first action',[840,525],[110,655],2,'orange')],
  edges:[e('current','encoder'),e('encoder','predictor',1,'green',{path:'M390 65H455V202H755V65H790',mobilePath:'M330 165V210'}),e('actions','predictor',1,'orange'),e('goal','goalenc'),e('goalenc','cost',1,'purple'),e('predictor','cost',1,'purple',{mobilePath:'M380 255H423V655H380'}),e('cost','mpc',2,'orange'),e('mpc','actions',2,'orange',{dash:true,path:'M890 525H1015V15H590V20',mobilePath:'M60 655H16V255H60'})],
  steps:['Freeze the pretrained visual encoder. Encode the current context and the goal, while candidate actions and robot state supply control inputs.',
   'The adapted predictor rolls features forward. A distance to the encoded goal scores the hypothetical outcome.',
   'CEM refines action candidates inside model predictive control. Execute the first action, observe again, and repeat.'],
  footnote:'The action-conditioned predictor is trained on robot trajectories with teacher-forced and two-step rollout L1 losses. The paper’s robot configuration uses 16×16×1408 encoder features and a 24-layer, 16-head, width-1024 predictor with 7D action/state inputs. It is not the action-free pretraining predictor.'
 }],
 video:[{
  id:'genie-training',title:'Genie learns what an action means from video.',intro:'Original Genie (2024) · a video tokenizer and a separate latent action model establish two discrete vocabularies.',
  nodes:[n('frames','video','Training clip','past frames + next frame',[95,80],[110,55]),n('tokenizer','encoder','ST video tokenizer','compress visual frames',[345,80],[330,55]),n('tokens','tokens','Visual codebook','frame tokens z',[605,80],[330,255],0,'green'),n('video-dec','decoder','Video decoder','tokenizer reconstruction',[880,80],[110,255],0,'green'),
   n('lam','encoder','Latent action encoder','infer transition from frames',[95,330],[110,465],1),n('action','tokens','Action codebook','discrete latent action ã',[345,330],[330,465],1,'orange'),n('lamdec','decoder','Latent action decoder','past frames + ã → next frame',[605,330],[330,665],1,'orange'),n('recon','loss','Action-model loss','reconstruction + VQ',[880,330],[110,665],1,'purple','LLAM'),
   n('dynamics','transformer','ST dynamics model','visual tokens + sg(ã)',[345,580],[110,870],2,'green','st'),n('ce','loss','Dynamics loss','masked-token cross-entropy',[715,580],[330,870],2,'purple','CE')],
  edges:[e('frames','tokenizer'),e('tokenizer','tokens'),e('tokens','video-dec'),e('frames','lam',1,'blue',{mobilePath:'M60 55H15V465H60'}),e('lam','action',1,'orange'),e('action','lamdec',1,'orange'),e('lamdec','recon',1,'purple'),e('frames','lamdec',1,'blue',{path:'M45 80H15V250H545V330H555',mobilePath:'M60 55H5V610H275V665H280'}),e('tokens','dynamics',2,'green',{path:'M605 190V215H1008V495H345V535',mobilePath:'M380 255H428V806H110V825'}),e('action','dynamics',2,'orange',{mobilePath:'M380 465H405V798H110V825'}),e('dynamics','ce',2,'purple'),e('tokens','ce',2,'purple',{dash:true,relation:'supervision',path:'M605 190V212H1020V580H765',mobilePath:'M380 255H438V1012H330V914'}),e('frames','recon',1,'purple',{dash:true,relation:'supervision',path:'M45 80H5V475H880V374',mobilePath:'M60 55H3V665H60'})],
  steps:['Train the spatiotemporal video tokenizer to reconstruct clips through a discrete visual codebook.',
   'The latent action encoder sees the transition, including the next frame. Its decoder reconstructs that next frame from the past and the inferred action code.',
   'Dynamics learns masked visual-token prediction using action embeddings. The action embedding is detached: dynamics loss does not train the action model.'],
  footnote:'Tokenizer training precedes joint latent-action/dynamics training; the original action vocabulary has eight codes. Action embeddings are added to dynamics representations; they are not interleaved action tokens as in IRIS.'
 },{
  id:'genie-inference',title:'At inference, the user supplies the action code.',intro:'Original Genie · generate one frame’s tokens, decode it, then append it to history.',
  nodes:[n('history','tokens','Visual token history','z₁ … zₜ',[105,85],[110,55],0,'green'),n('action','policy','Selected action code','codebook entry ãₜ',[350,85],[330,55],0,'orange'),n('dynamics','transformer','ST Transformer','condition on history + ãₜ',[625,85],[330,255],1,'green','st'),n('masked','masked-tokens','Masked next frame','iteratively fill token sites',[910,85],[110,255],1,'green'),
   n('filled','tokens','Completed frame tokens','MaskGIT refinement',[625,340],[110,460],2,'green'),n('decoder','decoder','Video decoder','visual tokens → pixels',[350,340],[330,460],2,'green'),n('frame','image','Generated frame','display + extend history',[95,340],[330,660],2,'green')],
  edges:[e('history','dynamics',1,'green',{path:'M105 40V10H540V85H575',mobilePath:'M110 165V203H330V210'}),e('action','dynamics',1,'orange'),e('masked','dynamics',1),e('dynamics','filled',2),e('filled','masked',2,'green',{dash:true,path:'M675 340H1005V85H960',mobilePath:'M160 460H220V255H160'}),e('filled','decoder',2),e('decoder','frame',2),e('filled','history',2,'green',{dash:true,path:'M625 450V493H16V85H55',mobilePath:'M60 460H15V55H60'})],
  steps:['Encode the available visual history and choose a learned action code. No future frame is available to infer the action at inference.',
   'The dynamics Transformer uses the selected action embedding and past visual tokens to predict masked sites in the next frame.',
   'MaskGIT refines the frame’s token grid. Decode the completed grid and append its tokens to history before taking the next action.'],
  footnote:'The latent action encoder/decoder are discarded for inference; the codebook remains. Generation is autoregressive across frames, with iterative token refinement within each frame.'
 }],
 embodied:[{
  id:'daydreamer',title:'DayDreamer closes the loop through a real robot.',intro:'DayDreamer · separate the physical interaction loop from model and behavior learning.',
  nodes:[n('robot','robot','Physical robot','sensors and actuators',[110,80],[110,55]),n('infer','state','State inference','encode + RSSM posterior',[385,80],[330,55],0,'green'),n('actor','policy','Actor','sample actuator command',[715,80],[330,255],0,'orange'),
   n('replay','video','Replay experience','observations, actions, rewards',[110,350],[110,255],1),n('model','state','World-model learning','RSSM + prediction heads',[385,350],[110,465],1,'green'),n('imagine','trajectories','Latent imagination','rollouts under the actor',[715,350],[330,465],2,'green'),n('ac','policy','Behavior learning','actor + critic objectives',[715,585],[330,670],2,'orange')],
  edges:[e('robot','infer'),e('infer','actor',0,'orange'),e('actor','robot',0,'orange',{dash:true,path:'M715 35V10H110V35',mobilePath:'M380 255H425V10H110V12'}),e('robot','replay',1),e('replay','model',1),e('model','imagine',2),e('imagine','ac',2,'orange'),e('ac','actor',2,'orange',{dash:true,relation:'parameter',path:'M765 585H985V80H765',mobilePath:'M380 670H436V255H380'})],
  steps:['Robot observations update the latent state. The actor selects a command, which changes the physical environment and produces the next observation.',
   'Recorded interaction trains the world model: recurrent dynamics and observation/reward/continuation predictions.',
   'Imagined trajectories train actor and critic. Updated actor parameters return to the robot interaction loop.'],
  footnote:'Dashed connections denote the actuator loop and an actor-parameter update. This is the DayDreamer learning architecture; the body-specific sensor and actuator interfaces vary by experiment.'
 },{
  id:'cosmos',title:'Cosmos-Predict2.5 generates video by integrating a flow.',intro:'Cosmos-Predict2.5/base · text and visual context condition a video diffusion Transformer trained with flow matching.',
  nodes:[n('context','video','Visual context','image / video conditioning',[95,70],[110,55]),n('tokenizer','encoder','Video tokenizer','continuous video latents',[340,70],[330,55]),n('text','sequence','Text embedding','Cosmos-Reason1 features',[615,70],[110,255],0,'blue','text'),n('noise','noise','Reference + noise','clean context; noisy future',[890,70],[330,255]),
   n('dit','transformer','Video DiT','velocity; time-conditioned',[615,310],[330,470],1,'green','dit'),n('flow','flow','Flow integration','update latent; repeat',[890,310],[110,470],1,'green'),n('decoder','decoder','Tokenizer decoder','latent → video pixels',[340,545],[110,685],2,'green'),n('video','video','Generated video','conditioned continuation',[715,545],[330,685],2,'green')],
  edges:[e('context','tokenizer'),e('tokenizer','noise',0,'blue',{path:'M390 70H443V221H985V70H940'}),e('text','dit',1),e('noise','dit',1),e('dit','flow',1),e('flow','dit',1,'green',{dash:true,path:'M890 420V465H615V420',mobilePath:'M110 580V616H426V470H380'}),e('flow','decoder',2,'green',{path:'M940 310H1013V479H340V500',mobilePath:'M110 580V640'}),e('decoder','video',2)],
  steps:['Clean reference latents replace the initial noisy frames with a condition mask. Text supplies cross-attention; time conditions adaptive normalization.',
   'The DiT predicts a velocity field on noisy video latents. Repeated integration steps move toward a generated latent video.',
   'The video tokenizer’s decoder turns the final latent into frames. A downstream controller or evaluator is a separate system.'],
  equation:'Training: regress a target flow velocity at sampled interpolation times',footnote:'This is the base Predict2.5 generation path, not Cosmos 3 or a robot actuator policy. Wan2.1 VAE compression is 4×8×8 in time/height/width; latent patches are 1×2×2. Fields and frames are illustrative. Text encoder internals and solver choices are omitted.'
 }],
};
