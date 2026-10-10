#!/usr/bin/env python3
"""Finite-budget Q-learning on a two-route MDP. Standard library only.

Reproduce: python3 reward_shaping.py --output reward-shaping-results.json
All reported returns use the ORIGINAL reward, never the shaping reward.
The environment has no random transitions; randomness is exploration/tie-breaking.
"""
import argparse
import hashlib
import json
import math
import random
from pathlib import Path

GAMMA = 0.9
ALPHA = 0.2
EPSILON = 0.1
EPISODES = 300
SEEDS = list(range(128))
TIE_TOL = 1e-12
HELPFUL = [0.0, 2.0, 1.0, 0.0]
HOSTILE = [0.0, -5.0, 5.0, 0.0]
ZERO = [0.0] * 4
CONDITIONS = {
    'plain': (ZERO, ZERO),
    'helpful': (HELPFUL, ZERO),
    'helpful_initialization': (ZERO, HELPFUL),
    'hostile': (HOSTILE, ZERO),
    'hostile_initialization': (ZERO, HOSTILE),
    'compensated': (HOSTILE, [-x for x in HOSTILE]),
}

def ties(values):
    best = max(values)
    return [i for i, value in enumerate(values) if best - value <= TIE_TOL]

def evaluate(q):
    # Exact value of the greedy start policy, uniform over ties. No eval RNG.
    best = ties(q[0])
    return sum([1.8, 0.9][a] for a in best) / len(best)

def learn(seed, shaping, initialization, episodes=EPISODES, alpha=ALPHA, epsilon=EPSILON):
    rng = random.Random(seed)
    q = [[initialization[0]] * 2, [initialization[1]], [initialization[2]], [0.0]]
    evaluations, actions, training_returns, trace = [evaluate(q)], [], [], []
    for episode in range(episodes):
        explore, choice = rng.random(), rng.random()
        candidates = [0, 1] if explore < epsilon else ties(q[0])
        action = candidates[min(len(candidates)-1, int(choice * len(candidates)))]
        middle = action + 1
        actions.append(action)
        for state, a, next_state, reward, terminal in [(0, action, middle, 0.0, False), (middle, 0, 3, 2.0-action, True)]:
            shaped = reward + GAMMA * shaping[next_state] - shaping[state]
            target = shaped + (0.0 if terminal else GAMMA * max(q[next_state]))
            delta = target - q[state][a]
            q[state][a] += alpha * delta
            trace.append({'episode':episode+1, 'state':state, 'action':a, 'reward':reward, 'shaped_reward':shaped, 'delta':delta, 'q':[row[:] for row in q]})
        training_returns.append(GAMMA * (2.0-action))
        evaluations.append(evaluate(q))
    return {'evaluations':evaluations, 'actions':actions, 'training_returns':training_returns, 'trace':trace}

def average(values):
    return sum(values) / len(values)

def summarize(runs, episodes):
    curve = []
    for t in range(episodes+1):
        values = [r['evaluations'][t] for r in runs]
        mean = average(values)
        sd = math.sqrt(sum((v-mean)**2 for v in values)/(len(values)-1)) if len(values)>1 else 0.0
        curve.append({'episode':t, 'mean':mean, 'se':sd/math.sqrt(len(values)), 'optimal_count':sum(v>1.8-1e-10 for v in values)})
    return {'curve':curve, 'mean_training_regret':average([sum(1.8-v for v in r['training_returns']) for r in runs]), 'actions_sha256':hashlib.sha256(json.dumps([r['actions'] for r in runs]).encode()).hexdigest()}

def experiment(episodes=EPISODES, alpha=ALPHA, epsilon=EPSILON, seeds=SEEDS):
    raw = {name:[learn(seed,shape,init,episodes,alpha,epsilon) for seed in seeds] for name,(shape,init) in CONDITIONS.items()}
    pairs = [('helpful','helpful_initialization',HELPFUL),('hostile','hostile_initialization',HOSTILE),('compensated','plain',HOSTILE)]
    audit = []
    for shaped_name,other_name,phi in pairs:
        worst = 0.0
        mismatches = 0
        for a,b in zip(raw[shaped_name],raw[other_name]):
            mismatches += sum(x != y for x,y in zip(a['actions'],b['actions']))
            for ta,tb in zip(a['trace'],b['trace']):
                worst = max(worst, abs(ta['delta']-tb['delta']))
                for state in range(4):
                    for qa,qb in zip(ta['q'][state],tb['q'][state]):
                        worst = max(worst,abs(qb-qa-phi[state]))
        assert mismatches == 0, (shaped_name,other_name,mismatches)
        assert worst < 1e-10, (shaped_name,other_name,worst)
        audit.append({'pair':[shaped_name,other_name], 'action_mismatches':mismatches, 'max_delta_or_shift_error':worst})
    return {'config':{'gamma':GAMMA,'alpha':alpha,'epsilon':epsilon,'episodes':episodes,'seeds':seeds,'tie_tolerance':TIE_TOL,'tie_rule':'uniform among actions within tolerance of max Q','rng':'Python random.Random; two uniform draws per episode','transitions_per_episode':2,'potentials':{'helpful':HELPFUL,'hostile':HOSTILE},'evaluation':'exact original-reward value of greedy policy, uniform ties; after each episode','bands':'pointwise mean +/- 1 standard error across seeds; not a confidence guarantee'}, 'conditions':{name:summarize(runs,episodes) for name,runs in raw.items()}, 'equivalence_checks':audit, 'seed_0_traces':{name:runs[0]['trace'] for name,runs in raw.items()}}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('reward-shaping-results.json'))
    parser.add_argument('--episodes',type=int,default=EPISODES)
    parser.add_argument('--alpha',type=float,default=ALPHA)
    parser.add_argument('--epsilon',type=float,default=EPSILON)
    args = parser.parse_args()
    if args.episodes<1 or not 0<args.alpha<=1 or not 0<=args.epsilon<=1:
        parser.error('episodes must be positive, alpha in (0,1], epsilon in [0,1]')
    result = experiment(args.episodes,args.alpha,args.epsilon)
    result['source_sha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print('episodes',args.episodes,'alpha',args.alpha,'epsilon',args.epsilon,'seeds',len(SEEDS))
    for name,c in result['conditions'].items():
        print(name,{t:round(c['curve'][t]['mean'],5) for t in [1,5,10,25,50,100,args.episodes] if t<=args.episodes},'training regret',round(c['mean_training_regret'],3))
    print('Equivalence checks:',result['equivalence_checks'])
    print('Saved',args.output)

if __name__ == '__main__':
    main()
