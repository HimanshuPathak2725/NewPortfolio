import { banditHistory, baselineMoments, observations, observationSigma, potentials, rolloutMoments, shapedTrajectory, slopePosterior, rewardFork, luckCredit, possibleWorld } from './models';
import study from '../../data/reward-shaping-study.json';
import credit from '../../data/credit-study.json';
import uncertainty from '../../data/uncertainty-study.json';
export const figures = {
  credit_learning: {
    comparison: true, initialProgress: 0,
    timeline: {steps:800,stride:4,label:'Update',next:200},
    presets: [{label:'Weather ±10',progress:0},{label:'Weather ±2',progress:1}],
    title:'The same expected gradient, different learning histories',
    description:'Four baselines in sampled Bernoulli policy-gradient training. Curves reveal recorded checkpoints through 800 updates. Buttons change the magnitude of independent weather noise.',
    caption:'128 seeds, 800 sampled updates, learning rate 0.05, initial logit 0. Lines show mean exact expected reward 2p; bands are ±1 standard error across seeds. Weather and weighted baselines receive the realized exogenous weather. Leaked uses the sampled reward itself. Checkpoints are recorded every four updates; playback does not interpolate experimental conditions. All four baselines are supplied analytically, not learned critics.',
    stages:['Begin at equal action probabilities.','Observe sampled updates.','Some runs recover more slowly.','Variance affects finite training.','Inspect the controls.'],
  },
  credit_sampling: {
    presets:[{label:'p = 0.1',progress:0},{label:'p = 0.5',progress:.5},{label:'p = 0.9',progress:1}],
    title:'After the weather is gone, the action is still sampled',
    description:'Exact conditional gradient outcomes after removing weather. The two action-specific estimates separate as the policy leaves probability one half. Their weighted mean still equals the true gradient. A score-weighted baseline makes both estimates coincide.',
    caption:'Exact enumeration, not measured training: score A − p, reward 2A + W. With baseline W + 2p, action 0 gives 2p² and action 1 gives 2(1 − p)². Dot areas encode action probabilities. Green shows the common estimate 2p(1 − p) produced by baseline W + 2(1 − p). Animation visits 41 enumerated probabilities from 0.1 to 0.9.',
    stages:['Action 1 is rare.','The action probabilities become more balanced.','At one half, both estimates coincide.','The source of sampling noise returns.','Action 0 is rare, but its update is large.'],
  },
  uncertainty_evidence: {
    presets:[{label:'4 observations',progress:0},{label:'32 observations',progress:3/7},{label:'512 observations',progress:1}],
    title:'A narrower interval around the wrong future',
    description:'A through-origin Gaussian linear model is fit to increasing quantities of data inside x between 0.2 and 1. Its prediction at x equals two concentrates near two, while the true mean there is zero. Held-out coverage stays near 95 percent at x equals 0.8 but collapses at two.',
    caption:'Actual Gaussian posterior fits. Top: seed 0 mean and pointwise 95% predictive intervals at x = 2, across eight nested training budgets. Dashed rust line is the true mean, 0, not a noisy observation. Bottom: predictive coverage of one independent noisy test output at each location across 256 seeds. Noise σ = 0.3; prior θ ∼ N(0,1). Test noise is held fixed across budgets. Horizontal spacing represents doublings in data, not linear sample count.',
    stages:['Four familiar observations.','More evidence inside the same region.','The line becomes better identified.','The omitted bend remains invisible.','512 observations; check the held-out coverage.'],
  },
  uncertainty_probe: {
    comparison:true,initialProgress:0,
    timeline:{steps:16,stride:1,label:'Probe',next:4},
    presets:[{label:'Probe at 0.8',progress:0},{label:'Probe at 1.25',progress:.5},{label:'Probe at 2',progress:1}],
    title:'Which observation can change the decision?',
    description:'Bayesian updates over two bending worlds, both with uncertain slope, after 32 familiar observations. Familiar probes cannot distinguish the worlds. Near-boundary probes are noisy and can favor the wrong world. Far probes discriminate strongly in this constructed example.',
    caption:'Top: posterior probability of the true downward-bending world in seed 0, initially 1/2. Each branch carries its own Gaussian slope posterior. All locations share the same probe-noise draws; σ = 0.3. Bottom: current expected-reward choice between actions 0.8 and 2 in seed 0, plus the number choosing the truly better action across 256 seeds. Probe costs are excluded. Playback reveals actual saved updates; connecting lines are visual guides.',
    stages:['Before a new measurement.','Update from a noisy observation.','Compare the live hypotheses.','Follow the resulting decision.','Sixteen probes under this design.'],
  },

  shaping_learning: {
    comparison: true,
    initialProgress: 0,
    presets: [{label:'Exploration ε = 0.1',progress:0},{label:'Exploration ε = 0.3',progress:1}],
    title: 'The same destination, very different learning histories',
    description: 'Measured greedy-policy return over 300 episodes of tabular Q-learning, averaged across 128 seeds. Ordinary rewards, an informed potential, and a misleading potential have different finite-budget learning curves despite identical optimal policies. Buttons compare exploration rates 0.1 and 0.3.',
    caption: 'Actual training runs on the two-route MDP: 128 seeds (0–127), 300 episodes, two transitions per episode, α = 0.2, γ = 0.9. Curves show exact greedy-policy value under original rewards, averaged across seeds; bands are ±1 standard error, not confidence guarantees. The informed potential uses the known intermediate values (2, 1); the misleading potential is (−5, 5). Only ε changes between views. Playback reveals the recorded episodes in order; no values are interpolated between runs. Evaluation uses uniform greedy ties and no exploration.',
    stages: ['Exploration ε = 0.1.','Exploration ε = 0.1.','Exploration ε = 0.3.','Exploration ε = 0.3.','Exploration ε = 0.3.'],
  },
  shaping_identity: {
    duration: 4500,
    initialProgress: 0,
    presets: [{label:'Raw Q-values',progress:0},{label:'Account for the potential',progress:1}],
    title: 'The control that reproduced every action',
    description: 'In seed zero, the misleading-shaped learner and the learner initialized with the same potential have raw Q-values separated by five at the upper intermediate state. Adding that potential to the shaped values makes their curves coincide. Across all 128 seeds, each of three matched pairs has zero action mismatches.',
    caption: 'Top: all 300 post-episode estimates for the upper intermediate state in seed 0, ε = 0.1. Shaped Q starts at 0; original-reward Q initialized with Φ starts at −5. Bottom: comparisons cover every transition and every start action across all 128 seeds. Shared exploration draws and uniform tie-breaking with tolerance 10⁻¹² couple each pair. Playback moves the shaped curve by the coordinate offset from 0 to −5; intermediate offsets are an illustration, not new measurements. Maximum absolute TD-residual or shifted-Q discrepancy: 1.78 × 10⁻¹⁵.',
    stages: ['Raw numbers use different reward conventions.','Raw numbers use different reward conventions.','Shift the shaped values by Φ = −5.','Shift the shaped values by Φ = −5.','The learning histories agree after the shift.'],
  },
  fork: {
    presets: [{label:'Original payments',progress:0},{label:'Redistributed payments',progress:1}],
    title: 'Punish the better move. Preserve the better route.',
    description: 'Two routes have task returns 1.8 and 0.9. Changing intermediate potentials from zero to minus five and plus five makes their first rewards minus 4.5 and plus 4.5. Their discounted returns and advantages do not change.',
    caption: 'Original construction: two deterministic two-transition routes, γ = 0.9. Start and terminal potentials are zero. The animation changes the intermediate potential, not the agent or its actions. Return and advantage are computed exactly; the reference policy chooses each route with probability 1/2.',
    stages: ['Begin with rewards only at the endpoint.','Introduce a potential at each intermediate state.','Immediate rewards now favor the worse route.','The next payment compensates for the first.','Return and advantage remain unchanged.'],
  },
  luck: {
    presets: [{label:'Ordinary baseline',progress:0},{label:'Remove weather',progress:.5},{label:'Leak the reward',progress:1}],
    title: 'A better action, punished by a bad draw',
    description: 'Four equiprobable outcomes of R equals 2 A plus independent weather W. An ordinary baseline produces gradient estimates minus 4.5 or plus 5.5. A weather-conditioned baseline gives 0.5 every time. A baseline equal to the reward erases the gradient entirely.',
    caption: 'Exact enumeration of A ∼ Bernoulli(1/2), W ∈ {−10, +10} independently and equiprobably, R = 2A + W. Each dot is an outcome, not an empirical sample. Steps first remove exogenous weather, then deliberately leak the action-dependent reward into the baseline. The latter lowers the variance while biasing the gradient to zero.',
    stages: ['An ordinary baseline: half the updates point the wrong way.','Account for some of the independent weather.','All four estimates equal the correct gradient, 0.5.','Now make the invalid baseline depend on the reward.','No variance, no learning: every estimate is zero.'],
  },
  worlds: {
    presets: [{label:'Observed evidence',progress:0},{label:'Possible worlds',progress:.5},{label:'Reveal a probe',progress:1}],
    title: 'The same evidence. Opposite decisions.',
    description: 'Two noiseless functions both equal x on the observed interval zero to one. Beyond one, one bends upward and the other downward. At action x equals two their rewards are four and zero, while the known action x equals 0.8 gives 0.8 in both worlds. A new observation at two identifies the downward world in this constructed two-world model.',
    caption: 'A noiseless identifiability counterexample, not a fitted ensemble: f₊(x) = x + 2 max(0, x − 1)² and f₋(x) = x − 2 max(0, x − 1)². Available decisions are x = 0.8 and x = 2; reward equals f(x). All observations in [0, 1] are compatible with both worlds. The final reveal assumes the lower world and an allowed noiseless probe at x = 2.',
    stages: ['All observed inputs are at or below one.','Outside the data, two compatible worlds diverge.','The unexplored action has incompatible consequences.','In this example we are allowed to probe that action.','The new observation distinguishes the two worlds.'],
  },
  potential: {
    title: 'A different signal, the same ordering',
    description: 'A five-state chain with potential increasing from minus four to zero. Discounted shaping terms sum to four; the original discounted return is 0.729 and the shaped return is 4.729.',
    caption: 'A deterministic chain, γ = 0.9. Reward is 1 only on the final transition. The blue path is the potential, not the value function. Every intermediate potential cancels after discounting; only the boundary remains.',
    stages: ['Start with a potential of −4.', 'The first transition contributes 1.30.', 'The next discounted contribution is 1.08.', 'The third contributes 0.891.', 'The final 0.729 closes the sum at 4.'],
  },
  cycle: {
    title: 'Can the agent get paid for going in circles?',
    description: 'Two round trips between states with potentials zero and one. At discount one, potential shaping sums to zero while a bonus paid on each arrival at the second state grows to two.',
    caption: 'A finite four-transition walk with γ = 1 and zero task reward. A bonus for entering B can be harvested repeatedly. The potential difference gives +1 on arrival and −1 on departure. This loop calculation does not claim convergence for a continuing undiscounted task.',
    stages: ['Both extra returns begin at zero.', 'A → B: both signals pay +1.', 'B → A: the potential repays −1.', 'A → B: the arrival bonus pays again.', 'Back at A: potential sum 0; arrival bonuses 2.'],
  },
  policy: {
    title: 'Moving probability, one exact gradient at a time',
    description: 'A three-action bandit with rewards one, two, and four. Exact gradient ascent in softmax logits shifts probability toward the best action and increases expected reward.',
    caption: 'Exact expectation, not sampled REINFORCE: three deterministic rewards, equal initial logits, step size 0.18, 40 logit updates. The lower plot records the objective after each update. No critic, entropy bonus, or neural network is involved.',
    stages: ['Equal probabilities: J = 7/3.', 'Probability moves toward the highest reward.', 'The middle action loses probability too.', 'Further improvement becomes more gradual.', 'Forty updates; a local gradient is not a finite-step guarantee.'],
  },
  baseline: {
    title: 'The mean stays; the noise moves',
    description: 'For two equiprobable actions with rewards one and three, the two possible scalar gradient estimates are minus 0.5 and 1.5 without a baseline. At baseline two, both estimates equal the exact gradient 0.5.',
    caption: 'A one-parameter Bernoulli policy at p = 1/2. Each dot is one possible gradient estimate, each with probability 1/2. Subtracting b = 2 makes both estimates equal 0.5 in this special deterministic bandit. Zero variance is not typical in sequential problems.',
    stages: ['b = 0: estimates −0.5 and 1.5.', 'Center the rewards while preserving the mean.', 'The estimates approach one another.', 'Their spread shrinks further.', 'b = 2: both estimates are exactly 0.5.'],
  },
  posterior: {
    title: 'More evidence narrows one kind of uncertainty',
    description: 'Exact Bayesian linear regression through the origin. Eight fixed illustrative observations narrow the posterior uncertainty in the slope. The predictive interval remains wider because observation noise is still present.',
    caption: 'An exact conjugate calculation: y = θx + ε, prior θ ∼ N(0, 1), known noise σ = 0.3. Points are fixed illustrative data, not experimental measurements. Dark band: 95% posterior interval for the mean function. Light band: 95% predictive interval for a new observation. No observations lie beyond x = 1.',
    stages: ['One point leaves the slope poorly determined.', 'Three observations constrain the slope.', 'Five observations refine the posterior.', 'Six observations reduce parameter variance.', 'Eight points; irreducible noise remains under this model.'],
  },
  horizon: {
    title: 'A persistent mistake compounds differently from fresh noise',
    description: 'A scalar random walk with uncertain fixed drift has epistemic variance proportional to horizon squared and process variance proportional to horizon. Redrawing the drift at each step produces a different, narrower distribution.',
    caption: 'xₜ₊₁ = xₜ + 0.4 + θ + εₜ, x₀ = 0. Draw θ ∼ N(0, 0.12²) once per trajectory; draw εₜ ∼ N(0, 0.2²) independently each step. The fan is the exact marginal 95% predictive interval. The lower plot compares variance contributions, including the counterfactual of resampling θ each step.',
    stages: ['Begin with a known state.', 'Independent noise adds linearly in variance.', 'Persistent drift uncertainty grows quadratically.', 'The model identity matters throughout a rollout.', 'At step 20: drift variance 5.76; process variance 0.80.'],
  },
} as const;
export type FigureId = keyof typeof figures;
export function stageDescription(id:FigureId,p:number,reveal=1) {
  if(id==='credit_learning') {
    const d=p<.5?credit.high:credit.low,k=Math.floor(Math.max(0,Math.min(1,reveal))*200);
    return `Update ${k*4}: expected reward ${d.curves.ordinary[k][1].toFixed(3)} with the ordinary baseline and ${d.curves.weather[k][1].toFixed(3)} after removing weather. Weather magnitude ${d.amplitude}.`;
  }
  if(id==='credit_sampling') {
    const d=credit.frozen[Math.min(40,Math.floor(p*40))];
    return `p = ${d.p.toFixed(2)}. Both valid baselines have mean gradient ${d.moments.weather.mean.toFixed(3)}. Weather-only variance ${d.moments.weather.variance.toFixed(3)}; weighted variance is zero up to roundoff.`;
  }
  if(id==='uncertainty_evidence') {
    const d=uncertainty.coverage[Math.min(7,Math.floor(p*7))];
    return `${d.n} observations: held-out predictive coverage ${d.inside_count}/256 at x = 0.8 and ${d.outside_count}/256 at x = 2.`;
  }
  if(id==='uncertainty_probe') {
    const d=uncertainty.probes[p<.25?'familiar':p<.75?'edge':'far'],k=Math.floor(Math.max(0,Math.min(1,reveal))*16),s=d.states[k];
    return `Probe ${k} at x = ${d.x}. Seed 0 assigns ${(s.lower_probability*100).toFixed(1)}% to the downward world and chooses action ${s.chosen_action}. ${d.correct_decisions_by_round[k]}/256 runs choose the truly better action.`;
  }

  if(id==='shaping_learning') {
    const data=p<.5?study.main:study.exploration,episode=Math.floor(Math.max(0,Math.min(1,reveal))*300);
    return `Episode ${episode}: ${data.curves.hostile[episode][2]} / 128 misleading-shaped learners prefer the upper route; ${data.curves.plain[episode][2]} / 128 ordinary learners do. ε = ${data.config.epsilon}.`;
  }
  if(id==='shaping_identity')return p===0?'Different raw Q-values, identical behavior: the difference at this state is Φ = −5.':p<1?`Applying the coordinate shift: Qshaped + (${(-5*p).toFixed(2)}). These intermediate offsets illustrate the transformation, not extra training runs.`:'After shifting: the largest discrepancy in any audited pair is below 1.8 × 10⁻¹⁵. No start actions differ.';
  if(id==='fork') {
    const [upper,lower]=rewardFork(p);
    return `Immediate rewards: upper ${upper.first.toFixed(2)}, lower +${lower.first.toFixed(2)}. Discounted returns stay 1.80 and 0.90.`;
  }
  if(id==='luck') {
    const m=luckCredit(Math.min(1,2*p),Math.max(0,2*p-1));
    return `${p<=.5?'Removing independent weather':'Leaking reward into the baseline'}: mean update ${m.mean.toFixed(2)}, variance ${m.variance.toFixed(2)}. True gradient: 0.50.`;
  }
  if(id==='posterior') {
    const n=1+Math.round(p*7),v=slopePosterior(n).variance;
    return `${n} ${n===1?'observation':'observations'}: slope variance ${v.toFixed(3)}; observation variance stays at 0.090.`;
  }
  if(id==='baseline') {
    const b=2*p,m=baselineMoments(b);
    return `Baseline ${b.toFixed(2)}: mean gradient ${m.mean.toFixed(2)}, variance ${m.variance.toFixed(3)}.`;
  }
  if(id==='policy') {
    const h=banditHistory(),t=p*40,i=Math.min(39,Math.floor(t)),f=t-i;
    return `Update ${Math.floor(t)} of 40: expected reward ${(h[i].value+f*(h[i+1].value-h[i].value)).toFixed(3)}. Motion interpolates between discrete updates.`;
  }
  if(id==='horizon') {
    const k=p*20,m=rolloutMoments(k);
    return `Horizon ${k.toFixed(1)}: fixed-drift variance ${m.epistemic.toFixed(2)}, process variance ${m.aleatoric.toFixed(2)}.`;
  }
  return figures[id].stages[Math.min(4,Math.floor(p*4))];
}
const C = { ink: 'var(--ink,#262723)', muted: 'var(--muted,#6a6864)', green: 'var(--link,#476e49)', blue: 'var(--brand,#5b6c8b)', rust: 'var(--warm,#946655)', paper: 'var(--paper,#fef9ed)' };
const esc = (s: string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text = (x:number,y:number,s:string,color=C.muted,size=16,anchor='start') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;
const line = (x:number,y:number,x2:number,y2:number,color=C.muted,dash='') => `<path d="M${x} ${y}L${x2} ${y2}" stroke="${color}" stroke-width="1.2" fill="none" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
const dot = (x:number,y:number,color=C.blue,r=4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const path = (points:number[][],color=C.blue,width=2.5,dash='') => `<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
const band = (upper:number[][],lower:number[][],color:string,opacity:number) => `<path d="${upper.concat([...lower].reverse()).map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')}Z" fill="${color}" opacity="${opacity}"/>`;
const series = (count:number,f:(x:number)=>number[]) => Array.from({length:count+1},(_,i)=>f(i/count));
function axes(x:number,y:number,w:number,h:number,xticks:[number,string][],yticks:[number,string][]) {
  return line(x,y,x,y+h)+line(x,y+h,x+w,y+h)+xticks.map(([t,label])=>line(x+t*w,y+h,x+t*w,y+h+5)+text(x+t*w,y+h+25,label,C.muted,14,t===1?'end':'middle')).join('')+yticks.map(([t,label])=>line(x-5,y+(1-t)*h,x,y+(1-t)*h)+text(x-10,y+(1-t)*h+5,label,C.muted,14,'end')).join('');
}
export function renderFigure(id:FigureId, progress=1, compact=false, exported=false, reveal=1) {
  const p=Math.max(0,Math.min(1,progress)), w=compact?400:760, left=48, right=w-24, width=right-left;
  const height=compact?570:540, top=62, plotH=170, second=335, plot2H=130;
  const meta=figures[id]; let art='';
  if(id==='credit_learning') {
    const d=p<.5?credit.high:credit.low,k=Math.floor(Math.max(0,Math.min(1,reveal))*200),ph=220;
    const x=(t:number)=>left+t/800*width,y=(v:number)=>top+ph-v/2.1*ph;
    art+=text(left,26,`a  Expected reward · weather ±${d.amplitude}`,C.ink,compact?16:19);
    art+=axes(left,top,width,ph,[[0,'0'],[.5,'400'],[1,'800 updates']],[[0,'0'],[1/2.1,'1'],[2/2.1,'2']]);
    for(const [name,col,dash] of [['ordinary',C.blue,''],['weather',C.green,''],['weighted',C.ink,'3 4'],['leaked',C.rust,'7 4']] as const){
      const pts=d.curves[name].slice(0,k+1);
      art+=band(pts.map(v=>[x(v[0]),y(Math.min(2,v[1]+v[2]))]),pts.map(v=>[x(v[0]),y(Math.max(0,v[1]-v[2]))]),col,.1);
      art+=path(pts.map(v=>[x(v[0]),y(v[1])]),col,2.3,dash)+dot(x(k*4),y(pts[k][1]),col,3.5);
    }
    art+=text(left,340,`b  At update ${k*4}`,C.ink,19);
    [['ordinary','Ordinary',C.blue],['weather','Weather removed',C.green],['weighted','Score-weighted',C.ink],['leaked','Reward leaked',C.rust]].forEach(([name,label,col],i)=>{
      const yy=380+i*35;
      art+=text(left,yy,label,col,compact?16:18)+text(right,yy,d.curves[name as keyof typeof d.curves][k][1].toFixed(3),col,20,'end');
    });
    art+=text(left,height-15,'Dashed gray: weighted · rust: leaked',C.muted,compact?14:17);
  } else if(id==='credit_sampling') {
    const k=Math.min(40,Math.floor(p*40)),d=credit.frozen[k],prob=d.p,ph=220;
    const x=(v:number)=>left+(v-.1)/.8*width,y=(v:number)=>top+ph-v/1.8*ph;
    art+=text(left,26,'a  Possible gradients after removing weather',C.ink,compact?14:19);
    art+=axes(left,top,width,ph,[[0,'p = 0.1'],[.5,'0.5'],[1,'0.9']],[[0,'0'],[.5/1.8,'0.5'],[1/1.8,'1'],[1.5/1.8,'1.5']]);
    art+=path(credit.frozen.map(v=>[x(v.p),y(2*v.p*v.p)]),C.blue)+path(credit.frozen.map(v=>[x(v.p),y(2*(1-v.p)**2)]),C.rust);
    art+=path(credit.frozen.map(v=>[x(v.p),y(v.moments.weighted.mean)]),C.green,2,'4 4');
    art+=line(x(prob),top,x(prob),top+ph,C.muted,'2 5');
    art+=dot(x(prob),y(2*prob*prob),C.blue,12*Math.sqrt(1-prob))+dot(x(prob),y(2*(1-prob)**2),C.rust,12*Math.sqrt(prob));
    art+=text(left,327,'Blue: A = 0',C.blue,16)+text(right,327,'Rust: A = 1',C.rust,16,'end');
    art+=text(left,365,`b  Current policy · p = ${prob.toFixed(2)}`,C.ink,19);
    art+=text(left,407,'Mean, either baseline',C.muted,compact?16:18)+text(right,407,d.moments.weather.mean.toFixed(3),C.green,22,'end');
    art+=text(left,447,'Weather-only variance',C.muted,compact?16:18)+text(right,447,d.moments.weather.variance.toFixed(3),C.blue,22,'end');
    art+=text(left,487,'Weighted variance',C.muted,compact?16:18)+text(right,487,'0.000',C.green,22,'end');
    art+=text(left,height-15,'Green: both outcomes with weighted baseline.',C.green,compact?13:17);
  } else if(id==='uncertainty_evidence') {
    const k=Math.min(7,Math.floor(p*7)),rows=uncertainty.coverage.slice(0,k+1),d=rows[k],ph=220;
    const x=(i:number)=>left+i/7*width,y=(v:number)=>top+ph-(v+.4)/3.6*ph;
    art+=text(left,26,'a  Prediction at x = 2 · seed 0',C.ink,18);
    art+=axes(left,top,width,ph,[[0,'4'],[3/7,'32'],[1,'512 samples']],[[.4/3.6,'0'],[1.4/3.6,'1'],[2.4/3.6,'2'],[3.4/3.6,'3']]);
    art+=line(left,y(0),right,y(0),C.rust,'5 4');
    rows.forEach((r,i)=>{art+=line(x(i),y(r.seed_0_mean-r.seed_0_radius),x(i),y(r.seed_0_mean+r.seed_0_radius),C.blue)+line(x(i)-4,y(r.seed_0_mean-r.seed_0_radius),x(i)+4,y(r.seed_0_mean-r.seed_0_radius),C.blue)+line(x(i)-4,y(r.seed_0_mean+r.seed_0_radius),x(i)+4,y(r.seed_0_mean+r.seed_0_radius),C.blue)+dot(x(i),y(r.seed_0_mean),C.blue,4);});
    art+=text(left,334,'Rust: true mean · Blue: 95% predictive',C.muted,compact?14:17);
    art+=text(left,380,`b  Held-out coverage · n = ${d.n}`,C.ink,compact?17:20);
    art+=text(left,427,'Familiar x = 0.8',C.green,18)+text(right,427,`${d.inside_count} / 256`,C.green,21,'end');
    art+=text(left,473,'Unseen x = 2',C.rust,18)+text(right,473,`${d.outside_count} / 256`,C.rust,21,'end');
    art+=text(left,height-15,'95% is the claim. Coverage is the check.',C.muted,compact?14:18);
  } else if(id==='uncertainty_probe') {
    const d=uncertainty.probes[p<.25?'familiar':p<.75?'edge':'far'],k=Math.floor(Math.max(0,Math.min(1,reveal))*16),state=d.states[k],ph=220;
    const x=(t:number)=>left+t/16*width,y=(v:number)=>top+ph-v*ph;
    art+=text(left,26,`a  P(downward world) · probe x = ${d.x}`,C.ink,compact?15:19);
    art+=axes(left,top,width,ph,[[0,'0'],[.5,'8'],[1,'16 probes']],[[0,'0'],[.5,'0.5'],[1,'1']]);
    art+=line(left,y(.5),right,y(.5),C.muted,'3 5');
    art+=path(d.states.slice(0,k+1).map(s=>[x(s.round),y(s.lower_probability)]),C.blue)+dot(x(k),y(state.lower_probability),C.blue,5);
    art+=text(left,343,`b  Decision after ${k} probes`,C.ink,20);
    art+=text(left,391,'Seed 0 chooses',C.muted,18)+text(right,391,`x = ${state.chosen_action}`,C.ink,21,'end');
    art+=text(left,436,'True expected reward',C.muted,compact?16:18)+text(right,436,state.true_expected_reward.toFixed(1),C.rust,21,'end');
    art+=text(left,481,'Choose better · all seeds',C.muted,compact?15:18)+text(right,481,`${d.correct_decisions_by_round[k]} / 256`,C.green,21,'end');
    art+=text(left,height-15,'Fixed hypotheses; probe costs excluded.',C.muted,compact?14:17);
  } else if(id==='shaping_learning') {
    const episode=Math.floor(Math.max(0,Math.min(1,reveal))*300);
    const data=p<.5?study.main:study.exploration,ph=225,x=(t:number)=>left+t/300*width,y=(v:number)=>top+ph-(v-.8)/1.1*ph;
    art+=text(left,26,`a  Greedy return · ε = ${data.config.epsilon}`,C.ink,18);
    art+=axes(left,top,width,ph,[[0,'0'],[1/3,'100'],[2/3,'200'],[1,compact?'300 ep.':'300 episodes']],[[.1/1.1,'0.9'],[.55/1.1,'1.35'],[1/1.1,'1.8']]);
    for(const [id,color,dash] of [['plain',C.blue,''],['helpful',C.green,''],['hostile',C.rust,'5 4']] as const){
      const points=data.curves[id].slice(0,episode+1);
      art+=band(points.map((v,i)=>[x(i),y(Math.min(1.8,v[0]+v[1]))]),points.map((v,i)=>[x(i),y(Math.max(.9,v[0]-v[1]))]),color,.12);
      art+=path(points.map((v,i)=>[x(i),y(v[0])]),color,2.3,dash);
      art+=dot(x(episode),y(points[episode][0]),color,4);
    }
    art+=text(left,330,'Ordinary',C.blue,15)+text(left+98,330,'Informed',C.green,15)+text(left+202,330,'Misleading',C.rust,15);
    art+=line(x(episode),top,x(episode),top+ph,C.muted,'2 5');
    art+=text(left,380,`b  Prefer upper · episode ${episode}`,C.ink,compact?17:20);
    const rows=[['plain','Ordinary',C.blue],['helpful','Informed',C.green],['hostile','Misleading',C.rust]] as const;
    rows.forEach(([id,label,col],i)=>{const yy=417+i*37;art+=text(left,yy,label,col,17)+text(right,yy,`${data.curves[id][episode][2]} / 128`,col,21,'end');});
    art+=text(left,height-15,'Evaluation always uses the original reward.',C.muted,compact?14:17);
  } else if(id==='shaping_identity') {
    const aligned=p>0,ph=215,x=(t:number)=>left+t/300*width,y=(v:number)=>top+ph-(v+6)/14*ph;
    art+=text(left,26,aligned?'a  Shifted estimates · upper state':'a  Raw estimates · upper state',C.ink,compact?17:19);
    art+=axes(left,top,width,ph,[[0,'0'],[1/3,'100'],[2/3,'200'],[1,compact?'300 ep.':'300 episodes']],[[1/14,'−5'],[6/14,'0'],[11/14,'5']]);
    art+=path(study.main.trace.shaped.map((v,i)=>[x(i),y(v-5*p)]),C.rust,3.5);
    art+=path(study.main.trace.initialized.map((v,i)=>[x(i),y(v)]),C.blue,2,'5 4');
    art+=text(left,318,aligned?'Rust: shifted shaped Q':'Rust: shaped Q',C.rust,16)+text(left,345,'Dashed blue: initialized Q',C.blue,16);
    art+=text(left,394,'b  Action mismatches · all seeds',C.ink,compact?17:20);
    ['Informed ↔ initialized','Misleading ↔ initialized','Compensated ↔ ordinary'].forEach((label,i)=>{const yy=430+i*34;art+=text(left,yy,label,C.muted,compact?15:17)+text(right,yy,'0',C.green,22,'end');});
    art+=text(left,height-15,'38,400 decisions checked per pair.',C.muted,compact?15:17);
  } else if(id==='fork') {
    const routes=rewardFork(p),sx=left+16,mx=w*.53,ex=right-16,cy=160;
    art+=text(left,26,'a  Change only the reward convention',C.ink,compact?16:18);
    for(let i=0;i<2;i++) {
      const r=routes[i],y=i===0?78:240,col=i===0?C.blue:C.rust;
      art+=line(sx,cy,mx,y,col)+line(mx,y,ex,cy,col);
      art+=dot(mx,y,col,6)+text(mx,y+(i===0?-14:28),`Φ = ${r.phi.toFixed(1)}`,col,17,'middle');
      art+=text((sx+mx)/2-4,(cy+y)/2+(i===0?-10:22),r.first.toFixed(2),col,18,'middle');
      art+=text((mx+ex)/2+8,(cy+y)/2+(i===0?-10:22),r.second.toFixed(2),col,18,'middle');
    }
    art+=dot(sx,cy,C.ink,7)+dot(ex,cy,C.ink,7)+text(sx,cy+30,'start',C.muted,14,'middle')+text(ex,cy+30,'end',C.muted,14,'middle');
    art+=text(left,315,'b  What the policy still prefers',C.ink,18);
    art+=text(left,350,'Route',C.muted,14)+text(w*.6,350,'Return',C.muted,14,'end')+text(right,350,'Advantage',C.muted,14,'end');
    routes.forEach((r,i)=>{const y=390+i*55,col=i===0?C.blue:C.rust;art+=text(left,y,r.name,col,20)+text(w*.6,y,r.total.toFixed(2),col,22,'end')+text(right,y,`${r.advantage>0?'+':''}${r.advantage.toFixed(2)}`,col,22,'end');});
    art+=text(left,height-35,'The immediate sign is not the preference.',C.ink,compact?15:20);
    art+=text(left,height-9,'A′π(s, a) = Aπ(s, a)',C.green,19);
  } else if(id==='luck') {
    const weather=Math.min(1,p*2),leak=Math.max(0,p*2-1),m=luckCredit(weather,leak);
    const ax=left+30,wx=right-35,rx=w/2;
    art+=text(left,26,'a  Two causes of the same outcome',C.ink,compact?16:18);
    art+=text(ax,83,'Action A',C.blue,19,'middle')+text(wx,83,'Weather W',C.rust,19,'middle');
    art+=line(ax,98,rx-15,138,C.blue)+line(wx,98,rx+15,138,C.rust);
    art+=`<path d="M${rx-15} 138l-10 -1 4 -7Z" fill="${C.blue}"/><path d="M${rx+15} 138l10 -1 -4 -7Z" fill="${C.rust}"/>`;
    art+=text(rx,169,'R = 2A + W',C.ink,24,'middle');
    art+=text(left,211,p===0?'Baseline = 1':p<=.5?`Baseline = 1 + ${weather.toFixed(2)}W`:`Baseline = ${(1-leak).toFixed(2)}(1 + W) + ${leak.toFixed(2)}R`,p<=.5?C.green:C.rust,compact?16:20);
    art+=text(left,252,'b  Four possible gradient estimates',C.ink,compact?16:18);
    const px=(v:number)=>left+(v+6)/12*width;
    art+=line(px(.5),273,px(.5),455,C.green,'4 4');
    m.outcomes.forEach((o,i)=>{
      const y=291+i*49;
      art+=text(left,y,`A=${o.action}, W=${o.weather>0?'+':''}${o.weather}`,C.muted,13);
      art+=line(left,y+13,right,y+13,C.muted,'2 5')+dot(px(o.gradient),y+13,o.action===1?C.blue:C.rust,6);
      art+=text(right,y,o.gradient.toFixed(2),o.action===1?C.blue:C.rust,14,'end');
    });
    art+=text(left,487,`Mean ${m.mean.toFixed(2)} · Variance ${m.variance.toFixed(2)}`,C.ink,20);
    art+=text(left,height-15,'Dashed vertical: correct gradient = 0.5',C.green,compact?14:17);
  } else if(id==='worlds') {
    const ph=265,x=(v:number)=>left+v/2*width,y=(v:number)=>top+ph-v/4.5*ph;
    art+=text(left,26,'a  Where the evidence ends',C.ink,18);
    art+=`<rect x="${left}" y="${top}" width="${width/2}" height="${ph}" fill="${C.blue}" opacity=".07"/>`;
    art+=axes(left,top,width,ph,[[0,'0'],[.5,'1'],[1,'2 · action x']],[[0,'0'],[2/4.5,'2'],[4/4.5,'4']]);
    art+=line(x(1),top,x(1),top+ph,C.muted,'4 4')+text(left+10,top+21,'observed inputs',C.muted,14);
    art+=path(series(40,u=>[x(u),y(u)]),C.ink,2.5);
    for(let i=1;i<=7;i++)art+=dot(x(i/7),y(i/7),C.ink,3.5);
    const extent=1+Math.min(1,p*4);
    for(const world of ['upper','lower'] as const)art+=path(series(60,u=>{const v=1+u*(extent-1);return [x(v),y(possibleWorld(v,world))];}),world==='upper'?C.blue:C.rust,2.5,world==='lower'?'6 4':'');
    if(p>=.5)art+=dot(x(2),y(4),C.blue,6)+dot(x(2),y(0),C.rust,6);
    if(p>=.75){const probe=1+Math.min(1,(p-.75)*4);art+=dot(x(probe),y(possibleWorld(probe,'lower')),C.ink,8);}
    art+=text(left,390,'b  Which action earns more?',C.ink,18);
    art+=text(left,422,'World',C.muted,14)+text(w*.61,422,'x = 0.8',C.muted,14,'end')+text(right,422,'x = 2',C.muted,14,'end');
    art+=text(left,453,'Upper',C.blue,18)+text(w*.61,453,'0.8',C.blue,18,'end')+text(right,453,p>=.5?'4.0':'?',C.blue,18,'end');
    art+=text(left,483,'Lower',C.rust,18)+text(w*.61,483,'0.8',C.rust,18,'end')+text(right,483,p>=.5?'0.0':'?',C.rust,18,'end');
    art+=text(left,height-16,p===1?'Probe observed 0 → lower world.':'Same data cannot select the right row.',C.ink,compact?15:19);
  } else if(id==='potential') {
    const steps=shapedTrajectory(), phase=p*4, index=Math.min(3,Math.floor(phase)), fraction=Math.min(1,phase-index);
    const x=(i:number)=>left+i*width/4, y=(v:number)=>top-v/4*plotH;
    art+=text(left,26,'a  A potential along the route',C.ink,18);
    art+=axes(left,top,width,plotH,[],[[0,'−4'],[.5,'−2'],[1,'0']]);
    art+=path(potentials.map((v,i)=>[x(i),y(v)]),C.blue);
    potentials.forEach((v,i)=>{ art+=dot(x(i),y(v),C.blue)+text(x(i),260,i===4?'goal':`s${i}`,C.muted,15,'middle'); });
    art+=dot(x(index+fraction),y(potentials[index]+fraction),C.rust,7);
    art+=text(left,second-25,'b  Discounted shaping contributions',C.ink,18);
    let total=0;
    steps.forEach((step,i)=>{
      const amount=Math.max(0,Math.min(1,phase-i)), seg=width/4;
      art+=text(left+seg*i+seg/2,second+27,step.discounted.toFixed(3),C.blue,compact?16:21,'middle');
      art+=`<rect x="${left+seg*i+4}" y="${second+45}" width="${(seg-8)*amount}" height="4" fill="${C.blue}"/>`;
      art+=text(left+seg*i+seg/2,second+75,`t = ${i}`,C.muted,14,'middle');
      total+=step.discounted*amount;
    });
    art+=text(left,second+120,`Sum so far: ${total.toFixed(3)}`,C.ink,22);
    art+=text(left,height-22,'G′ − G = −Φ(s₀) = 4',C.green,19);
  } else if(id==='cycle') {
    const phase=p*4, x=(t:number)=>left+t*width/4, y=(v:number)=>second+plot2H-v*55;
    const ax=w*.26,bx=w*.76,cy=132;
    art+=text(left,26,'a  A repeatable two-state walk',C.ink,18);
    art+=`<path d="M${ax+15} ${cy-12}Q${w/2} 40 ${bx-15} ${cy-12} M${bx-15} ${cy+12}Q${w/2} 224 ${ax+15} ${cy+12}" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`;
    art+=dot(ax,cy,C.blue,9)+dot(bx,cy,C.blue,9)+text(ax,cy+37,'A · Φ = 0',C.ink,17,'middle')+text(bx,cy+37,'B · Φ = 1',C.ink,17,'middle');
    art+=text(w/2,65,'→  +1',C.blue,18,'middle')+text(w/2,235,'←  −1',C.blue,18,'middle');
    const leg=Math.min(3,Math.floor(phase)),t=Math.min(1,phase-leg),forward=leg%2===0;
    art+=dot(forward?ax+(bx-ax)*t:bx-(bx-ax)*t,cy+(forward?-1:1)*4*t*(1-t)*68,C.rust,7);
    art+=text(left,second-27,'b  Accumulated extra reward',C.ink,18);
    art+=axes(left,second,width,plot2H,[0,1,2,3,4].map(i=>[i/4,String(i)]),[[0,'0'],[55/plot2H,'1'],[110/plot2H,'2']]);
    art+=path([0,1,0,1,0].map((v,i)=>[x(i),y(v)]),C.blue,2.5);
    art+=path([0,1,1,2,2].map((v,i)=>[x(i),y(v)]),C.rust,2.5,'6 4');
    const a=[0,1,0,1,0],b=[0,1,1,2,2];
    art+=dot(x(phase),y(a[leg]+t*(a[leg+1]-a[leg])),C.blue,6)+dot(x(phase),y(b[leg]+t*(b[leg+1]-b[leg])),C.rust,6);
    art+=text(left,height-25,'Solid: potential   ·   Dashed: arrival bonus',C.muted,compact?14:16);
  } else if(id==='policy') {
    const history=banditHistory(),t=p*40,i=Math.min(39,Math.floor(t)),f=t-i;
    const probs=history[i].probabilities.map((v,j)=>v+f*(history[i+1].probabilities[j]-v));
    const value=probs.reduce((s,v,j)=>s+v*[1,2,4][j],0);
    art+=text(left,26,'a  Probability under the policy',C.ink,18);
    art+=axes(left,top,width,plotH,[],[[0,'0'],[.5,'.5'],[1,'1']]);
    probs.forEach((v,j)=>{const cx=left+width*(j+.5)/3,bw=compact?46:86;art+=`<rect x="${cx-bw/2}" y="${top+plotH*(1-v)}" width="${bw}" height="${plotH*v}" fill="${[C.rust,C.blue,C.green][j]}" opacity=".75"/>`+text(cx,top+plotH*(1-v)-9,v.toFixed(2),C.ink,17,'middle')+text(cx,top+plotH+28,`${['A','B','C'][j]} · r=${[1,2,4][j]}`,C.muted,16,'middle');});
    art+=text(left,second-27,`b  Expected reward · J = ${value.toFixed(3)}`,C.ink,18);
    const x=(k:number)=>left+k/40*width,y=(v:number)=>second+plot2H-(v-2)/2*plot2H;
    art+=axes(left,second,width,plot2H,[[0,'0'],[.5,'20'],[1,'40 updates']],[[0,'2'],[.5,'3'],[1,'4']]);
    art+=path(history.map((s,j)=>[x(j),y(s.value)]),C.green);
    art+=dot(x(t),y(value),C.rust,6);
    art+=text(left,height-22,'∂J/∂zᵢ = pᵢ(rᵢ − J)',C.green,20);
  } else if(id==='baseline') {
    const b=p*2,m=baselineMoments(b),x=(v:number)=>left+(v+.75)/2.5*width;
    art+=text(left,26,`a  Possible estimates · b = ${b.toFixed(2)}`,C.ink,18);
    art+=line(x(.5),top-2,x(.5),top+174,C.green,'4 4');
    art+=text(x(.5),top+195,'mean = 0.5',C.green,16,'middle');
    const y1=top+47,y2=top+118;
    art+=line(left,y1,right,y1)+line(left,y2,right,y2);
    art+=text(left,top+19,'action 0 · reward 1',C.blue,16)+text(left,top+91,'action 1 · reward 3',C.rust,16);
    art+=dot(x(m.left),y1,C.blue,8)+dot(x(m.right),y2,C.rust,8);
    art+=text(x(m.left),y1+26,m.left.toFixed(2),C.blue,16,'middle')+text(x(m.right),y2+26,m.right.toFixed(2),C.rust,16,'middle');
    art+=text(left,second-27,'b  Variance of the gradient estimate',C.ink,18);
    art+=axes(left,second,width,plot2H,[[0,'b = 0'],[.5,'1'],[1,'2']],[[0,'0'],[.5,'.5'],[1,'1']]);
    art+=path(series(60,u=>[left+u*width,second+plot2H*(1-baselineMoments(2*u).variance)]),C.green);
    art+=dot(left+p*width,second+plot2H*(1-m.variance),C.rust,6);
    art+=text(left,height-22,`E[g] = ${m.mean.toFixed(2)}    Var(g) = ${m.variance.toFixed(3)}`,C.green,19);
  } else if(id==='posterior') {
    const n=1+Math.round(p*7),post=slopePosterior(n),ph=250;
    const x=(v:number)=>left+v/2*width,y=(v:number)=>top+ph-(v+2)/7*ph;
    art+=text(left,26,`a  Prediction y · n = ${n}`,C.ink,18);
    const samples=series(80,u=>[u*2]);
    const envelope=(predictive:boolean,sign:number)=>samples.map(([v])=>[x(v),y(post.mean*v+sign*1.96*Math.sqrt(v*v*post.variance+(predictive?observationSigma**2:0)))]);
    art+=band(envelope(true,1),envelope(true,-1),C.blue,.13)+band(envelope(false,1),envelope(false,-1),C.blue,.26);
    art+=axes(left,top,width,ph,[[0,'0'],[.5,'1'],[1,'2 · input x']],[[2/7,'0'],[4/7,'2'],[6/7,'4']]);
    art+=line(x(1),top,x(1),top+ph,C.muted,'4 4')+text(x(1)+8,top+18,'unobserved →',C.muted,13);
    art+=path(series(30,u=>[x(2*u),y(post.mean*2*u)]),C.blue);
    observations.slice(0,n).forEach(d=>{art+=dot(x(d.x),y(d.y),C.rust,4.5);});
    const sy=compact?397:387,bar=width*.65;
    art+=text(left,sy,'b  At x = 1: variance components',C.ink,18);
    art+=text(left,sy+33,'Parameter',C.blue,16)+text(left,sy+80,'Observation',C.rust,16);
    art+=`<rect x="${left}" y="${sy+42}" width="${bar*post.variance}" height="5" fill="${C.blue}"/><rect x="${left}" y="${sy+89}" width="${bar*.09}" height="5" fill="${C.rust}"/>`;
    art+=text(right,sy+33,post.variance.toFixed(3),C.blue,17,'end')+text(right,sy+80,'0.090',C.rust,17,'end');
    art+=text(left,height-20,'A model assumption is still an assumption.',C.muted,compact?15:17);
  } else {
    const t=20*p,x=(v:number)=>left+v/20*width,y=(v:number)=>top+plotH-(v+2)/16*plotH;
    const pts=series(80,u=>[u*20]);
    const bound=(sgn:number)=>pts.map(([v])=>{const m=rolloutMoments(v);return [x(v),y(m.mean+sgn*1.96*Math.sqrt(m.aleatoric+m.epistemic))];});
    art+=text(left,26,'a  Exact predictive fan',C.ink,18);
    art+=band(bound(1),bound(-1),C.blue,.17)+path(pts.map(([v])=>[x(v),y(.4*v)]),C.blue);
    art+=axes(left,top,width,plotH,[[0,'0'],[.5,'10'],[1,'20 steps']],[[2/16,'0'],[6/16,'4'],[10/16,'8'],[14/16,'12']]);
    const m=rolloutMoments(t),sd=Math.sqrt(m.aleatoric+m.epistemic);
    art+=line(x(t),y(m.mean-1.96*sd),x(t),y(m.mean+1.96*sd),C.rust)+dot(x(t),y(m.mean),C.rust,6);
    art+=text(left,second-27,'b  Variance accumulated over time',C.ink,18);
    const yy=(v:number)=>second+plot2H-v/6*plot2H;
    art+=axes(left,second,width,plot2H,[[0,'0'],[.5,'10'],[1,'20 steps']],[[0,'0'],[.5,'3'],[1,'6']]);
    for(const [key,color,dash] of [['epistemic',C.blue,''],['aleatoric',C.rust,''],['resampled',C.green,'5 4']] as const) {
      art+=path(pts.map(([v])=>[x(v),yy(rolloutMoments(v)[key])]),color,2.5,dash)+dot(x(t),yy(m[key]),color,4);
    }
    art+=text(left,height-23,'Blue: fixed drift · Rust: noise',C.muted,compact?14:16);
    art+=text(compact?left:w*.53,compact?height-3:height-23,'Dashed: redrawn drift',C.green,compact?14:16);
  }
  const key=`essay-${id}-${compact?'small':'wide'}${exported?'-export':''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${height}" width="${w}" height="${height}" role="img" aria-labelledby="${key}-title ${key}-desc" class="essay-svg"><title id="${key}-title">${esc(meta.title)}</title><desc id="${key}-desc">${esc(meta.description)}</desc>${exported?`<rect width="100%" height="100%" fill="#fef9ed"/>`:''}<g font-family="Inter, system-ui, sans-serif">${art}</g></svg>`;
}
