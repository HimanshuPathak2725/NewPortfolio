---
title: 'Policy gradients and the meaning of credit'
description: 'I gave a learner an action that always helped, then watched it learn from luck. An experiment about what an update can—and cannot—tell us.'
pubDate: 2026-10-10
tags: ['reinforcement-learning', 'optimization']
interactive: research-essay
---

I wanted to understand how much of an agent's success belonged to its action.

That sounds like a question a policy gradient should answer. We observe an outcome, compare it with an expectation, and make some actions more likely. But an update has to be calculated before we have a complete explanation of the outcome. Calling that update “credit” can make it sound more conclusive than it is.

I built a one-decision problem where I could separate the action's contribution from everything else. The agent chooses A = 0 or A = 1. An independent variable W then takes the value −10 or +10 with equal probability. I call it weather. The reward is R = 2A + W.

Action 1 always adds two units of reward, holding the weather fixed. There is no delayed consequence or hidden trade-off. Yet if the agent chooses it during bad weather, it receives −8. I wanted to follow that observation through the update, rather than assume the learning rule would interpret it as I did.

## A helpful action, followed by a harmful update

The policy chooses action 1 with probability p = sigmoid(θ). Its expected reward is J = 2p, because the weather averages to zero. Differentiating with respect to the logit gives:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="The derivative of expected reward with respect to theta is two p times one minus p"><mrow><mfrac><mrow><mi>d</mi><mi>J</mi></mrow><mrow><mi>d</mi><mi>θ</mi></mrow></mfrac><mo>=</mo><mn>2</mn><mi>p</mi><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo></mrow></math></div>

At p = 1/2, the true gradient is +0.5. Increasing the logit improves expected reward locally. A sampled score-function estimate, with baseline b, is:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="The sampled gradient is action minus probability, times reward minus baseline"><mrow><mi>g</mi><mo>=</mo><mo>(</mo><mi>A</mi><mo>−</mo><mi>p</mi><mo>)</mo><mo>(</mo><mi>R</mi><mo>−</mo><mi>b</mi><mo>)</mo></mrow></math></div>

Here A − p is the derivative of the sampled action's log probability. For the ordinary baseline I use the exact expected reward, b = 2p. The critic is therefore perfect at predicting the average before the action. Any problem we see cannot be blamed on a poorly fitted value network.

Consider the outcome A = 1, W = −10 at the initial policy. The estimate is (1 − 0.5)(−8 − 1) = −4.5. With the learning rate used below, 0.05, the logit moves from zero to −0.225. The probability of the helpful action falls from 0.5 to about 0.444.

This is a possible first update, calculated exactly. Enumerating all four action–weather outcomes gives estimates +5.5, −4.5, −4.5, and +5.5. Their average is the correct +0.5. Half point the wrong way.

<!-- figure:luck -->

The first part of the animation removes the weather from the baseline residual. The last part deliberately leaks the reward into the baseline and erases the gradient. I will use both as controls, because a quieter update is not necessarily a more faithful one.

The distinction matters before any training begins. Unbiasedness describes an expectation over possible samples at the current policy. It does not attach a correct explanation to each realized episode. The [policy-gradient theorem](https://proceedings.neurips.cc/paper_files/paper/1999/file/464d828b85b0bed98e80ade0a5c43b0f-Paper.pdf) provides the broader sequential framework; this bandit lets me inspect the estimator without state-visitation or bootstrapping complications.

## Letting the estimator become a learner

An enumeration can establish the mean and variance. It cannot show the whole effect of an early mistake on the policy that generates later data. For that, I ran sampled learning.

Each run begins at θ = 0 and takes 800 updates, one action and one weather draw per update. The step size stays at 0.05. I used seeds 0–127 and shared the underlying uniform random draws across conditions. Once policies diverge, the same action draw need not select the same action.

I compared four supplied baselines. The ordinary baseline knows 2p. The weather baseline knows W + 2p. A third, score-weighted baseline uses W + 2(1 − p); I will derive that choice shortly. The deliberately invalid control uses the sampled reward itself, b = R.

These are analytical baselines. I did not train a critic or learn to identify weather from pixels. Supplying the decomposition lets me isolate what happens when that information is available.

At update 800, the ordinary baseline achieved a mean expected reward of **1.875** out of a maximum of 2. Six of its 128 policies still assigned more probability to the worse action. The weather baseline reached **1.973**, and every run preferred the better action. The score-weighted control also reached about **1.972**, while the reward-leaking control stayed at **1.000** throughout.

<!-- figure:credit_learning -->

The plotted quantity is the exact expected reward of the current policy, 2p. It is not the noisy reward collected on the last trial. Playback reveals saved checkpoints every four updates; the bands show one standard error across seeds.

I find the comparison at update 200 useful too. The ordinary condition averaged 1.728; the weather condition averaged 1.873. By changing what the baseline knew, I changed how quickly a finite learner extracted a simple preference from noisy experience.

The frozen control is just as informative. Setting b = R gives zero residual on every trial. Its prediction error is zero, its gradient variance is zero, and its policy never moves. Looking only for a smoother learning signal would count the failure as a success.

## What may a baseline know?

Subtracting b preserves the expected gradient when its expected contribution through the score vanishes:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Expected action minus probability times baseline must equal zero"><mrow><mi>𝔼</mi><mo>[</mo><mo>(</mo><mi>A</mi><mo>−</mo><mi>p</mi><mo>)</mo><mi>b</mi><mo>]</mo><mo>=</mo><mn>0</mn></mrow></math></div>

A fixed baseline satisfies this because E[A − p] = 0. So does a function of the independent weather, conditional on the current policy. Weather can be revealed after the action without invalidating the cancellation. What matters in this construction is the statistical dependency, not the timestamp at which I learn W.

Using b = W + 2p leaves g = (A − p)(2A − 2p). At p = 1/2, both possible actions now give +0.5. The weather was responsible for all the gradient variance at that particular policy.

Using b = R is different. The baseline contains the effect of A itself. It subtracts the very contribution I am trying to estimate. Detaching that number in an automatic-differentiation graph would not fix the statistical dependence. A stop-gradient operation controls derivatives; it does not alter which random variables produced the number.

This is the constraint that makes [Mesnard and colleagues' work on counterfactual credit assignment](https://proceedings.mlr.press/v139/mesnard21a.html) interesting to me. They study future-conditioned baselines and constrain hindsight information to avoid leaking the credited action. My observed weather is a supplied example of exogenous information, not a reproduction of their learned feature-extraction method.

Nor should I promote independence into a necessary condition for every imaginable estimator. The equation above is the condition for this uncorrected baseline subtraction. Independence is a convenient sufficient condition. More elaborate action-dependent estimators can require additional correction terms.

## Removing luck did not remove every random choice

There was another detail to check. The weather-only curve has a small spread across seeds, even though I just showed an exact zero-variance calculation.

That calculation fixed p at one half. Training does not keep it there.

With the weather removed, action 0 produces g₀ = 2p², and action 1 produces g₁ = 2(1 − p)². At p = 0.9, those estimates are 1.62 and 0.02. The first occurs only a tenth of the time. Their weighted average is still 0.18, the correct gradient, but their variance is 0.2304.

A policy increasingly committed to the better action usually gets a tiny update. Occasionally it samples the other action and gets a much larger one. Those estimates are both positive, yet the learning history remains stochastic.

<!-- figure:credit_sampling -->

The green curve comes from the score-weighted baseline. After subtracting weather, write the baseline's remaining constant as c. The two estimates are pc and (1 − p)(2 − c). Setting them equal gives c = 2(1 − p). Both estimates then equal 2p(1 − p), regardless of which action was sampled.

That is why all seeds of the weighted control follow the same learning curve up to floating-point effects. I have constructed a sampled estimator that equals the exact gradient on every draw. It is a property of this two-action, additive problem with supplied knowledge. It would be a serious overreach to expect a general actor–critic to have such a baseline.

It also explains why “predict the return as accurately as possible” and “minimize gradient variance” are different instructions. The score multiplies the residual. A baseline that is optimal for unweighted squared prediction error need not be optimal after that multiplication.

## The result I would not turn into a slogan

I repeated the runs with weather magnitude 2 instead of 10. The condition buttons switch between those experiments.

With weaker weather, the ordinary baseline reached mean expected reward 1.9728, compared with 1.9726 for the weather baseline and 1.9725 for the weighted control. Every ordinary run preferred the better action. These tiny differences do not support a meaningful performance ranking from this experiment, but they do prevent a claim that removing more variance gave the largest observed final mean in every setting.

The zero-variance control provides a clean optimization path. The other learners take random finite steps through a nonlinear policy parameterization. Equal expected gradients at the *same* parameter do not imply equal distributions of parameters after many updates. A variance calculation alone does not rank those final distributions.

The high-noise result remains useful: here, at this learning rate and budget, exogenous noise made learning less reliable. The low-noise check makes that conclusion more specific. I would want a learning-rate sweep, matched interaction budgets, and a learned-baseline experiment before making a practical recommendation for a larger system.

## What I mean when I call an update credit

The experiment gives me three different quantities to keep apart. The individual effect of action 1 at fixed weather is 2. The derivative with respect to the logit at p = 1/2 is 0.5. A particular sampled estimate can be −4.5.

They are compatible because they compare different things: two actions under the same weather, two nearby action distributions, and one noisy observation used to estimate that derivative. Much of the apparent contradiction disappears once the comparison is named.

I supplied the structural rule R = 2A + W, so I can calculate the individual counterfactual by holding W fixed. An ordinary training trace does not necessarily identify that rule. To make the missing information concrete, imagine a hidden fair bit U. One world gives rewards R(0) = U and R(1) = U. Another gives R(0) = U and R(1) = 1 − U.

Under randomized actions, both worlds produce the same reward distribution for either action: half zeros, half ones. Their expected-return gradients are both zero. In the first world the action never changes an individual's outcome; in the second it changes every outcome, helping half and harming half. The observed marginals do not reveal how the two potential outcomes pair within a trial.

This is why I would hesitate to read a positive advantage as a complete explanation of one success. It is evidence used by a particular estimator toward a particular objective. It may be useful for improvement without identifying what would have happened to that same episode under another action.

The next experiment I want is less forgiving than observed weather: a learned hindsight feature that becomes slightly correlated with the action. I would measure its gradient bias as well as its prediction error, then test whether the lower variance compensates for that bias under a fixed budget. I have not run it here. The current controls establish why both measurements would be needed.

[The reward-shaping experiment](/posts/reward-shaping-without-changing-the-task/) made me examine what an initial value estimate meant. This one makes me examine what an update means. In both cases, the number becomes more informative when I resist assigning it an explanation it has not earned.

## Reproduce the experiment

Download the [Python source](/experiments/credit_assignment.py) and run:

```sh
python3 credit_assignment.py --output credit-assignment-results.json
```

It uses only the standard library. The [saved results](/experiments/credit-assignment-results.json) include both weather magnitudes, all four baselines, 128 final policy values per condition, complete seed-zero value histories and their first twelve updates, and exact four-outcome enumerations at 41 fixed probabilities. The source hash ties the figures to the script.

Each update uses fresh action and weather draws from `random.Random(seed)`, in that order. There is no entropy bonus, clipping, replay, learned critic, or gradient accumulation. All methods use the same learning rate and number of interactions. The bands are pointwise mean ±1 standard error across runs, not a confidence guarantee for a whole trajectory. This is a controlled teaching experiment, not a benchmark comparison or a replication of either cited paper.

## References

<ol class="references">
<li>Sutton, McAllester, Singh &amp; Mansour (1999). <a href="https://proceedings.neurips.cc/paper_files/paper/1999/file/464d828b85b0bed98e80ade0a5c43b0f-Paper.pdf">Policy Gradient Methods for Reinforcement Learning with Function Approximation.</a> The sequential policy-gradient framework and its approximation conditions.</li>
<li>Mesnard et al. (2021). <a href="https://proceedings.mlr.press/v139/mesnard21a.html">Counterfactual Credit Assignment in Model-Free Reinforcement Learning.</a> Hindsight information, baseline construction, and the action-information constraint.</li>
</ol>
