import fs from 'node:fs';
import crypto from 'node:crypto';
function load(name,source){
 const raw=JSON.parse(fs.readFileSync(`public/experiments/${name}-results.json`,'utf8'));
 const hash=crypto.createHash('sha256').update(fs.readFileSync(`public/experiments/${source}.py`)).digest('hex');
 if(raw.source_sha256!==hash)throw new Error(`Stale experiment: ${name}`);
 return raw;
}
const credit=load('credit-assignment','credit_assignment');
const compact=key=>({amplitude:credit[key].amplitude,curves:Object.fromEntries(Object.entries(credit[key].conditions).map(([name,c])=>[name,c.curve]))});
fs.writeFileSync('src/data/credit-study.json',JSON.stringify({sourceHash:credit.source_sha256,high:compact('high_noise'),low:compact('low_noise'),frozen:credit.frozen})+'\n');
const uncertainty=load('uncertainty-probe','uncertainty_probe');
fs.writeFileSync('src/data/uncertainty-study.json',JSON.stringify({sourceHash:uncertainty.source_sha256,coverage:uncertainty.coverage.curve,probes:uncertainty.probes})+'\n');
console.log('Prepared credit and uncertainty figures from source-matched experiment receipts.');
