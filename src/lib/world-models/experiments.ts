export interface State { x: number; v: number }
export interface SpringPoint extends State { t: number }
export const REAL_DYNAMICS = { stiffness: 0.8, damping: 0.15 };
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function random(seed = 17) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
export function normal(rng: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng());
}
export function spring(initial: State, stiffness: number, damping: number, steps = 120, correctionEvery = 0) {
  const dt = 0.05;
  const points: SpringPoint[] = [{ ...initial, t: 0 }];
  const truth = correctionEvery ? spring(initial, REAL_DYNAMICS.stiffness, REAL_DYNAMICS.damping, steps) : null;
  for (let index = 1; index <= steps; index++) {
    const last = points[index - 1];
    const v = last.v + (-stiffness * last.x - damping * last.v) * dt;
    const point = { x: last.x + v * dt, v, t: index * dt };
    if (truth && index % correctionEvery === 0) Object.assign(point, truth[index]);
    points.push(point);
  }
  return points;
}
export interface Sample extends State { u: number; acceleration: number }
export function dataset(count: number, noise: number, seed = 27): Sample[] {
  const rng = random(seed);
  return Array.from({length: count}, () => {
    const x = rng() * 2 - 1, v = rng() * 2 - 1, u = rng() * 2 - 1;
    return {x, v, u, acceleration: u - REAL_DYNAMICS.stiffness * x - REAL_DYNAMICS.damping * v + noise * normal(rng)};
  });
}
export function mse(samples: Sample[], stiffness: number, damping: number) {
  return samples.reduce((sum, sample) => sum + (sample.u - stiffness * sample.x - damping * sample.v - sample.acceleration) ** 2, 0) / samples.length;
}
export function fitDynamics(count = 96, noise = 0.03, epochs = 120) {
  const train = dataset(count, noise), test = dataset(256, noise, 913);
  let stiffness = 0.15, damping = 0.02;
  const history = [{epoch: 0, stiffness, damping, trainLoss: mse(train, stiffness, damping), testLoss: mse(test, stiffness, damping)}];
  for (let epoch = 1; epoch <= epochs; epoch++) {
    let dk = 0, dc = 0;
    for (const sample of train) {
      const error = sample.u - stiffness * sample.x - damping * sample.v - sample.acceleration;
      dk -= 2 * error * sample.x / count;
      dc -= 2 * error * sample.v / count;
    }
    stiffness -= 0.12 * dk;
    damping -= 0.12 * dc;
    history.push({epoch, stiffness, damping, trainLoss: mse(train, stiffness, damping), testLoss: mse(test, stiffness, damping)});
  }
  return {train, test, history};
}
export function gaussianUpdate(observation = 0.6, measurementSigma = 0.25, priorMean = 0, priorSigma = 0.5) {
  const variance = priorSigma ** 2, noise = measurementSigma ** 2;
  const gain = variance / (variance + noise);
  return {mean: priorMean + gain * (observation - priorMean), sigma: Math.sqrt((1 - gain) * variance), gain};
}
export const density = (x: number, mean: number, sigma: number) => Math.exp(-0.5 * ((x - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
export function ensemble(spread = 0.16, steps = 120, correctionEvery = 0) {
  const initial = {x: 0.8, v: 0};
  const truth = spring(initial, REAL_DYNAMICS.stiffness, REAL_DYNAMICS.damping, steps);
  const models = Array.from({length: 13}, (_, index) => spring(initial, 0.62 + spread * (index - 6) / 6, 0.15, steps, correctionEvery));
  return {truth, models};
}

export interface Point2 { x: number; y: number; vx: number; vy: number }
export interface Trajectory { states: Point2[]; cost: number; controls: number[]; collided: boolean }
export const PLANNING_START: Point2 = {x: 0.16, y: 0.82, vx: 0, vy: 0};
export const GOAL = {x: 0.84, y: 0.18};
export const OBSTACLE = {x: 0.5, y: 0.52, radius: 0.15};
export function trajectory(controls: number[], horizon = 28, knowObstacle = true, execute = false): Trajectory {
  const states: Point2[] = [{...PLANNING_START}];
  let cost = 0, collided = false;
  const dt = 0.12;
  for (let index = 0; index < horizon; index++) {
    const last = states.at(-1)!;
    const knot = Math.min(3, Math.floor(index / horizon * 4));
    const ux = controls[knot * 2], uy = controls[knot * 2 + 1];
    let vx = last.vx + (ux - 0.5 * last.vx) * dt, vy = last.vy + (uy - 0.5 * last.vy) * dt;
    let x = last.x + vx * dt, y = last.y + vy * dt;
    const distance = Math.hypot(x - OBSTACLE.x, y - OBSTACLE.y);
    if (distance < OBSTACLE.radius) {
      collided = true;
      if (knowObstacle) cost += 30;
      if (execute) {
        const nx = (x - OBSTACLE.x) / Math.max(distance, 1e-6), ny = (y - OBSTACLE.y) / Math.max(distance, 1e-6);
        x = OBSTACLE.x + nx * OBSTACLE.radius;
        y = OBSTACLE.y + ny * OBSTACLE.radius;
        const inward = Math.min(0, vx * nx + vy * ny);
        vx -= inward * nx; vy -= inward * ny;
      }
    }
    if (knowObstacle) cost += 0.8 * Math.exp(-(((distance - OBSTACLE.radius) / 0.07) ** 2));
    if (x < 0.04 || x > 0.96 || y < 0.04 || y > 0.96) cost += 12;
    if (execute) {
      if (x < 0.04 || x > 0.96) { x = clamp(x, 0.04, 0.96); vx = 0; }
      if (y < 0.04 || y > 0.96) { y = clamp(y, 0.04, 0.96); vy = 0; }
    }
    cost += 0.08 * ((x - GOAL.x) ** 2 + (y - GOAL.y) ** 2) + 0.006 * (ux ** 2 + uy ** 2);
    states.push({x, y, vx, vy});
  }
  const end = states.at(-1)!;
  cost += 18 * ((end.x - GOAL.x) ** 2 + (end.y - GOAL.y) ** 2) + 0.2 * (end.vx ** 2 + end.vy ** 2);
  return {states, cost, controls, collided};
}
export function plan(horizon = 28, knowObstacle = true, seed = 14) {
  const rng = random(seed);
  let mean = [0.3,-0.3,0.3,-0.3,0.1,-0.1,0,0], sigma = Array(8).fill(0.65) as number[];
  let best = trajectory(mean, horizon, knowObstacle);
  const passes: {candidates: Trajectory[]; best: Trajectory}[] = [];
  for (let iteration = 0; iteration < 6; iteration++) {
    const candidates = [best, trajectory(mean, horizon, knowObstacle)];
    for (let sample = 0; sample < 94; sample++) {
      candidates.push(trajectory(mean.map((value, index) => clamp(value + sigma[index] * normal(rng), -1, 1)), horizon, knowObstacle));
    }
    candidates.sort((a,b) => a.cost - b.cost);
    const elite = candidates.slice(0,12);
    if (elite[0].cost < best.cost) best = elite[0];
    for (let dimension = 0; dimension < 8; dimension++) {
      const next = elite.reduce((sum,item) => sum + item.controls[dimension],0) / elite.length;
      const variance = elite.reduce((sum,item) => sum + (item.controls[dimension]-next) ** 2,0) / elite.length;
      mean[dimension] = 0.15 * mean[dimension] + 0.85 * next;
      sigma[dimension] = Math.max(0.07, Math.sqrt(variance));
    }
    passes.push({candidates, best});
  }
  const actual = trajectory(best.controls, horizon, true, true);
  return {passes, best, actual};
}
