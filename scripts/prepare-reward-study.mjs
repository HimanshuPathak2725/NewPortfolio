import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync('public/experiments/reward_shaping.py');
const sourceHash=crypto.createHash('sha256').update(source).digest('hex');
const load=name=>{
 const raw=JSON.parse(fs.readFileSync(`public/experiments/${name}.json`,'utf8'));
 if(raw.source_sha256!==sourceHash)throw new Error(`Stale experiment: ${name}`);
 for(const pair of raw.equivalence_checks)if(pair.action_mismatches!==0||pair.max_delta_or_shift_error>1e-10)throw new Error('Failed equivalence audit');
 return {config:raw.config,curves:Object.fromEntries(['plain','helpful','hostile'].map(id=>[id,raw.conditions[id].curve.map(p=>[p.mean,p.se,p.optimal_count])])),regrets:Object.fromEntries(Object.entries(raw.conditions).map(([id,c])=>[id,c.mean_training_regret])),audit:raw.equivalence_checks,trace:{shaped:[0,...raw.seed_0_traces.hostile.filter((_,i)=>i%2===1).map(t=>t.q[1][0])],initialized:[-5,...raw.seed_0_traces.hostile_initialization.filter((_,i)=>i%2===1).map(t=>t.q[1][0])]}};
};
const study={sourceHash,main:load('reward-shaping-results'),exploration:load('reward-shaping-exploration-check')};
fs.writeFileSync('src/data/reward-shaping-study.json',JSON.stringify(study)+'\n');
console.log('Prepared measured figure data; both result files match the experiment source hash.');
