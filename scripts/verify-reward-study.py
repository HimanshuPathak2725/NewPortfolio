"""Check published measurements against the downloadable experiment."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path

source = Path('public/experiments/reward_shaping.py')
spec = importlib.util.spec_from_file_location('study', source)
study = importlib.util.module_from_spec(spec)
spec.loader.exec_module(study)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
figure_data = json.loads(Path('src/data/reward-shaping-study.json').read_text())
assert figure_data['sourceHash'] == source_hash
for filename, key, epsilon in [('reward-shaping-results', 'main', .1), ('reward-shaping-exploration-check', 'exploration', .3)]:
    receipt = json.loads(Path(f'public/experiments/{filename}.json').read_text())
    assert receipt['source_sha256'] == source_hash
    assert receipt['config']['epsilon'] == epsilon
    assert receipt['config']['seeds'] == list(range(128))
    for name, (potential, initialization) in study.CONDITIONS.items():
        replay = study.learn(0, potential, initialization, epsilon=epsilon)
        assert replay['trace'] == receipt['seed_0_traces'][name], name
        curve = receipt['conditions'][name]['curve']
        assert len(curve) == 301
        for point in curve:
            assert .9 - 1e-10 <= point['mean'] <= 1.8 + 1e-10
            assert 0 <= point['optimal_count'] <= 128
            assert math.isfinite(point['se']) and point['se'] >= 0
        if name in figure_data[key]['curves']:
            assert figure_data[key]['curves'][name] == [[p['mean'], p['se'], p['optimal_count']] for p in curve]
    for check in receipt['equivalence_checks']:
        assert check['action_mismatches'] == 0
        assert check['max_delta_or_shift_error'] < 1e-10
        a, b = [receipt['conditions'][name] for name in check['pair']]
        assert a['actions_sha256'] == b['actions_sha256']
        assert a['curve'] == b['curve']
        assert a['mean_training_regret'] == b['mean_training_regret']
    trace = receipt['seed_0_traces']['hostile']
    assert trace[0]['state'] == 0 and trace[0]['action'] == 1
    assert math.isclose(trace[0]['q'][0][1], .9)
    assert math.isclose(trace[1]['q'][2][0], -.8)
    assert math.isclose(trace[2]['q'][0][1], 1.476)
    expected_100 = [71, 113, 0] if epsilon == .1 else [125, 128, 79]
    expected_300 = [126, 128, 80] if epsilon == .1 else [128, 128, 128]
    for name, at100, at300 in zip(['plain', 'helpful', 'hostile'], expected_100, expected_300):
        curve = receipt['conditions'][name]['curve']
        assert curve[100]['optimal_count'] == at100
        assert curve[300]['optimal_count'] == at300
    assert figure_data[key]['trace']['shaped'] == [0] + [t['q'][1][0] for t in receipt['seed_0_traces']['hostile'][1::2]]
    assert figure_data[key]['trace']['initialized'] == [-5] + [t['q'][1][0] for t in receipt['seed_0_traces']['hostile_initialization'][1::2]]
print('PASS reward study: source provenance, replayed all twelve seed-zero traces, paired action hashes and curves, reported counts, and plotted data match receipts.')
