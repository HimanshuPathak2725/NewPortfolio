#!/usr/bin/env python3
"""Exact Gaussian inference, repeated coverage checks, and informative probes.
Standard library only. The true world bends downward beyond x=1.
"""
import argparse
import hashlib
import json
import math
import random
from pathlib import Path

SIGMA = .3
CHECKPOINTS = [4,8,16,32,64,128,256,512]
SEEDS = list(range(256))
Z95 = 1.959963984540054

def world(x, sign=-1):
    return x + sign*2*max(0,x-1)**2

def posterior(data):
    variance = 1/(1+sum(x*x/SIGMA**2 for x,y in data))
    mean = variance*sum(x*y/SIGMA**2 for x,y in data)
    return mean,variance

def dataset(seed, size=512):
    rng=random.Random(seed)
    data=[]
    for _ in range(size):
        x=rng.uniform(.2,1)
        data.append([x,world(x)+rng.gauss(0,SIGMA)])
    return data

def coverage_experiment():
    data=[dataset(seed) for seed in SEEDS]
    curves=[]
    for n in CHECKPOINTS:
        inside=outside=0
        widths=[]
        for seed,rows in zip(SEEDS,data):
            mean,var=posterior(rows[:n])
            # Independent held-out noise; shared across sample-count checkpoints.
            rng=random.Random(100000+seed)
            for x in [.8,2]:
                actual=world(x)+rng.gauss(0,SIGMA)
                radius=Z95*math.sqrt(SIGMA**2+x*x*var)
                hit=abs(actual-x*mean)<=radius
                if x==.8: inside+=hit
                else: outside+=hit; widths.append(2*radius)
        m,v=posterior(data[0][:n])
        curves.append({'n':n,'inside_count':inside,'outside_count':outside,'mean_outside_width':sum(widths)/len(widths),
                       'seed_0_mean':2*m,'seed_0_radius':Z95*math.sqrt(SIGMA**2+4*v),'seed_0_slope_mean':m,'seed_0_slope_variance':v})
    return {'curve':curves,'seed_0_data':data[0]}

def probe_experiment(x, rounds=16, seed=0):
    mean,var=posterior(dataset(seed,32))
    means=[mean,mean]; variances=[var,var]; logs=[math.log(.5)]*2
    rng=random.Random(200000+seed)
    states=[]
    observations=[]
    for t in range(rounds+1):
        mx=max(logs); weights=[math.exp(w-mx) for w in logs]; weights=[w/sum(weights) for w in weights]
        values=[sum(weight*(m*a+sign*2*max(0,a-1)**2) for weight,m,sign in zip(weights,means,[-1,1])) for a in [.8,2]]
        action=.8 if values[0]>values[1] else 2
        states.append({'round':t,'lower_probability':weights[0],'mean_rewards':values,'chosen_action':action,'true_expected_reward':world(action),'slope_means':means[:],'slope_variances':variances[:]})
        if t==rounds: break
        y=world(x)+rng.gauss(0,SIGMA)
        observations.append([x,y])
        for j,sign in enumerate([-1,1]):
            offset=sign*2*max(0,x-1)**2
            predictive_var=SIGMA**2+x*x*variances[j]
            error=y-offset-x*means[j]
            logs[j]+=-.5*(math.log(2*math.pi*predictive_var)+error**2/predictive_var)
            new_var=1/(1/variances[j]+x*x/SIGMA**2)
            means[j]=new_var*(means[j]/variances[j]+x*(y-offset)/SIGMA**2)
            variances[j]=new_var
    return {'x':x,'states':states,'observations':observations}

def probe_summary(x):
    runs=[probe_experiment(x,seed=seed) for seed in SEEDS]
    return {'final_lower_probabilities':[r['states'][-1]['lower_probability'] for r in runs],
            'correct_decisions_by_round':[sum(r['states'][t]['chosen_action']==.8 for r in runs) for t in range(17)]}

def run():
    return {'config':{'seeds':SEEDS,'noise_sigma':SIGMA,'training_x':[.2,1],'checkpoints':CHECKPOINTS,'prior':'slope theta ~ N(0,1)','true_slope':1,'true_world':'x - 2*max(0,x-1)^2','interval':'pointwise 95% posterior predictive under the through-origin linear model','coverage':'one independent held-out noisy observation per seed per location; same test noise across n','probe_prior':'equal weights on signs -1,+1; each branch has Gaussian slope posterior from first 32 seed-zero samples','probe_rng':'random.Random(200000+training_seed); shared probe noise across locations','probe_rounds':16,'probe_cost':'not deducted; diagnostic experiment, not a cost-optimized exploration policy'},
            'coverage':coverage_experiment(),'probes':{name:{**probe_experiment(x),**probe_summary(x)} for name,x in [('familiar',.8),('edge',1.25),('far',2)]}}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('uncertainty-probe-results.json'))
    args=parser.parse_args(); result=run()
    result['source_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print('Coverage:',result['coverage']['curve'])
    print('Probes:',{k:{'first':v['states'][1],'last':v['states'][-1], 'correct_after_16':v['correct_decisions_by_round'][-1]} for k,v in result['probes'].items()})
