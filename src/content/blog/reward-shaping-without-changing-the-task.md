---
title: 'Reward shaping without changing the task'
description: 'I changed the rewards, kept the better route, and watched the learner choose the worse one. A small experiment about what it means to give an agent advice.'
pubDate: 2026-10-10
tags: ['reinforcement-learning', 'reward-design']
interactive: research-essay
---

I wanted to understand what I was giving a learner when I gave it a denser reward.

“More feedback” sounds helpful. A reward at every step seems kinder than silence until the end. But feedback carries an interpretation of what has happened, and that interpretation can be premature. I wanted an example small enough that I could follow every payment and every update, including the ones that made the learner worse.

So I used a world with one decision. At the start, the agent chooses an upper or a lower route. Both take two transitions. The upper route pays 2 at the end; the lower pays 1. The first transition pays nothing. With a discount of 0.9, the two returns are 1.8 and 0.9.

There is no hidden obstacle, noisy sensor, or difficult representation to blame. The upper route is better. The question is how a learner comes to know that.

## Giving the wrong advice, carefully

I changed the payments on the upper route to −4.5, then +7. On the lower route, I changed them to +4.5, then −4.

Before adding those numbers, imagine seeing only the first transition. Which route would you recommend trying again?

The first payment recommends the lower route. The complete calculation recommends the upper one:

- Upper: −4.5 + 0.9 × 7 = **1.8**.
- Lower: +4.5 − 0.9 × 4 = **0.9**.

The new payments preserve both route returns exactly. Their timing tells a very different story. In the figure, switch between the two payment schedules; the return column stays still while the immediate rewards change sign. The advantage column compares each route with a policy that chooses them equally often.

<!-- figure:fork -->

I constructed these payments using a state potential, Φ. The start and end have potential zero. The upper intermediate state has potential −5; the lower has +5. Each transition receives an extra payment:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Shaped reward equals original reward plus gamma times the next state potential minus the current state potential"><mrow><msup><mi>r</mi><mo>′</mo></msup><mo>=</mo><mi>r</mi><mo>+</mo><mi>γ</mi><mi>Φ</mi><mo>(</mo><mi>s</mi><mo>′</mo><mo>)</mo><mo>−</mo><mi>Φ</mi><mo>(</mo><mi>s</mi><mo>)</mo></mrow></math></div>

This is the potential-based construction studied by [Ng, Harada, and Russell](https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf). Its policy-invariance guarantee does not require the potential to be wise. My deliberately misleading potential satisfies the same algebra as a useful one.

Following the extra payments through T transitions gives:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="The shaped return minus the original return equals minus the initial potential plus gamma to T times the final potential"><mrow><msup><mi>G</mi><mo>′</mo></msup><mo>−</mo><mi>G</mi><mo>=</mo><mo>−</mo><mi>Φ</mi><mo>(</mo><msub><mi>s</mi><mn>0</mn></msub><mo>)</mo><mo>+</mo><msup><mi>γ</mi><mi>T</mi></msup><mi>Φ</mi><mo>(</mo><msub><mi>s</mi><mi>T</mi></msub><mo>)</mo></mrow></math></div>

Every interior potential cancels against its next appearance. Here both boundary potentials are zero, so the extra return is zero. More generally, with zero terminal potential, the remaining offset depends on the starting state, not the actions. In a continuing discounted task, bounded potentials make the final term vanish in the infinite-horizon limit.

That explains why the destination of optimization survives. It leaves the journey of learning open. The learner receives one transition at a time and does not yet possess the future needed to interpret it.

## What happened in 300 episodes

I ran tabular Q-learning with a learning rate of 0.2. After each transition, it updates the corresponding entry in its Q-table. With probability ε = 0.1 it chooses a uniformly random route; otherwise it chooses the route with the highest current estimate, breaking ties uniformly.

I compared three versions, all starting with zero Q-values. One received the original rewards. One received the misleading shaping above. The third received an informed potential: 2 at the upper intermediate state and 1 at the lower. Those are the true remaining returns from those states. I supplied that information explicitly; this condition does not demonstrate that useful advice can be obtained for free.

Each condition ran for 300 episodes on 128 seeds. The environment is deterministic. Only exploration and tie-breaking vary across seeds.

For evaluation, I asked what each learner's current greedy policy would earn under the **original reward**. This value can be calculated exactly in the little fork, without evaluation rollouts. It is 1.8 when the learner prefers upper, 0.9 when it prefers lower, and 1.35 when it is indifferent. The plotted means average these values across seeds.

At episode 100, the original-reward learner preferred upper in 71 of 128 runs. The informed learner did so in 113. The misleading-shaped learner did so in **none**.

<!-- figure:shaping_learning -->

The optimal route had survived the transformation. After 100 episodes, every misleading-shaped learner in this experiment still preferred the other route.

By episode 300, 80 of those learners preferred upper. The original-reward condition reached 126, and the informed condition reached 128. These numbers describe this finite experiment; they are not a ranking of shaping methods across tasks. I chose the potentials deliberately, and their magnitudes differ as well as their direction.

The informed curve also does not dominate at every instant. After the very first episode its mean greedy value is slightly below the ordinary learner's. The ordinary learner still has tied start values, while the informed learner has already committed to whichever route it first sampled. Early confidence can expose a learner to a mistake before it helps correct one.

That detail made the trace more interesting to me than a single final score.

## The bad news arrived. The estimate rose anyway.

In seed 0, the misleading-shaped learner chooses the lower route first.

Its first reward is +4.5. The next state's estimate is still zero, so the start-state update is 0.2 × 4.5 = 0.9. The lower route now looks promising. On the second transition, the learner receives −4 and moves its estimate of the lower intermediate state from zero to −0.8.

It has seen the whole route. Yet its start estimate still contains the optimism from the first payment. That entry was updated before the terminal payment arrived.

On the next visit to the lower route, its new target at the start is:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="The next start state target is 4.5 plus 0.9 times minus 0.8, which equals 3.78"><mrow><mn>4.5</mn><mo>+</mo><mn>0.9</mn><mo>×</mo><mo>(</mo><mo>−</mo><mn>0.8</mn><mo>)</mo><mo>=</mo><mn>3.78</mn></mrow></math></div>

The current estimate is only 0.9. The update therefore raises it again: 0.9 + 0.2 × (3.78 − 0.9) = **1.476**.

Receiving bad news did not immediately lower the earlier estimate. The bad news had reached the intermediate state only partially, and the start still bootstrapped from that incomplete estimate. Meanwhile, a rare visit to upper begins with a payment of −4.5, making its advantage harder to discover.

Nothing in this sequence contradicts the return calculation. The calculation knows both payments and adds them with the correct discount. The learner is estimating the second payment's consequence while already using that estimate to make another decision.

I can point to the exact place where the delay enters: one update per observed transition, a learning rate below one, and future values that have not yet caught up. “The objective is unchanged” contains none of that chronology.

## A control that removes the extra rewards

There is a sharper way to investigate the result. Wiewiora's [2003 paper on shaping and Q-value initialization](https://arxiv.org/abs/1106.5267) predicts an equivalence for tabular learners. I used it as a control, rather than treating agreement between a few learning curves as an explanation.

Take learner A, which receives shaped rewards and starts at zero. Give learner B only the original rewards, but initialize every action at state s to Φ(s). In our misleading case, B starts with −5 at the upper intermediate state and +5 at the lower. Both start-state actions remain zero.

The relation to check after every update is:

<div class="equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Q B of state action equals Q A of state action plus the state potential"><mrow><msub><mi>Q</mi><mi>B</mi></msub><mo>(</mo><mi>s</mi><mo>,</mo><mi>a</mi><mo>)</mo><mo>=</mo><msub><mi>Q</mi><mi>A</mi></msub><mo>(</mo><mi>s</mi><mo>,</mo><mi>a</mi><mo>)</mo><mo>+</mo><mi>Φ</mi><mo>(</mo><mi>s</mi><mo>)</mo></mrow></math></div>

At a given state, every action receives the same offset, so greedy choices and ties agree. The Q-learning residuals agree too. Substituting Qᴮ = Qᴬ + Φ into B's residual gives r + γ max Qᴬ(s′, ·) + γΦ(s′) − Qᴬ(s, a) − Φ(s). A obtains exactly that expression by putting the potential terms into its reward. With the same step size, the offset survives the update.

This makes a stronger prediction than similar final performance. Couple the exploration and tie-breaking draws, and the two learners should choose the same actions throughout training.

They did. Across 128 seeds and 300 episodes, the misleading pair had zero mismatches in 38,400 start decisions. I checked the TD residuals and shifted Q-tables after every transition. The largest discrepancy was below 1.8 × 10⁻¹⁵, consistent with floating-point roundoff.

The figure follows the upper intermediate state's estimate in seed 0. First the raw values differ. Then account for the potential: the two histories lie on top of each other.

<!-- figure:shaping_identity -->

I repeated the control for the informed potential. Again, every action matched. Then I reversed the construction: keep the misleading shaping, but initialize its table to −Φ. This compensated learner reproduced the ordinary, zero-initialized learner's actions as well.

The extra rewards can be present or absent while the entire behavior stays the same, provided initialization moves with them. That is an established equivalence; the experiment makes its consequences visible in this particular learner.

## What did “the same starting point” mean?

My first comparison gave all three learners zero Q-tables. That is an ordinary experimental choice, and it answers a useful question: what happens if I add shaping to this learner as configured?

But zero in one reward convention does not express the same prediction as zero in another. In the equivalent original-reward description, my misleading-shaped learner began with an estimate of +5 for a state whose remaining return was only 1, and −5 for a state whose remaining return was 2.

The starting tables looked identical because I compared their numbers before accounting for what those numbers predicted.

This is the part I would carry into a larger experiment. A “neutral” initialization needs a reference. Here, moving rewards through time also changes the interpretation of a zero estimate. Calling the potential advice is reasonable, but the advice has a precise location: it can be represented as initial value estimates. That is an operational analogy to a prior, not a claim that the Q-table is a calibrated Bayesian belief.

It also changes what I would count as evidence of an improvement. If a potential helps, I want to compare it with the corresponding initialization, disclose where its information came from, and evaluate with the original task reward. Otherwise I may attribute the benefit to continuous feedback when the same behavior can be produced by changing the starting estimates once.

There is a limit to what behavior reveals here. Watching an optimal agent choose upper would not tell me whether it received an early penalty or no early reward. Both descriptions support that choice. Work on [partial identifiability in reward learning](https://proceedings.mlr.press/v202/skalse23a/skalse23a.pdf) studies such ambiguities and whether they matter for downstream decisions.

Our finite learners also show why I must specify what behavior I observed. Their early choices *do* differ under a fixed zero initialization. It would be careless to turn optimal-policy invariance into a claim that every behavioral record is identical. In the controls, the stronger agreement required moving initialization too.

## What I still want to test

I made one further check: increase exploration to ε = 0.3 while keeping the other settings fixed. You can select that run in the learning-curve figure. At episode 100, 79 of the misleading-shaped learners preferred upper; by episode 300, all 128 did. All three conditions reached the better greedy policy in every run by that final checkpoint.

Exploration changed the finite-budget conclusion without changing either route return. It gave the learner more opportunities to correct the estimates it was using to decide where to look. More exploration is not an unconditional improvement, though: the informed condition's mean accumulated training regret increased from about 44.5 to 48.1, because exploratory visits to the worse route also count. Final greedy performance and reward collected while learning answer different questions.

The remaining questions are larger than this fork. Can a neural value function represent the state-dependent offset exactly? Even if it can, will its optimizer preserve the relation after an update? What changes when a learned potential is inaccurate or changes during the trajectory? The proof above uses a fixed potential and direct table updates. It does not settle those cases.

My next experiment would hold a replay sequence fixed and compare shifted value estimates in a function approximator that can explicitly represent Φ. Only after checking the update relation would I let the agents collect their own experience. That would help separate a failure of the representation or optimizer from divergence caused by visiting different states. I have not run that experiment here.

For now, the small world is enough to revise the question I started with. Before asking whether a denser reward is helpful, I need to ask what prediction it places in the learner—and how long experience takes to undo that prediction when it is wrong.

## Reproduce the experiment

The [Python source](/experiments/reward_shaping.py) uses only the standard library. Download it, then run:

```sh
python3 reward_shaping.py --output reward-shaping-results.json
python3 reward_shaping.py --epsilon 0.3 --output reward-shaping-exploration-check.json
```

The saved [main results](/experiments/reward-shaping-results.json) and [exploration check](/experiments/reward-shaping-exploration-check.json) include configurations, all six conditions' mean curves and standard errors, action-sequence hashes, the equivalence checks, and every transition of seed 0. They record the source file's SHA-256 hash. The figures use these measured results; their condition buttons do not interpolate imaginary training runs.

All runs use seeds 0–127, 300 episodes, γ = 0.9, and α = 0.2. Each episode consumes two transitions and two random draws for the start decision. Greedy ties include actions within 10⁻¹² of the maximum and are broken uniformly. Evaluation uses that same tie convention without exploration. The bands show pointwise mean ±1 standard error across seeds, not a simultaneous confidence interval. Training regret sums 1.8 minus the original discounted return actually collected in each episode.

The terminal state has zero potential and zero bootstrap. Episodes end there; there are no time-limit truncations. Those details are part of the construction. Dropping the final potential term at an arbitrary data-collection boundary would not establish the same invariance.

This is a reproducible teaching experiment on one tiny MDP, not a benchmark or a replication of a paper's reported performance. Its usefulness is that each apparent contradiction can be followed down to an individual update.

## References

<ol class="references">
<li>Ng, Harada &amp; Russell (1999). <a href="https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf">Policy Invariance Under Reward Transformations: Theory and Application to Reward Shaping.</a> The potential-based construction and its conditions.</li>
<li>Wiewiora (2003). <a href="https://arxiv.org/abs/1106.5267">Potential-Based Shaping and Q-Value Initialization are Equivalent.</a> The tabular equivalence tested here. The archival upload is dated 2011.</li>
<li>Skalse, Farrugia-Roberts, Russell, Abate &amp; Gleave (2023). <a href="https://proceedings.mlr.press/v202/skalse23a/skalse23a.pdf">Invariance in Policy Optimisation and Partial Identifiability in Reward Learning.</a> Reward ambiguity under different forms of behavioral evidence.</li>
</ol>
