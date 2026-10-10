import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/world-models/experiments.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports });
const { spring, fitDynamics, gaussianUpdate, density, plan, ensemble } = exports;
const directory = 'public/images/world-models';
const palette = { ink: '#263b43', blue: '#547a94', green: '#3b796b', orange: '#b2754e', muted: '#74817b', line: '#dbdfd3', paper: '#faf8ef' };
function text(x, y, value, size = 17, color = palette.muted, anchor = 'start') { return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-family="Georgia,serif">${value}</text>`; }
function path(points, color, width = 2.5, extras = '') { return `<path d="${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extras}/>`; }
function axes(x, y, w, h, xLabel, yLabel, xRange = [0, 1], yRange = [0, 1]) {
    let result = ''; for (let i = 0; i <= 4; i++) result += `<path d="M${x} ${y + h * i / 4}H${x + w}M${x + w * i / 4} ${y}V${y + h}" stroke="${palette.line}" stroke-width="1"/>`;
    for (let i = 0; i <= 4; i++) {
        result += text(x + w * i / 4, y + h + 20, (xRange[0] + (xRange[1] - xRange[0]) * i / 4).toFixed(xRange[1] > 20 ? 0 : xRange[1] <= 3 ? 2 : 1), 12, palette.muted, 'middle');
        result += text(x - 10, y + h * i / 4 + 4, (yRange[1] + (yRange[0] - yRange[1]) * i / 4).toFixed(2), 12, palette.muted, 'end');
    }
    return result + text(x, y - 18, yLabel) + text(x + w, y + h + 38, xLabel, 16, palette.muted, 'end');
}
function save(name, title, description, body, width = 900, height = 480) {
    const prefix = name.replace('.svg', '');
    fs.writeFileSync(`${directory}/${name}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">${title}</title><desc id="${prefix}-desc">${description}</desc>${body}</svg>`);
}
let body = axes(70, 75, 750, 300, 'time →', 'position', [0, 2.5], [-0.4, 1.4]);
const yp = x => 375 - (x + 0.4) / 1.8 * 300;
for (const [velocity, color, label] of [[.16, palette.blue, 'moving right'], [-.16, palette.orange, 'moving left']]) {
    const points = Array.from({ length: 81 }, (_, i) => [70 + i / 80 * 750, yp(.5 + velocity * (i / 80 * 2.5))]);
    body += path(points, color, 3) + `<circle cx="70" cy="225" r="6" fill="${palette.ink}"/>` + text(745, velocity > 0 ? 95 : 360, label, 18, color, 'end');
}
body += text(70, 432, 'A single observed position is compatible with opposite hidden velocities.', 19, palette.ink);
save('lab-belief.svg', 'One position, two possible futures', 'Two constant-velocity trajectories share the same initial observed position but move in opposite directions.', body);
const fit = fitDynamics();
const maxLoss = fit.history[0].trainLoss * 1.1;
body = axes(70, 75, 750, 300, 'gradient descent epochs →', 'mean squared error', [0, 120], [0, maxLoss]);
for (const [key, color, label] of [['trainLoss', palette.green, 'training'], ['testLoss', palette.blue, 'held-out test']]) {
    body += path(fit.history.map(p => [70 + p.epoch / 120 * 750, 375 - p[key] / maxLoss * 300]), color, 3, key === 'testLoss' ? 'stroke-dasharray="7 4"' : '');
    body += text(key === 'trainLoss' ? 70 : 230, 432, label, 18, color);
}
save('lab-learning.svg', 'Learning a dynamics model from synthetic transitions', 'Training and held-out test error decrease as gradient descent fits stiffness and damping on a controlled synthetic spring dataset.', body);
const posterior = gaussianUpdate();
body = axes(70, 75, 750, 300, 'latent position →', 'probability density', [-1.5, 1.5], [0, 2.3]);
const px = x => 70 + (x + 1.5) / 3 * 750;
const py = value => 375 - value / 2.3 * 300;
for (const [mean, sigma, color, label] of [[0, .5, palette.blue, 'predictive prior'], [posterior.mean, posterior.sigma, palette.green, 'observation-conditioned posterior']]) {
    const points = Array.from({ length: 181 }, (_, i) => { const x = -1.5 + i / 180 * 3; return [px(x), py(density(x, mean, sigma))]; });
    body += path(points, color, 3) + text(color === palette.blue ? 70 : 300, 432, label, 18, color);
}
body += `<path d="M${px(.6)} 75V375" stroke="${palette.orange}" stroke-dasharray="5 5"/>` + text(px(.6) + 8, 100, 'observation', 15, palette.orange);
save('lab-posterior.svg', 'Predict, then correct with evidence', 'A broad Gaussian prior centered at zero becomes a narrower posterior after a position observation at 0.6 with measurement noise 0.25.', body);
const solution = plan();
const xx = x => 80 + x * 740, yy = y => 45 + y * 355;
body = axes(80, 45, 740, 355, 'horizontal position →', 'vertical position (down)', [0, 1], [1, 0]);
body += '<defs><clipPath id="planning-plot-clip"><rect x="80" y="45" width="740" height="355"/></clipPath></defs><g clip-path="url(#planning-plot-clip)">';
body += `<ellipse cx="${xx(.5)}" cy="${yy(.52)}" rx="${.15 * 740}" ry="${.15 * 355}" fill="${palette.orange}" opacity=".18"/>`;
for (const candidate of solution.passes.at(-1).candidates.slice(0, 44)) body += path(candidate.states.map(s => [xx(s.x), yy(s.y)]), palette.blue, 1, 'opacity=".15"');
body += path(solution.best.states.map(s => [xx(s.x), yy(s.y)]), palette.green, 3.5);
body += `<circle cx="${xx(.16)}" cy="${yy(.82)}" r="7" fill="${palette.ink}"/><circle cx="${xx(.84)}" cy="${yy(.18)}" r="10" fill="none" stroke="${palette.green}" stroke-width="2"/>`;
body += '</g>';
body += text(80, 461, '96 candidates / pass · 12 elites · 6 optimization passes', 18, palette.ink);
save('lab-planning.svg', 'Trajectory optimization around an obstacle', 'A cross-entropy search refines sampled force sequences. Faint lines show candidates; the green line is the selected imagined trajectory from the lower left to the upper right.', body);
const rollout = ensemble();
body = axes(70, 75, 750, 300, 'prediction horizon →', 'position', [0, 6], [-1, 1]);
for (const model of rollout.models) body += path(model.map(p => [70 + p.t / 6 * 750, 375 - (p.x + 1) / 2 * 300]), palette.blue, 1.5, 'opacity=".25"');
body += path(rollout.truth.map(p => [70 + p.t / 6 * 750, 375 - (p.x + 1) / 2 * 300]), palette.ink, 3);
body += text(70, 432, 'Dark: true dynamics. Blue: thirteen distinct model assumptions.', 18, palette.ink);
save('lab-uncertainty.svg', 'A fan of imagined futures', 'Thirteen spring models with different stiffness assumptions produce different future trajectories from the same initial state. A dark curve shows the true system.', body);
// A phase portrait: same initial state, three constant force interventions.
body = '';
const xp = x => 390 + x * 180, vp = v => 230 - v * 160;
for (let i = 1; i <= 7; i++) body += `<ellipse cx="390" cy="230" rx="${i * 38}" ry="${i * 29}" fill="none" stroke="${palette.line}" stroke-width="1"/>`;
body += `<path d="M70 230H715M390 35V420" stroke="${palette.line}"/>` + text(715, 253, 'position →', 15, palette.muted, 'end') + text(405, 48, 'velocity', 15);
for (const [u, color] of [[-.35, palette.orange], [0, palette.blue], [.35, palette.green]]) {
    let x = .7, v = 0; const points = [[xp(x), vp(v)]];
    for (let i = 0; i < 110; i++) { v += (u - .8 * x - .15 * v) * .05; x += v * .05; points.push([xp(x), vp(v)]); }
    body += path(points, color, 2.7) + `<circle cx="${xp(x)}" cy="${vp(v)}" r="5" fill="${color}"/>` + text(xp(x) + 10, vp(v) - 8, `a = ${u}`, 14, color);
}
body += `<circle cx="${xp(.7)}" cy="${vp(0)}" r="8" fill="${palette.ink}"/><circle cx="${xp(.7)}" cy="${vp(0)}" r="15" fill="none" stroke="${palette.ink}" opacity=".3"/>` + text(xp(.7) + 20, 211, 'one present', 16, palette.ink);
body += text(55, 453, 'Three actions. Three counterfactual rollouts.', 19, palette.ink);
save('state-space-v2.svg', 'One present, three action-conditioned futures', 'A phase portrait of a damped spring. Three trajectories share the same initial position and velocity but evolve under different constant forces.', body, 780, 480);
body = text(40, 42, 'A recurrent state-space model: the two information paths', 22, palette.ink);
const box = (x, y, w, h, label, sub, color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${color}" fill-opacity=".07" stroke="${color}" stroke-opacity=".5"/>${text(x + 14, y + 27, label, 18, palette.ink)}${text(x + 14, y + 52, sub, 14, color)}`;
body += box(40, 80, 180, 72, 'Memory hₜ', 'past latent + past action', palette.blue) + box(295, 80, 210, 72, 'Predictive prior', 'p(zₜ | hₜ)', palette.blue) + box(585, 80, 270, 72, 'Imagined latent', 'sample zₜ without new pixels', palette.blue);
body += box(40, 250, 180, 72, 'Observation oₜ', 'new sensory evidence', palette.orange) + box(295, 250, 210, 72, 'Posterior correction', 'q(zₜ | hₜ, oₜ)', palette.green) + box(585, 250, 270, 72, 'Model state (hₜ, zₜ)', 'reward · continue · decode', palette.green);
for (const d of ['M220 116H285', 'M505 116H575', 'M220 286H285', 'M505 286H575', 'M130 152V240', 'M400 152V240', 'M720 152V240']) body += `<path d="${d}" stroke="${palette.muted}" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`;
body += text(40, 390, 'During imagination, no new observation is available to correct the prior.', 19, palette.ink) + text(40, 425, 'Schematic RSSM information flow. Parameterizations differ across papers.', 16);
save('rssm-architecture-v2.svg', 'Predictive and observation-conditioned paths in an RSSM', 'Deterministic memory supports a predictive prior over latent state. An observed image also informs a posterior. During imagination the system uses the predictive path without new observations.', body);
await sharp(`${directory}/state-space-v2.svg`).resize({width:1200}).flatten({background:'#fef9ed'}).png().toFile(`${directory}/state-space-v2.png`);
console.log('Generated seven computed SVGs and the social preview image.');
