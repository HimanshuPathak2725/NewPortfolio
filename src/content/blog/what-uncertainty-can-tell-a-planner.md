---
title: 'What uncertainty can tell a planner'
description: 'I kept giving a model more evidence. Its intervals narrowed around the wrong answer. The useful question became which observation could change its mind.'
pubDate: 2026-10-10
tags: ['world-models', 'uncertainty']
interactive: research-essay
---

I wanted a model to tell me when its prediction deserved less trust.

A shaded uncertainty band seems to offer that information. A wide band asks for caution; a narrow one appears to grant permission. But the shading is the result of a calculation, and the calculation begins with a set of possibilities. I wanted to see what happened when the important possibility was missing.

I used two worlds that agree everywhere I initially collect data. For inputs between zero and one, both return x. Beyond one, they bend in opposite directions:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="The two worlds are x plus or minus two times the square of max zero x minus one"><mrow><msub><mi>f</mi><mo>±</mo></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>x</mi><mo>±</mo><mn>2</mn><msup><mrow><mi>max</mi><mo>(</mo><mn>0</mn><mo>,</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup></mrow></math></div>

At x = 0.8, both give 0.8. At x = 2, the upper world gives 4 and the lower gives 0. If the output is a reward and those are the available actions, the correct choice depends on which world we inhabit.

For the experiments, I made the lower world true. I then restricted the initial observations to x between 0.2 and 1. The restriction is deliberate: I want to distinguish learning a function where it has been observed from learning how it continues elsewhere.

<!-- figure:worlds -->

This first animation shows the noiseless construction. The experiments below add measurement noise. The distinction matters: a single noisy observation is evidence, not the logical elimination of an alternative.

## I asked the model to choose a line

My first model allows only lines through the origin, y = θx + ε. Its unknown slope has prior N(0, 1). The observation noise is Gaussian with known standard deviation 0.3. Given the data, its posterior is available in closed form:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Posterior slope variance is the inverse of one plus sum x squared over noise variance; mean is posterior variance times sum x y over noise variance"><mrow><mi>v</mi><mo>=</mo><msup><mrow><mo>(</mo><mn>1</mn><mo>+</mo><mfrac><mrow><mo>∑</mo><msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup></mrow><msup><mi>σ</mi><mn>2</mn></msup></mfrac><mo>)</mo></mrow><mrow><mo>−</mo><mn>1</mn></mrow></msup><mo>,</mo><mspace width="1em"/><mi>m</mi><mo>=</mo><mi>v</mi><mfrac><mrow><mo>∑</mo><msub><mi>x</mi><mi>i</mi></msub><msub><mi>y</mi><mi>i</mi></msub></mrow><msup><mi>σ</mi><mn>2</mn></msup></mfrac></mrow></math></div>

At a new input x, the predicted mean is mx and the predictive variance is x²v + σ². The first part comes from uncertainty about the slope. The second remains even if the slope becomes known, because a fresh measurement still contains noise.

I generated 512 observations per seed and fitted nested prefixes of 4, 8, 16, 32, 64, 128, 256, and 512 observations. There are 256 seeds. Inputs are uniform in [0.2, 1]; their outputs come from the true lower world plus independent Gaussian noise.

At every budget, I evaluated the nominal 95% predictive interval on a fresh noisy observation at x = 0.8 and another at x = 2. The first checks prediction in familiar territory. The second checks the region that matters to the unresolved decision.

With 512 training observations, the interval covered **244 of 256** held-out outputs at x = 0.8, about 95.3%. At x = 2, it covered **none**.

<!-- figure:uncertainty_evidence -->

The upper panel follows seed 0 rather than an averaged fit. After 512 observations, its prediction at x = 2 is about 1.998, with a 95% predictive interval of approximately [1.405, 2.592]. The true mean there is zero. The model has become quite precise about a future that its own family does not permit it to reconsider.

Across seeds, the average interval width at x = 2 shrank from 2.231 with four observations to 1.187 with 512. Coverage there fell from 30 out of 256 to zero; it was already zero by the 16-observation checkpoint. A shrinking band was an accurate description of the model's calculation. It was poor evidence that the calculation was adequate outside the observed region.

Zero observed coverage is a result for these held-out samples, not a proof that the population coverage is exactly zero. The intervals also predict noisy observations, not just the underlying mean. That is why the coverage check uses fresh noise rather than asking only whether the band contains f(x).

## The calculation answered the question I supplied

The posterior had been asked which line explained the data. More observations answered that question well: the slope approached one. Nothing in the family represented a bend beginning beyond x = 1.

This was not an approximate inference failure. There was no neural optimizer to blame and no sampling approximation to the posterior. The exact calculation concentrated because I had made agreement on a line stand in for agreement about what happened next.

I find that distinction uncomfortable in a useful way. It is easy to speak of “the model's uncertainty” as though it were a complete inventory of possible errors. Here I can state exactly what it represents: uncertainty about one slope, under a Gaussian likelihood with a fixed noise scale. The omitted bend has no place in that inventory.

Calling the slope component epistemic and the noise component aleatoric does not expand the family. The labels are conditional on what is modeled and observed. Even “irreducible noise” needs those conditions: another sensor or a richer state description could make some apparently random variation predictable.

The experiment is also deliberately unfavorable to extrapolation. I constructed the missing behavior and withheld data from its region. It establishes a failure mode, not a claim that linear models generally have useless uncertainty or that these coverage numbers characterize real systems.

## Giving the alternative somewhere to live

For the next model, I kept both bending directions as explicit hypotheses. Each branch has its own uncertain slope:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Output is theta x plus c times two times max zero x minus one squared plus noise; c is minus one or plus one"><mrow><mi>y</mi><mo>=</mo><mi>θ</mi><mi>x</mi><mo>+</mo><mn>2</mn><mi>c</mi><msup><mrow><mi>max</mi><mo>(</mo><mn>0</mn><mo>,</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><mi>ε</mi><mo>,</mo><mspace width=".5em"/><mi>c</mi><mo>∈</mo><mo>{</mo><mo>−</mo><mn>1</mn><mo>,</mo><mn>1</mn><mo>}</mo></mrow></math></div>

I assign equal prior probability to the directions and the same N(0, 1) slope prior within each. In the training interval, the bending term is zero. Both branches therefore assign the same likelihood to every possible observation there, including its noise. Their posterior weights remain exactly one half.

The new model knows more possibilities because I supplied them. It has not discovered an unobserved bend from data that cannot distinguish it. That is a cost of the construction, and it needs to remain visible when interpreting the result.

Even so, it changes the meaning of the prediction. A line near slope one predicts about 2 at x = 2. The two-world model can have the same mean by averaging predictions near 0 and 4. The mean alone hides a disagreement with direct consequences for the action.

Does exposing that disagreement automatically change the planner's choice? No. Under equal weights and a known unit slope, the expected reward of x = 2 is 2, larger than the familiar action's 0.8. A risk-neutral planner still chooses 2. A worst-case planner over these two worlds chooses 0.8. The uncertainty distribution did not choose the objective for either planner.

## I changed where the next observation came from

I initialized the two-world model using the first 32 training observations of each seed. Then I ran three separate probe sequences: sixteen measurements at x = 0.8, at x = 1.25, or at x = 2. Each location uses the same underlying sequence of noise draws within a seed.

After each measurement, I updated the branch weights using their predictive likelihoods and updated the Gaussian slope posterior inside each branch. I then asked which of the two final actions, 0.8 or 2, maximized the model's expected reward. The probe itself is a diagnostic measurement; its cost is not deducted from that final decision.

The familiar probes never changed the branch weights. After sixteen of them, none of the 256 runs chose the truly better final action, 0.8. The model continued refining the slope while remaining unable to distinguish the bending directions.

Probes at x = 2 were much more discriminating in this construction. All 256 runs switched to the better final action after the first probe. That outcome depends on the large separation between the branches relative to the noise and current slope uncertainty. It is not a promise that one observation generally identifies a world.

The middle location gave a less comfortable result. After sixteen probes at x = 1.25, **149 of 256** runs chose the better action. Seed 0 was not one of them.

<!-- figure:uncertainty_probe -->

Choose the middle probe location and watch its seed-zero trace. The probability assigned to the true downward world finishes at about **0.167**, below its initial 0.5. More potentially relevant evidence has, in this particular sequence, favored the wrong branch.

Near the boundary, the two branches differ by only 0.25 at x = 1.25, while the noise standard deviation is 0.3. Their slopes are uncertain too. After those probes, the upper branch can fit with a slope near 0.880; the lower branch uses about 1.012. The noisy data can be explained through both direction and slope. A measurement being informative does not guarantee that its realized evidence favors the truth on every run.

I kept seed 0 in the figure because it is the same seed shown in the interval experiment, not because it summarizes the average outcome. The lower panel reports the across-seed decision count alongside it. Without that second view, an illustrative trace could quietly become an argument it does not support.

## What the uncertainty changed—and what it did not

These experiments separate three repairs that I might otherwise combine under “improve uncertainty.”

The first is representing a consequential alternative. My original model could not express the bend. The second is collecting an observation whose likelihood differs between alternatives. Familiar probes could not update their relative weights. The third is using the resulting distribution under a stated decision objective. Even equal awareness of both worlds did not make the risk-neutral planner prefer the familiar action.

For an ensemble, these distinctions still matter. The variance of an equally weighted predictive mixture contains average within-member variance and variance between member means. That decomposition describes the mixture exactly. It does not prove that the members span the important ways the real system could differ. [Deep Ensembles](https://arxiv.org/abs/1612.01474) develops a practical uncertainty method and evaluates it empirically; my closed-form experiment isolates one modeling issue rather than testing that neural method.

If every ensemble member extrapolates as a line, adding members will not introduce my missing bending hypotheses. Conversely, engineering diverse extrapolations does not make every one of them plausible. The question becomes what assumptions generate the diversity and what evidence would revise it.

This is also why a validation split inside the familiar region would have been insufficient here. At the final budget it would have shown approximately nominal coverage. The failure appeared in the region of the proposed action. [Ovadia and colleagues](https://arxiv.org/abs/1906.02530) study uncertainty under dataset shift in classification; their work motivates checking shifted conditions, although the regression measurements in this post are a separate experiment.

A planner needs that evaluation to reach the decision itself. Here I report which action it selects and that action's true expected reward. A model can represent uncertainty more faithfully while selecting the same action, or discriminate the worlds accurately after an experiment that costs more than the improved decision is worth.

## What I would ask before sending the planner out

I have given the planner unusually generous conditions. The true world is in the richer family. The noise scale is known. Probes can be repeated at chosen locations. No probe is dangerous, and I have not charged for obtaining it.

There is a simple calculation that exposes the last omission. Suppose the slope is known, the two worlds initially have equal probability, a separate probe identifies the world perfectly, and exactly one reward-bearing decision follows. Without information, the best expected reward is 2. With information, choose 2 in the upper world and 0.8 in the lower: the expectation is (4 + 0.8)/2 = 2.4.

Under those assumptions, the information is worth at most 0.4 before paying for the probe. That is a separate analytical calculation, not the measured value of my noisy probe protocol. It is enough to show why complete identification need not be worth its cost.

The next experiment I would run adds that cost and asks the agent to choose whether and where to probe. I would also include a third world whose bend starts elsewhere, so the learner can encounter evidence that both current branches explain poorly. Otherwise I risk teaching a lesson about model inadequacy and then declaring success as soon as I place the answer in a two-element menu.

I have not run those extensions. What the present experiment changes for me is the question attached to a narrow band. I no longer want to ask only how much it shrank. I want to ask which alternatives the evidence could actually have ruled against, and whether those are the alternatives that matter to the next action.

[The World Models Today](/posts/the-world-models-today/) looks at the architectures used to represent and imagine those futures. This experiment sits one step earlier: before trusting an imagined future, make room for the observation that could show it wrong.

## Reproduce the experiment

Download the [Python source](/experiments/uncertainty_probe.py) and run:

```sh
python3 uncertainty_probe.py --output uncertainty-probe-results.json
```

The script uses only the standard library. The [saved results](/experiments/uncertainty-probe-results.json) include the configurations, coverage counts at every training budget, seed-zero training data and probe observations, posterior traces at all three probe locations, final branch probabilities across 256 seeds, and decision counts after every probe. A SHA-256 hash identifies the source used.

Training seeds are 0–255. Held-out noise uses seeds 100000 plus the training seed; probe noise uses 200000 plus that seed. Data prefixes are nested, and the held-out observations are shared across budgets. Those points on a coverage curve are therefore not independent repetitions. Different probe locations share their noise sequence for a controlled comparison.

The 95% intervals are Gaussian posterior predictive intervals under the linear model. The empirical coverage fraction uses one independent test output per seed and location. The probe model maintains a separate exact Gaussian slope posterior for each direction and normalizes branch likelihoods in log space. Very strong evidence may display probability 1 after floating-point rounding; it does not amount to logical certainty.

This is a synthetic test with a deliberately chosen extrapolation failure. It reports neither real-robot performance nor a replication of a published benchmark.

## References

<ol class="references">
<li>Lakshminarayanan, Pritzel &amp; Blundell (2017). <a href="https://arxiv.org/abs/1612.01474">Simple and Scalable Predictive Uncertainty Estimation using Deep Ensembles.</a> Predictive ensembles and empirical uncertainty evaluation.</li>
<li>Ovadia et al. (2019). <a href="https://arxiv.org/abs/1906.02530">Can You Trust Your Model's Uncertainty? Evaluating Predictive Uncertainty Under Dataset Shift.</a> Evaluating uncertainty beyond the training distribution in classification.</li>
</ol>
