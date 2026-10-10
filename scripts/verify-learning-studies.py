"""Independent identities and complete deterministic receipt replay."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path

def load(module, receipt):
    path=Path(f'public/experiments/{module}.py')
    spec=importlib.util.spec_from_file_location(module,path)
    loaded=importlib.util.module_from_spec(spec); spec.loader.exec_module(loaded)
    raw=json.loads(Path(f'public/experiments/{receipt}-results.json').read_text())
    assert raw.pop('source_sha256')==hashlib.sha256(path.read_bytes()).hexdigest()
    assert json.loads(json.dumps(loaded.run()))==raw, f'Reproduction mismatch: {module}'
    return loaded,raw

credit,c=load('credit_assignment','credit-assignment')
for p in [.01,.1,.3,.5,.9,.99]:
    moments=credit.moments(p)
    target=2*p*(1-p)
    for name in ['ordinary','weather','weighted']:
        assert math.isclose(moments[name]['mean'],target,abs_tol=1e-12)
    assert moments['weighted']['variance']<1e-25
    assert math.isclose(moments['weather']['variance'],4*p*(1-p)*(1-2*p)**2,abs_tol=1e-12)
    assert moments['leaked']['mean']==moments['leaked']['variance']==0
    # Independent numerical derivative of the stated objective.
    theta=math.log(p/(1-p)); h=1e-5
    numeric=(2*credit.sigmoid(theta+h)-2*credit.sigmoid(theta-h))/(2*h)
    assert math.isclose(numeric,target,abs_tol=1e-9)
for name in ['weather','weighted','leaked']:
    for a,b in zip(c['high_noise']['conditions'][name]['final_values'],c['low_noise']['conditions'][name]['final_values']):
        assert math.isclose(a,b,abs_tol=1e-12)
assert sum(v<1 for v in c['high_noise']['conditions']['ordinary']['final_values'])==6
assert all(v==1 for v in c['high_noise']['conditions']['leaked']['final_values'])
compact=json.loads(Path('src/data/credit-study.json').read_text())
for small,big in [('high','high_noise'),('low','low_noise')]:
    for name in credit.NAMES: assert compact[small]['curves'][name]==c[big]['conditions'][name]['curve']
assert compact['frozen']==c['frozen']

uncertainty,u=load('uncertainty_probe','uncertainty-probe')
m,v=uncertainty.posterior(uncertainty.dataset(0,32))
sigma2=uncertainty.SIGMA**2
for key,run in u['probes'].items():
    for k,state in enumerate(run['states']):
        # Integrate the slope out in one batch using a rank-one covariance,
        # independently of the sequential Gaussian updates in the experiment.
        logs=[]
        for j,sign in enumerate([-1,1]):
            rows=run['observations'][:k]
            adjusted=[(x,y-sign*2*max(0,x-1)**2) for x,y in rows]
            xx=sum(x*x for x,y in adjusted)
            residuals=[(x,y-m*x) for x,y in adjusted]
            quad=sum(r*r for x,r in residuals)/sigma2-v*sum(x*r for x,r in residuals)**2/(sigma2**2*(1+v*xx/sigma2))
            logdet=k*math.log(sigma2)+math.log1p(v*xx/sigma2)
            logs.append(-.5*(logdet+quad))
            postvar=1/(1/v+xx/sigma2)
            postmean=postvar*(m/v+sum(x*y for x,y in adjusted)/sigma2)
            assert math.isclose(postmean,state['slope_means'][j],abs_tol=1e-12)
            assert math.isclose(postvar,state['slope_variances'][j],abs_tol=1e-12)
        expected=credit.sigmoid(logs[0]-logs[1])
        assert math.isclose(expected,state['lower_probability'],abs_tol=1e-12)
assert all(s['lower_probability']==.5 for s in u['probes']['familiar']['states'])
assert u['coverage']['curve'][-1]['inside_count']==244
assert u['coverage']['curve'][-1]['outside_count']==0
assert [u['probes'][name]['correct_decisions_by_round'][-1] for name in ['familiar','edge','far']]==[0,149,256]
compact=json.loads(Path('src/data/uncertainty-study.json').read_text())
assert compact['coverage']==u['coverage']['curve'] and compact['probes']==u['probes']
print('PASS learning studies: fully reproduced both receipts; checked gradient means/variances, finite differences, noise-removal controls, batch versus sequential Bayes, coverage/decision counts, and plotted data.')
