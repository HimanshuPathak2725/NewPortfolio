import fs from 'node:fs';
import ts from 'typescript';
import {essayModules,compile} from './essay-modules.mjs';
const {figures:{figures,renderFigure}}=essayModules();
fs.mkdirSync('public/images/essays',{recursive:true});
for(const id of Object.keys(figures))fs.writeFileSync(`public/images/essays/${id}.svg`,renderFigure(id,figures[id].initialProgress??1,false,true));
fs.mkdirSync('public/examples',{recursive:true});
fs.writeFileSync('public/examples/essay-counterexamples.mjs',`// Exact illustrative examples for Himanshu Pathak's research essays.
// Generated from the same models.ts used by the interactive figures.
// Run with Node.js: node essay-counterexamples.mjs
// No dependencies, random samples, training runs, or benchmark claims.
import assert from 'node:assert/strict';
${compile('models',ts.ModuleKind.ES2022)}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9);
for(const strength of [0,.25,.5,.75,1]) {
 const [upper,lower]=rewardFork(strength);
 near(upper.total,1.8);near(lower.total,.9);
 near(upper.advantage,.45);near(lower.advantage,-.45);
 near(upper.first+.9*(2-upper.phi)-1.35,.45);
}
console.log('Reward fork: payments change; returns 1.8 / 0.9 and advantages +0.45 / -0.45 stay fixed.');
for(const fraction of [0,.25,.5,.75,1])near(luckCredit(fraction).mean,.5);
near(luckCredit(0).variance,25);near(luckCredit(1).variance,0);
near(luckCredit(1,1).mean,0);near(luckCredit(1,1).variance,0);
console.log('Weather: ordinary baseline mean 0.5, variance 25; valid hindsight mean 0.5, variance 0; reward leakage mean 0, variance 0.');
for(let i=0;i<=1000;i++)near(possibleWorld(i/1000,'upper'),possibleWorld(i/1000,'lower'));
near(possibleWorld(2,'upper'),4);near(possibleWorld(2,'lower'),0);
near(.5*(4+.8)-2,.4);
console.log('Worlds agree on the checked inputs in [0,1]; at 2 they give 4 versus 0. Exact agreement throughout [0,1] also follows from the max term being zero.');
console.log('Equal prior: expected reward at 2 is 2; one separate final decision with perfect information yields 2.4 (value of information 0.4 before costs).');
`);
console.log(`Generated ${Object.keys(figures).length} original essay figures.`);
