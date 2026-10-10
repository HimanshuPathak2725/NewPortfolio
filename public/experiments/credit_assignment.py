#!/usr/bin/env python3
"""A sampled Bernoulli policy gradient with four baseline controls. No packages."""
import argparse
import hashlib
import json
import math
import random
from pathlib import Path

NAMES = ['ordinary', 'weather', 'weighted', 'leaked']
SEEDS = list(range(128))
STEPS = 800
RATE = .05

def sigmoid(theta):
    return 1 / (1 + math.exp(-theta)) if theta >= 0 else math.exp(theta) / (1 + math.exp(theta))

def gradient(name, p, action, weather):
    reward = 2 * action + weather
    baseline = {'ordinary': 2*p, 'weather': weather+2*p,
                'weighted': weather+2*(1-p), 'leaked': reward}[name]
    return (action-p)*(reward-baseline)

def moments(p, amplitude=10):
    answer = {}
    for name in NAMES:
        outcomes = [(a,w,(p if a else 1-p)/2,gradient(name,p,a,w)) for a in [0,1] for w in [-amplitude,amplitude]]
        mean = sum(prob*g for a,w,prob,g in outcomes)
        answer[name] = {'mean':mean, 'variance':sum(prob*(g-mean)**2 for a,w,prob,g in outcomes), 'outcomes':outcomes}
    return answer

def train(seed, name, amplitude=10, steps=STEPS, rate=RATE):
    rng = random.Random(seed)
    theta = 0.
    values = [1.]
    trace = []
    for t in range(steps):
        p = sigmoid(theta)
        a = int(rng.random() < p)
        w = amplitude if rng.random() < .5 else -amplitude
        g = gradient(name,p,a,w)
        theta += rate*g
        values.append(2*sigmoid(theta))
        if t < 12:
            trace.append({'update':t+1,'p_before':p,'action':a,'weather':w,'reward':2*a+w,'gradient':g,'theta_after':theta})
    return {'values':values, 'first_updates':trace}

def experiment(amplitude):
    conditions = {}
    for name in NAMES:
        runs = [train(seed,name,amplitude) for seed in SEEDS]
        curve = []
        for t in range(0,STEPS+1,4):
            vals = [r['values'][t] for r in runs]
            mean = sum(vals)/len(vals)
            se = math.sqrt(sum((v-mean)**2 for v in vals)/(len(vals)-1)/len(vals))
            curve.append([t,mean,se,sum(v>1 for v in vals)])
        conditions[name] = {'curve':curve,'seed_0':runs[0], 'final_values':[r['values'][-1] for r in runs]}
    return {'amplitude':amplitude,'conditions':conditions}

def run():
    return {'config':{'seeds':SEEDS,'steps':STEPS,'learning_rate':RATE,'initial_logit':0,'reward':'2*A + W; W equiprobable +/- amplitude, independent of A', 'evaluation':'exact expected reward 2*sigmoid(theta) after each update','bands':'pointwise mean +/- 1 standard error across 128 seeds', 'randomness':'random.Random(seed), action draw then weather draw at every update; shared uniform draws across conditions'},
            'high_noise':experiment(10),'low_noise':experiment(2),
            'frozen':[{'p':.1+i*.02,'moments':moments(.1+i*.02)} for i in range(41)]}

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('credit-assignment-results.json'))
    args=parser.parse_args()
    result=run()
    result['source_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    for noise in ['high_noise','low_noise']:
        print(noise,{name:result[noise]['conditions'][name]['curve'][-1] for name in NAMES})
