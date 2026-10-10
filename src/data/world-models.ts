export const chapters = [
  {id:'foundations', number:'01', title:'The language of the problem', short:'Foundations', skill:'Connect probability, RL, and control.'},
  {id:'hidden-state', number:'02', title:'What you see is not the state', short:'State & belief', skill:'Explain why memory changes a prediction.'},
  {id:'learn-dynamics', number:'03', title:'Learn the rules from experience', short:'Learning dynamics', skill:'Fit a dynamics model and test it on held-out data.'},
  {id:'latent-imagination', number:'04', title:'Build a space to imagine in', short:'Latent imagination', skill:'Distinguish a prior from an observation-conditioned posterior.'},
  {id:'planning', number:'05', title:'Choose a future, then act', short:'Planning & control', skill:'Optimize actions and compare prediction with execution.'},
  {id:'architecture-atlas', number:'06', title:'Why the architectures diverge', short:'Architecture atlas', skill:'Identify what each family predicts and discards.'},
  {id:'evaluation', number:'07', title:'When imagination becomes unreliable', short:'Uncertainty & evaluation', skill:'Separate model disagreement from calibrated confidence.'},
  {id:'build-roadmap', number:'08', title:'From first experiment to research', short:'Build & investigate', skill:'Produce evidence for one precise research question.'},
];
export type LabKind = 'belief' | 'learning' | 'posterior' | 'planning' | 'uncertainty';
export const labs: Record<LabKind, {number:string; title:string; question:string; description:string; caption:string; parameters:{name:string; label:string; min:number; max:number; step:number; value:number; unit:string}[]}> = {
  belief: {
    number:'01', title:'Two velocities, one observation', question:'Can a single frame tell you which way the object will move?',
    description:'Two particles start at the same position with opposite velocities. Reveal their history and compare the futures that remain consistent with the evidence.',
    caption:'Constant-velocity toy system. The two hypotheses have equal weight until you reveal the previous observation; this is a constructed ambiguity, not a trained filter.',
    parameters:[{name:'speed',label:'Hidden speed',min:0.05,max:0.3,step:0.01,value:0.16,unit:'units/s'}],
  },
  learning: {
    number:'02', title:'Learning the spring’s dynamics', question:'What changes when the model learns from more—or noisier—experience?',
    description:'Watch gradient descent fit the stiffness and damping of a spring system. The loss curves and learned coefficients are calculated from generated transitions, including a separate test set.',
    caption:'Actual two-parameter regression on synthetic data: acceleration = action − stiffness × position − damping × velocity. Both training and test labels contain the selected Gaussian noise.',
    parameters:[{name:'samples',label:'Training transitions',min:12,max:192,step:12,value:96,unit:'samples'},{name:'noise',label:'Measurement noise σ',min:0,max:0.2,step:0.01,value:0.03,unit:'units'}],
  },
  posterior: {
    number:'03', title:'Updating a belief with evidence', question:'How much should new evidence change your belief?',
    description:'Blend a broad predictive prior into the posterior produced by a scalar Gaussian measurement update. Change the observation or its noise and inspect the precision-weighted correction.',
    caption:'An analytic Gaussian update, used to explain prior/posterior reasoning. Dreamer’s learned RSSM uses different parameterizations; this is not an implementation of Dreamer.',
    parameters:[{name:'observation',label:'Observed position',min:-1.2,max:1.2,step:0.05,value:0.6,unit:'units'},{name:'sigma',label:'Observation noise σ',min:0.05,max:0.8,step:0.05,value:0.25,unit:'units'}],
  },
  planning: {
    number:'04', title:'Planning around a missing obstacle', question:'What does a planner do when its model leaves out an obstacle?',
    description:'A cross-entropy optimizer evaluates 96 candidate action sequences per pass, keeps the best 12, and refines the sampling distribution over six passes. Compare the selected imagined path with execution under collision rules.',
    caption:'A known-dynamics 2D particle simulator with bounded forces and drag. The objective combines goal distance, effort, boundary penalties, and obstacle cost. Results are from this toy optimizer, not PETS or TD-MPC.',
    parameters:[{name:'horizon',label:'Planning horizon',min:12,max:40,step:2,value:28,unit:'steps'},{name:'seed',label:'Sampling seed',min:1,max:25,step:1,value:14,unit:'seed'}],
  },
  uncertainty: {
    number:'05', title:'How prediction errors accumulate', question:'When do new observations help, and what do they fail to fix?',
    description:'Thirteen spring models predict the same starting state with different stiffness assumptions. Follow their fan of futures, then re-anchor their states to a real observation every eight steps.',
    caption:'The shaded fan is the minimum-to-maximum spread of 13 specified models. It is not a calibrated confidence interval. Re-observation supplies the exact state here; real measurements can be noisy.',
    parameters:[{name:'spread',label:'Stiffness disagreement',min:0,max:0.35,step:0.01,value:0.16,unit:'units'}],
  },
};

export const families = [
  {id:'dreamer',label:'Latent behavior learning',name:'PlaNet → Dreamer',color:'green',
    state:'A recurrent deterministic memory and a stochastic latent representation.',
    predicts:'Latent transitions; reward, continuation, and observation reconstruction support learning.',
    actions:'Actions enter the latent dynamics. Dreamer trains an actor and critic through imagined trajectories.',
    discards:'A compact latent state abstracts the observation; it is not a hand-authored physics engine.',
    uses:'PlaNet plans action sequences in latent space. Dreamer learns a policy from imagined experience.',
    test:'Rollout consistency, real task return, data efficiency, and the effect of prediction error on behavior.',
    nodes:['Observation','Encoder + memory','Latent dynamics','Reward + value','Actor / planner'],
    links:[{title:'PlaNet',href:'https://arxiv.org/abs/1811.04551'},{title:'Dreamer',href:'https://arxiv.org/abs/1912.01603'},{title:'DreamerV2',href:'https://arxiv.org/abs/2010.02193'},{title:'DreamerV3',href:'https://www.nature.com/articles/s41586-025-08744-2'},{title:'Dreamer 4',href:'https://arxiv.org/abs/2509.24527'}]},
  {id:'planning',label:'Task-oriented planning',name:'MuZero / TD-MPC2',color:'blue',
    state:'A learned task-oriented state; its useful content is determined by planning and learning objectives.',
    predicts:'MuZero predicts reward, policy, and value through learned transitions. TD-MPC2 uses implicit latent dynamics and value estimates.',
    actions:'Actions condition a transition. MuZero searches a tree; TD-MPC2 performs local trajectory optimization.',
    discards:'Neither approach requires reconstructing every input pixel to make its planning state useful.',
    uses:'Search or optimize at decision time. The two methods differ in action spaces, search procedures, and training.',
    test:'Actual task performance under matched planning and data budgets; visual reconstruction is not the main criterion.',
    nodes:['Observation','Task state','Action + dynamics','Reward + value','Search / MPC'],
    links:[{title:'MuZero',href:'https://arxiv.org/abs/1911.08265'},{title:'TD-MPC',href:'https://arxiv.org/abs/2203.04955'},{title:'TD-MPC2',href:'https://arxiv.org/abs/2310.16828'}]},
  {id:'tokens',label:'Dynamics as a sequence',name:'IRIS',color:'blue',
    state:'A history of discrete visual tokens and actions, processed by an autoregressive Transformer.',
    predicts:'Future visual tokens and signals used by an actor-critic inside the learned environment.',
    actions:'Actions participate in the sequence so a continuation depends on what the agent does.',
    discards:'A tokenizer compresses image detail; token prediction introduces its own reconstruction and rollout errors.',
    uses:'Train behavior on generated trajectories. Inspect tokenization and temporal context together.',
    test:'Real-environment return, sample efficiency, and useful multi-step prediction rather than token loss alone.',
    nodes:['Pixels','Visual tokenizer','Tokens + actions','Transformer','Imagined training'],
    links:[{title:'IRIS paper',href:'https://arxiv.org/abs/2209.00588'},{title:'Official code',href:'https://github.com/eloialonso/iris'}]},
  {id:'jepa',label:'Predictive representation',name:'JEPA / V-JEPA',color:'green',
    state:'Learned context and target features; the representation should carry information useful beyond reconstruction.',
    predicts:'Representations of masked or future regions, depending on the training objective and variant.',
    actions:'Action conditioning is explicit in V-JEPA 2-AC. Do not infer an action interface for every JEPA checkpoint.',
    discards:'Pixel reconstruction is not the prediction target; downstream usefulness must be evaluated separately.',
    uses:'Learn visual features; connect an appropriate action-conditioned variant to robot planning.',
    test:'Representation and downstream task metrics, intervention sensitivity, and planning outcomes where supported.',
    nodes:['Video context','Context encoder','Feature predictor','Target features','Downstream task'],
    links:[{title:'I-JEPA',href:'https://arxiv.org/abs/2301.08243'},{title:'V-JEPA 2',href:'https://ai.meta.com/research/publications/v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/'},{title:'V-JEPA 2.1',href:'https://arxiv.org/abs/2603.14482'}]},
  {id:'video',label:'Controllable generation',name:'Genie',color:'orange',
    state:'A compressed visual history used to generate an environment’s continuation.',
    predicts:'Visual futures that respond to an action interface. The precise design differs across Genie releases.',
    actions:'Original Genie learns latent actions from video. Interactive later releases expose controllable environments.',
    discards:'Compression and learned generation do not guarantee exact mechanics, persistent state, or causal identification.',
    uses:'Generate and explore worlds; investigate consistency and control before relying on them for a task.',
    test:'Action controllability, persistence, physical consistency, latency, and demonstrated downstream value.',
    nodes:['Visual context','Video representation','Action conditioning','Generative dynamics','Interactive world'],
    links:[{title:'Genie paper',href:'https://arxiv.org/abs/2402.15391'},{title:'Genie 2',href:'https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/'},{title:'Genie 3',href:'https://deepmind.google/models/genie/'}]},
  {id:'embodied',label:'Physical-world workflows',name:'DayDreamer / Cosmos',color:'orange',
    state:'Robot observations or multimodal context; these systems have different representations and objectives.',
    predicts:'DayDreamer learns dynamics for physical robot behavior. Cosmos includes generation, transformation, and reasoning model families.',
    actions:'Check the particular model’s conditioning interface, available action labels, embodiment, and data assumptions.',
    discards:'Training data and representation limit coverage; a shared physical-AI label does not imply interchangeable components.',
    uses:'Learn robot behavior or build simulation and data workflows suited to a specific downstream task.',
    test:'Real-world or held-out task performance, transfer, failure recovery, inference cost, and model-specific protocols.',
    nodes:['Sensors / context','State representation','Model-specific inputs','Predict / generate','Physical-AI task'],
    links:[{title:'DayDreamer',href:'https://arxiv.org/abs/2206.14176'},{title:'RoboDreamer',href:'https://arxiv.org/abs/2404.12377'},{title:'Cosmos documentation',href:'https://docs.nvidia.com/nim/cosmos/latest/introduction.html'},{title:'Cosmos 3 report',href:'https://research.nvidia.com/labs/cosmos-lab/cosmos3/'}]},
];

export const projects = [
  {number:'01',title:'A tabular world',build:'GridWorld + transition counts + Dyna-Q',artifact:'Plot real and model-generated transitions.',check:'Compare equal real-interaction budgets; test an unseen transition.'},
  {number:'02',title:'Identify simple physics',build:'CartPole or a controlled spring + learned dynamics + MPC',artifact:'One-step and recursive error curves.',check:'Split by trajectory and test a different starting-state range.'},
  {number:'03',title:'Make uncertainty explicit',build:'Probabilistic outputs + an ensemble + rollout sampling',artifact:'Reliability and ensemble-disagreement plots.',check:'Separate observation noise from model disagreement; check calibration.'},
  {number:'04',title:'Predict from pixels',build:'Encoder + temporal dynamics + decoder',artifact:'Observed and imagined frames for the same action sequence.',check:'Report dynamics errors as well as image similarity.'},
  {number:'05',title:'A small imagination learner',build:'RSSM + reward + continuation + actor + critic',artifact:'Annotated training graph and actual environment returns.',check:'Disable imagination and match the data budget for the baseline.'},
  {number:'06',title:'Learn only what search needs',build:'Small board game + representation/dynamics + tree search',artifact:'A search tree with reward, policy, and value annotations.',check:'Compare learned-model search to known-rule search.'},
  {number:'07',title:'Treat dynamics as a language',build:'Visual tokenizer + action tokens + Transformer',artifact:'Token reconstructions and long rollout failures.',check:'Vary context length and isolate tokenizer error.'},
  {number:'08',title:'Predict features instead',build:'Context encoder + target encoder + predictive objective',artifact:'A pixel-versus-feature comparison under a shared task.',check:'Measure collapse and useful downstream distinctions.'},
  {number:'09',title:'Control generated futures',build:'Small action-labeled video environment',artifact:'Paired continuations from the same context under changed actions.',check:'Keep context fixed and quantify the action’s effect.'},
  {number:'10',title:'Ask one research question',build:'Uncertainty-aware planning with memory and recovery',artifact:'A reproducible report with baselines, seeds, budgets, and failures.',check:'Show whether the proposed mechanism improves real decisions.'},
];
export const resources = [
  {group:'Math & probability',title:'Essence of Linear Algebra',author:'3Blue1Brown',href:'https://www.3blue1brown.com/topics/linear-algebra',purpose:'Geometric intuition for linear maps and coordinate systems.'},
  {group:'Math & probability',title:'Deep Learning',author:'Goodfellow, Bengio & Courville',href:'https://www.deeplearningbook.org/',purpose:'Probability, optimization, representation learning, and generative models.'},
  {group:'Math & probability',title:'Probabilistic Machine Learning: Advanced Topics',author:'Kevin P. Murphy',href:'https://probml.github.io/pml-book/book2.html',purpose:'A deeper reference for latent variables and probabilistic inference.'},
  {group:'Deep learning',title:'Dive into Deep Learning',author:'D2L',href:'https://d2l.ai/',purpose:'Connect mathematical explanations with executable implementations.'},
  {group:'Deep learning',title:'CS336: Language Modeling from Scratch',author:'Stanford',href:'https://cs336.stanford.edu/',purpose:'Implement sequence models and understand their training systems.'},
  {group:'Reinforcement learning',title:'Reinforcement Learning: An Introduction',author:'Sutton & Barto',href:'http://incompleteideas.net/book/the-book-2nd.html',purpose:'MDPs, Bellman equations, planning and learning; return to Dyna in Chapter 8.'},
  {group:'Reinforcement learning',title:'Reinforcement Learning lectures',author:'David Silver',href:'https://www.davidsilver.uk/teaching/',purpose:'Derive value, policy, and model-based RL ideas alongside the lectures.'},
  {group:'Reinforcement learning',title:'CS234',author:'Stanford',href:'https://web.stanford.edu/class/cs234/',purpose:'A structured course in reinforcement learning.'},
  {group:'Reinforcement learning',title:'Deep RL Course',author:'Hugging Face',href:'https://huggingface.co/learn/deep-rl-course/en/unit0/introduction',purpose:'Practical exercises to turn RL concepts into working agents.'},
  {group:'Control & planning',title:'Underactuated Robotics',author:'Russ Tedrake / MIT',href:'https://underactuated.mit.edu/',purpose:'Dynamics, state estimation, optimal control, and trajectory optimization.'},
  {group:'Control & planning',title:'Planning Algorithms',author:'Steven M. LaValle',href:'https://lavalle.pl/planning/',purpose:'Planning formulations and algorithmic foundations.'},
  {group:'Control & planning',title:'CS285: Deep Reinforcement Learning',author:'UC Berkeley',href:'https://rail.eecs.berkeley.edu/deeprlcourse/',purpose:'Connect deep RL with model-based learning and control.'},
];

// Named comparisons share a timeline position so the changed assumption is visible.
export const labViews: Record<LabKind, {
  stages: {label:string; at:number}[];
  presets: {label:string; parameters:Record<string,number>; toggles:Record<string,boolean>; at:number}[];
}> = {
  belief: {
    stages:[{label:'One frame',at:0},{label:'Possible motion',at:.5},{label:'Two futures',at:1}],
    presets:[
      {label:'Position only',parameters:{speed:.16},toggles:{history:false},at:.7},
      {label:'Add history',parameters:{speed:.16},toggles:{history:true},at:.7},
    ],
  },
  learning: {
    stages:[{label:'Initial guess',at:0},{label:'Fitting',at:.25},{label:'Fitted model',at:1}],
    presets:[
      {label:'Clean measurements',parameters:{samples:96,noise:0},toggles:{},at:1},
      {label:'Sparse + noisy',parameters:{samples:12,noise:.2},toggles:{},at:1},
      {label:'More data, same noise',parameters:{samples:192,noise:.2},toggles:{},at:1},
    ],
  },
  posterior: {
    stages:[{label:'Prior',at:0},{label:'Correction',at:.5},{label:'Posterior',at:1}],
    presets:[
      {label:'Precise observation',parameters:{observation:.6,sigma:.1},toggles:{},at:1},
      {label:'Noisy observation',parameters:{observation:.6,sigma:.7},toggles:{},at:1},
    ],
  },
  planning: {
    stages:[{label:'Sample paths',at:0},{label:'Refine',at:.4},{label:'Execute',at:.65},{label:'Outcome',at:1}],
    presets:[
      {label:'Obstacle included',parameters:{horizon:28,seed:14},toggles:{obstacle:true},at:1},
      {label:'Obstacle omitted',parameters:{horizon:28,seed:14},toggles:{obstacle:false},at:1},
    ],
  },
  uncertainty: {
    stages:[{label:'Shared state',at:0},{label:'Drift',at:.5},{label:'Longer horizon',at:1}],
    presets:[
      {label:'Open-loop prediction',parameters:{spread:.16},toggles:{correction:false},at:.8},
      {label:'With observations',parameters:{spread:.16},toggles:{correction:true},at:.8},
      {label:'Agree, but wrong',parameters:{spread:0},toggles:{correction:false},at:.8},
    ],
  },
};
