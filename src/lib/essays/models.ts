/** Exact teaching examples. These are not fitted benchmark results. */
export const potentials = [-4, -3, -2, -1, 0];
export const discount = 0.9;
export function shapedTrajectory(phi = potentials, gamma = discount) {
  return phi.slice(0, -1).map((value, t) => {
    const reward = t === phi.length - 2 ? 1 : 0;
    const shaping = gamma * phi[t + 1] - value;
    return { reward, shaping, shaped: reward + shaping, discounted: gamma ** t * shaping };
  });
}
export function softmax(logits: number[]) {
  const max = Math.max(...logits);
  const weights = logits.map(x => Math.exp(x - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map(x => x / sum);
}
export const banditRewards = [1, 2, 4];
export function bandit(logits: number[]) {
  const probabilities = softmax(logits);
  const value = probabilities.reduce((sum, p, i) => sum + p * banditRewards[i], 0);
  return { probabilities, value, gradient: probabilities.map((p, i) => p * (banditRewards[i] - value)) };
}
export function banditHistory(steps = 40) {
  let logits = [0, 0, 0];
  return Array.from({ length: steps + 1 }, () => {
    const state = bandit(logits);
    logits = logits.map((x, i) => x + 0.18 * state.gradient[i]);
    return state;
  });
}
export function baselineMoments(b: number, p = 0.5) {
  const left = -p * (1 - b), right = (1 - p) * (3 - b);
  const mean = (1 - p) * left + p * right;
  const variance = (1 - p) * (left - mean) ** 2 + p * (right - mean) ** 2;
  return { left, right, mean, variance };
}
export const observations = [
  { x: 0.3, y: 0.49 }, { x: 0.5, y: 0.28 }, { x: 0.7, y: 0.83 },
  { x: 0.9, y: 0.78 }, { x: 0.4, y: 0.35 }, { x: 0.6, y: 0.81 },
  { x: 0.8, y: 0.62 }, { x: 1, y: 1.12 },
];
export const observationSigma = 0.3;
export function slopePosterior(count: number) {
  const data = observations.slice(0, count);
  const variance = 1 / (1 + data.reduce((s, d) => s + d.x ** 2, 0) / observationSigma ** 2);
  const mean = variance * data.reduce((s, d) => s + d.x * d.y, 0) / observationSigma ** 2;
  return { mean, variance };
}
export function rolloutMoments(t: number, sigma = 0.2, tau = 0.12) {
  return { mean: t * 0.4, aleatoric: t * sigma ** 2, epistemic: t ** 2 * tau ** 2, resampled: t * tau ** 2 };
}
/** Two two-step routes. Intermediate potentials differ; start/terminal are zero. */
export function rewardFork(strength:number) {
  return [{name:'Upper',terminal:2,phi:-5*strength},{name:'Lower',terminal:1,phi:5*strength}].map(route=>{
    const first=.9*route.phi,second=route.terminal-route.phi;
    return {...route,first,second,total:first+.9*second,advantage:.9*(route.terminal-1.5)};
  });
}
/** Exact enumeration, A and W independent; four outcomes each have probability 1/4. */
export function luckCredit(weatherFraction=0,leak=0) {
  const outcomes=[0,1].flatMap(action=>[-10,10].map(weather=>{
    const reward=2*action+weather;
    const baseline=(1-leak)*(1+weatherFraction*weather)+leak*reward;
    return {action,weather,reward,gradient:(action-.5)*(reward-baseline)};
  }));
  const mean=outcomes.reduce((s,o)=>s+o.gradient,0)/4;
  const variance=outcomes.reduce((s,o)=>s+(o.gradient-mean)**2,0)/4;
  return {outcomes,mean,variance};
}
/** Two noiseless response functions, indistinguishable for every observed x <= 1. */
export function possibleWorld(x:number,world:'upper'|'lower') {
  return x+(world==='upper'?1:-1)*2*Math.max(0,x-1)**2;
}
