---
title: 'The World Models Today'
description: 'How world models represent hidden state, learn dynamics, and turn predictions into decisions, with five animated explanations.'
pubDate: 2026-10-10
tags: ['world-models', 'reinforcement-learning', 'control', 'interactive-learning']
draft: false
interactive: 'world-models'
hero:
  src: '/images/world-models/state-space-v2.png'
  alt: 'A computed phase portrait showing three action-conditioned futures from one initial spring state.'
  width: 1200
  height: 738
  caption: 'One present, three possible futures in a controlled spring system.'
---

<header class="wm-chapter-heading" id="foundations" data-chapter>
<span>01 / Foundations</span>
<h2>What a world model predicts</h2>
</header>

A world model is useful because an agent cannot try every possible future. It needs a way to represent its situation, anticipate consequences, and connect those consequences to a decision. Learning the subject therefore brings together **probability, representation learning, dynamical systems, reinforcement learning, and control**.

Begin with a decision problem. An agent receives an observation, selects an action, and receives another observation and a reward. A model can predict some part of that transition. A policy chooses the action. A reward or cost specifies what the decision is trying to achieve. These are related components, but they are different objects.

The useful question is **“What must be predicted well enough for this decision?”** For stabilizing a pendulum, angular position and velocity matter. For navigation, an occupied doorway matters. For visual scene generation, appearance matters too. An abstraction is useful only relative to what the system will do with it.

### The mathematics underneath

The equations draw on a few recurring ideas. Vectors describe state, covariance describes how uncertainty is distributed, and gradients tell us how a prediction changes when its parameters change. Probability becomes essential as soon as one observation admits several possible explanations.

In deep learning, connect those ideas to an encoder, an autoregressive sequence model, a recurrent memory, and a generative objective. A variational autoencoder adds a latent-variable interpretation; attention adds a way to condition on a sequence of evidence. The prerequisite is understanding the mechanism well enough to identify the input, output, loss, and information available at prediction time.

Keep [Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra), [Deep Learning](https://www.deeplearningbook.org/), and [Dive into Deep Learning](https://d2l.ai/) available as references. For a deeper probabilistic treatment, use [Murphy’s Advanced Topics](https://probml.github.io/pml-book/book2.html). You can learn a missing piece when the next experiment actually needs it.

### Where reinforcement learning enters

An MDP describes states, actions, rewards, and transition probabilities. A policy maps the available decision state to an action distribution. A value function estimates future return under a policy. The Bellman relationship connects the value of a state to immediate reward and the value of possible next states.

<div class="wm-equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Value of state s under policy pi equals the expected immediate reward plus discounted value of the next state."><mrow><msup><mi>V</mi><mi>π</mi></msup><mo>(</mo><mi>s</mi><mo>)</mo><mo>=</mo><mi mathvariant="double-struck">E</mi><mo>[</mo><mi>r</mi><mo>+</mo><mi>γ</mi><msup><mi>V</mi><mi>π</mi></msup><mo>(</mo><mi>s</mi><mo>′</mo><mo>)</mo><mo>∣</mo><mi>s</mi><mo>,</mo><mi>a</mi><mo>∼</mo><mi>π</mi><mo>]</mo></mrow></math></div>

<p>Value is about an objective and a policy. Dynamics alone do not define what the agent wants.</p>

The expectation accounts for uncertain actions or transitions. The discount γ controls how future rewards contribute in this formulation. Policy evaluation, temporal-difference learning, and actor-critic methods provide several places to use model-generated experience. [Sutton and Barto](http://incompleteideas.net/book/the-book-2nd.html) is the starting reference.

### Three ways a prediction can matter

A planner can search predicted futures at decision time. A learner can improve its policy using simulated experience. An evaluator can use a prediction to identify a failure, select data, or decide when to obtain new evidence. A system may combine several of these uses.

The recent [Plausible → Controllable → Actionable survey](https://arxiv.org/abs/2609.16697) offers a useful capability hierarchy: preserve relevant structure; respond appropriately to interventions; and demonstrate that prediction improves a behavior or workflow. Use it as an evaluation lens, not as a claim that every paper already satisfies all three levels.

The same five choices recur across these systems: state, prediction target, action interface, objective, and the decision being evaluated.

<header class="wm-chapter-heading" id="hidden-state" data-chapter>
<span>02 / State and belief</span>
<h2>Observation and hidden state</h2>
</header>

A picture of a moving object tells you where it appears now. It does not necessarily tell you its velocity. Two physically different situations can produce the same observation while requiring different actions.

That is the central difficulty of partial observability. The agent has evidence about a state; it may not have the state itself. A POMDP makes this distinction explicit. Instead of pretending that the latest image contains everything, the agent can maintain a **belief**: a distribution over hidden states consistent with its history.

<div class="wm-equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Belief b at time t is the probability distribution of hidden state s at time t conditioned on observations and previous actions."><mrow><msub><mi>b</mi><mi>t</mi></msub><mo>(</mo><mi>s</mi><mo>)</mo><mo>=</mo><mi>p</mi><mo>(</mo><msub><mi>s</mi><mi>t</mi></msub><mo>=</mo><mi>s</mi><mo>∣</mo><msub><mi>o</mi><mrow><mn>1</mn><mo>:</mo><mi>t</mi></mrow></msub><mo>,</mo><msub><mi>a</mi><mrow><mn>1</mn><mo>:</mo><mi>t</mi><mo>−</mo><mn>1</mn></mrow></msub><mo>)</mo></mrow></math></div>

<p>Observations constrain a hidden state; history can change which states remain plausible.</p>

In the animation below, the two possible velocities have equal weight by construction. The current position agrees with both. Revealing the previous observation resolves which direction the object was moving in this noise-free example. With noisy measurements, evidence would usually reweight possibilities instead of eliminating one perfectly.

<!-- hub:belief -->

### State estimation and memory

An estimator combines a prediction with new evidence. A Kalman filter does this analytically under linear-Gaussian assumptions. Extended and other nonlinear filters relax parts of that setting. A learned recurrent system may compress evidence into memory without exposing a human-readable state distribution.

A recurrent hidden vector can retain history without representing calibrated uncertainty. Its usefulness depends on which distinctions survive compression and whether they matter for the decision. The [MIT state-estimation notes](https://underactuated.mit.edu/state_estimation.html) provide a control-oriented reference.

There is a useful separation between **state estimation** and **system identification**. Estimation asks “What state is the system in now?” Identification asks “What dynamics explain the observed transitions?” These can interact, but improving one does not automatically solve the other.

<details><summary>two identical images, two different actions?</summary><p>A pendulum can pass through the same angle while moving clockwise or counterclockwise. If the correct force depends on angular velocity, the angle image alone is insufficient. History or a velocity measurement can distinguish the states.</p></details>

This ambiguity also affects control. A policy receiving only position has to choose the same action for both velocities, even when one state needs braking and the other needs acceleration.

<header class="wm-chapter-heading" id="learn-dynamics" data-chapter>
<span>03 / Learning the transition</span>
<h2>Learning dynamics from data</h2>
</header>

Start with an inspectable physical system. For a spring-like particle, a state contains position x and velocity v. An action u applies force. Stiffness k pulls toward the equilibrium; damping c reduces velocity.

<div class="wm-equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Acceleration equals action minus stiffness times position minus damping times velocity."><mtable columnalign="right left"><mtr><mtd><mfrac><mrow><mi mathvariant="normal">d</mi><mi>v</mi></mrow><mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow></mfrac></mtd><mtd><mo>=</mo><mi>u</mi><mo>−</mo><mi>k</mi><mi>x</mi><mo>−</mo><mi>c</mi><mi>v</mi></mtd></mtr><mtr><mtd><mfrac><mrow><mi mathvariant="normal">d</mi><mi>x</mi></mrow><mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow></mfrac></mtd><mtd><mo>=</mo><mi>v</mi></mtd></mtr></mtable></math></div>

<p>Here k and c are fitted from sampled states, actions, and noisy acceleration measurements.</p>

We generate transition measurements from known coefficients k = 0.8 and c = 0.15. The learner begins with incorrect coefficients and minimizes mean squared error through gradient descent. A separate seeded dataset supplies held-out evaluation. For this example, 96 measurements with Gaussian noise σ = 0.03 supply the training data.

Both springs below begin at the same position with zero velocity. On the left, the predictor uses its initial guess; on the right, it uses the coefficients after 120 gradient steps. The outlined block follows the true system. The colored block follows the prediction. Their separation makes the rollout error visible.

<!-- hub:learning -->

### Where this example stops

The model class already contains the correct equation, and it only has two trainable parameters. This is a deliberately small system-identification problem. It does not reproduce the difficulty of discovering objects, learning a visual representation, or predicting contact dynamics with a neural network.

Even here, test the predictor under conditions that differ from the training data. A low error on randomly sampled transitions does not establish that a model remains accurate over a long recursively generated trajectory. In a real experiment, split whole episodes before evaluating to avoid near-duplicate neighboring frames crossing the split.

For a neural version, provide the current state and action to an MLP and predict the next state or a state change. Use a stochastic model if the transition or measurement process requires a distribution. Record the representation, normalization, loss, and dataset coverage so an error curve has an interpretable meaning.

### From identification to model-based RL

Dyna connects real experience, model learning, simulated transitions, and value updates. PILCO brings probabilistic dynamics and uncertainty into policy search. PETS combines probabilistic ensembles with trajectory sampling. MBPO studies how to use model-generated experience without trusting arbitrary rollout lengths.

Together, these methods connect fitting a predictor to using its simulated experience. Their differences concern uncertainty, model bias, and how far to trust a rollout. The original sources are [Dyna](https://doi.org/10.1145/122344.122377), [PILCO](https://www.deisenroth.cc/publication/deisenroth-2011-c/), [PETS](https://arxiv.org/abs/1805.12114), and [MBPO](https://arxiv.org/abs/1906.08253).

Fitting minimizes acceleration error on sampled transitions. The animation shows a different test: the position reached after integrating those accelerations over six seconds.

<header class="wm-chapter-heading" id="latent-imagination" data-chapter>
<span>04 / Representation and imagination</span>
<h2>Latent state and imagination</h2>
</header>

Images are large, redundant observations. A latent model learns a representation in which predicting important changes can be easier. The challenge is to discard irrelevant detail while preserving the distinctions needed for future decisions.

The original [World Models](https://arxiv.org/abs/1803.10122) work combines observation compression, a recurrent predictive model, and a controller. [PlaNet](https://arxiv.org/abs/1811.04551) advances planning from pixels with learned latent dynamics and a recurrent state-space model. The conceptual jump is from “predict the next measurement” to “maintain a useful, history-aware predictive state.”

### The two paths through an RSSM

A recurrent state-space model can combine deterministic memory h with a stochastic latent variable z. Memory carries forward information from the preceding state and action. A predictive prior estimates the current latent using that memory. When an observation is available, an observation-conditioned posterior can update the latent representation.

<!-- hub:rssm -->

In symbols, the distinction is between p(z<sub>t</sub> | h<sub>t</sub>) and q(z<sub>t</sub> | h<sub>t</sub>, o<sub>t</sub>). **During imagination, the model has no new real observation with which to correct the prediction.** It must continue through its predictive path.

The next animation follows a scalar Gaussian update. It is an analytic filter example, not a Dreamer implementation. A precise measurement receives more weight; a noisy measurement leaves more influence with the prior.

<!-- hub:posterior -->

The prior has mean 0 and standard deviation 0.5. The observation is 0.6 with measurement noise σ = 0.25. Combining their precisions gives a posterior mean of 0.48 and standard deviation of about 0.224. The curves appear in sequence to show the ingredients of this single update.

### What the training objective must preserve

Reconstruction can encourage a latent state to retain observation information. Reward and continuation prediction can preserve signals relevant to return and episode termination. Predictive or representation losses connect observation-conditioned states to states the model can generate without new evidence. Multi-step consistency must also be investigated.

A representation can become easy to predict by discarding important distinctions. Conversely, a highly detailed representation can be expensive to model and still fail to preserve the variable a controller needs. “Compact” and “useful” are different properties.

<details><summary>write down a latent model’s training problem.</summary>
<p>A simplified variational state-space objective combines observation reconstruction, optional task-signal prediction, and a penalty aligning an observation-conditioned posterior with a predictive prior. The expectation is taken over the inferred latent trajectory. The exact factorization and weighting depend on the model.</p>
<div class="wm-equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="A schematic loss combines reconstruction, task prediction, and a weighted KL divergence between posterior and prior."><mtable columnalign="left"><mtr><mtd><mi>ℒ</mi><mo>=</mo><msub><mi mathvariant="double-struck">E</mi><mi>q</mi></msub><mo>[</mo><msub><mi>ℒ</mi><mtext>reconstruction</mtext></msub><mo>+</mo><msub><mi>ℒ</mi><mtext>task</mtext></msub><mo>]</mo></mtd></mtr><mtr><mtd><mspace width="2em"/><mo>+</mo><mi>β</mi><msub><mi>D</mi><mtext>KL</mtext></msub><mo>(</mo><mi>q</mi><mo>(</mo><mi>z</mi><mo>∣</mo><mi>h</mi><mo>,</mo><mi>o</mi><mo>)</mo><mo>‖</mo><mi>p</mi><mo>(</mo><mi>z</mi><mo>∣</mo><mi>h</mi><mo>)</mo><mo>)</mo></mtd></mtr></mtable></math></div>

<p>This is a teaching schematic, not DreamerV3’s exact implementation or full sequence objective.</p>
<p>The reconstruction term discourages throwing away everything in the input. The predictive alignment term asks the model to produce useful latent states without new observations. Neither alone establishes useful control. Trace where gradients flow and which quantities are stopped, balanced, or clipped in the implementation you actually study.</p>
</details>

### Why the Dreamer sequence matters

[Dreamer](https://arxiv.org/abs/1912.01603) uses latent imagination to learn behavior. [DreamerV2](https://arxiv.org/abs/2010.02193) develops discrete latent representations. [DreamerV3](https://www.nature.com/articles/s41586-025-08744-2) develops a more robust recipe across varied tasks. [Dreamer 4](https://arxiv.org/abs/2509.24527) explores scalable world-model training and behavior learning from offline data in a different setting.

In the implementation, the interesting boundary is where observed experience ends and imagined experience begins. The posterior has access to an image; the imagined actor and critic depend on states generated without one. Tensor shapes describe the computation, but that information boundary explains what the computation is allowed to know.

<details><summary>why can a one-step model look good and imagination still fail?</summary><p>One-step evaluation can condition on a true observed state. A recursive rollout conditions later predictions on the model’s own outputs. Those inputs can drift from the states seen in training, and there is no real observation to correct them during the imagined sequence.</p></details>

<header class="wm-chapter-heading" id="planning" data-chapter>
<span>05 / Planning and control</span>
<h2>Planning with an imperfect model</h2>
</header>

A dynamics model answers what might happen. A planner needs an objective to decide which action sequence to prefer. It can simulate candidates, accumulate predicted cost, and optimize over actions.

<div class="wm-equation"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Choose an action sequence minimizing expected cumulative cost plus terminal value."><mtable columnalign="left"><mtr><mtd><msubsup><mi>a</mi><mrow><mn>0</mn><mo>:</mo><mi>H</mi><mo>−</mo><mn>1</mn></mrow><mo>*</mo></msubsup><mo>=</mo><munder><mrow><mi mathvariant="normal">arg min</mi></mrow><mrow><msub><mi>a</mi><mrow><mn>0</mn><mo>:</mo><mi>H</mi><mo>−</mo><mn>1</mn></mrow></msub></mrow></munder></mtd></mtr><mtr><mtd><mspace width="1em"/><mi mathvariant="double-struck">E</mi><mo>[</mo><munderover><mo>∑</mo><mrow><mi>t</mi><mo>=</mo><mn>0</mn></mrow><mrow><mi>H</mi><mo>−</mo><mn>1</mn></mrow></munderover><mi>c</mi><mo>(</mo><msub><mi>s</mi><mi>t</mi></msub><mo>,</mo><msub><mi>a</mi><mi>t</mi></msub><mo>)</mo><mo>+</mo><msub><mi>V</mi><mtext>terminal</mtext></msub><mo>(</mo><msub><mi>s</mi><mi>H</mi></msub><mo>)</mo><mo>]</mo></mtd></mtr></mtable></math></div>

<p>The terminal estimate summarizes what lies beyond a finite planning horizon.</p>

In the following animation, the planner samples and optimizes candidate action sequences. Four force intervals define each sequence. A cross-entropy method keeps an elite set and updates the sampling mean and spread. The objective rewards approaching the goal through cost reduction and penalizes effort, unsafe boundaries, and the obstacle when that obstacle is included in the predictive model.

Across six passes, the candidate paths concentrate around lower-cost solutions. The selected sequence then runs in an environment with collision rules. When the predictive model omits the obstacle, the imagined and executed paths separate: the optimizer has found a good answer to an incomplete problem.

Both comparisons use seed 14, a 28-step horizon, and 96 candidates per pass. The only changed assumption is whether the model includes the obstacle. Different seeds and horizons can produce different outcomes; this pair illustrates model mismatch rather than estimating average performance.

<!-- hub:planning -->

### Planning once versus replanning

The animation executes a complete chosen sequence so the prediction/execution discrepancy stays visible. In model predictive control, an agent usually executes the first action or a short prefix, obtains another observation, and solves the planning problem again. Replanning can reduce the period for which it relies on an uncorrected prediction.

That does not make MPC immune to a missing obstacle. If every new plan uses a model that excludes an important constraint, the planner can repeat the same mistake. A mechanism for updating the model, detecting failure, or applying a separate constraint is still needed.

The animation uses known simple dynamics and a hand-written objective. It is a visualization of trajectory optimization, not the neural latent planner from TD-MPC2. It makes visible the relationship between the action distribution, objective, selected prediction, and execution.

### Three different routes from model to action

**Search at decision time.** MuZero combines learned dynamics with reward, policy, and value predictions to support tree search. Its model need not reconstruct every observation. [MuZero paper](https://arxiv.org/abs/1911.08265).

**Optimize a trajectory.** TD-MPC and TD-MPC2 use task-oriented latent dynamics and value estimates for local trajectory optimization. Read these after a simple MPC implementation so you can distinguish the learned representation from the planning procedure. [TD-MPC](https://arxiv.org/abs/2203.04955), [TD-MPC2](https://arxiv.org/abs/2310.16828).

**Train behavior in imagination.** A Dreamer-style policy learns from predicted trajectories and later chooses actions through the learned actor. This is different from explicitly sampling candidate trajectories at every decision.

Distinguish improving a prediction model, improving a policy, and increasing a planner’s search budget. They can change behavior for different reasons.

<header class="wm-chapter-heading" id="architecture-atlas" data-chapter>
<span>06 / The architecture atlas</span>
<h2>Why the architectures diverge</h2>
</header>

The next conceptual jump is realizing that there is no single necessary prediction target. A model can generate observations, predict tokens, preserve task-oriented features, or estimate reward and value. Which target is useful depends on how the model will be used.

The figures below trace what each architecture represents and what its predictions are used for. Start with the complete computation, or follow the animated trace through state inference, training, and decision-making. Each figure names the version it describes. Colors distinguish observations and memory, predicted quantities, actions, and learning objectives; line styles distinguish computation, recurrence, supervision, and parameter updates.

<!-- hub:atlas -->

### A Transformer does not settle the representation question

[IRIS](https://arxiv.org/abs/2209.00588) treats dynamics as sequence modeling over discrete visual representations with an autoregressive Transformer. This brings tokenization and context into the world-model problem. The temporal model can only work with the information its visual tokens preserve.

A low token-prediction loss does not by itself answer whether the model supports good decisions. Inspect reconstruction errors, recursive rollouts, the action interface, and behavior in the actual task.

### Predicting features is a different commitment

JEPA-style objectives predict representations rather than directly reconstructing every pixel. Depending on the variant, the target can concern masked regions or temporal structure. [V-JEPA 2](https://ai.meta.com/research/publications/v-jepa-2-self-supervised-video-models-enable-understanding-prediction-and-planning/) connects representation learning with prediction and, in its action-conditioned 2-AC variant, robot planning. [V-JEPA 2.1](https://arxiv.org/abs/2603.14482) develops dense visual representations.

The practical question is what those features preserve and how a downstream system uses them. A representation checkpoint is not automatically an action-conditioned simulator or a complete controller.

### Generating a world introduces another set of tests

Genie’s [original paper](https://arxiv.org/abs/2402.15391) learns controllable environments from video using a latent action model. [Genie 2](https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/) and [Genie 3](https://deepmind.google/models/genie/) expand the interactive generation direction. OpenAI’s [original Sora technical report](https://openai.com/index/video-generation-models-as-world-simulators/) studies large-scale video generation and documents both simulator-like capabilities and limitations. That report is a historical architectural reference, not a description of every subsequent Sora release.

The key questions are whether the model responds to changed actions, maintains relevant state when it leaves the view, and supports a measured downstream task. Attractive video and reliable closed-loop dynamics require different evidence.

### Embodiment makes the interface concrete

[DayDreamer](https://arxiv.org/abs/2206.14176) brings world-model behavior learning to physical robots. [RoboDreamer](https://arxiv.org/abs/2404.12377) studies compositional world models for robot imagination. The [Cosmos ecosystem](https://docs.nvidia.com/nim/cosmos/latest/introduction.html) spans model-specific generation, transformation, and reasoning workflows; its [Cosmos 3 research page](https://research.nvidia.com/labs/cosmos-lab/cosmos3/) is an additional current reference.

For any embodied system, inspect the sensory inputs, action representation, embodiment, data coverage, and evaluation environment. Game actions, latent video actions, and robot actuator commands are different interfaces. A successful result under one interface does not establish transfer to another.

**Research snapshot checked October 10, 2026.** The atlas is a selection of approaches. It does not rank incompatible benchmarks or assume that the newest name supersedes every older conceptual tool.

<header class="wm-chapter-heading" id="evaluation" data-chapter>
<span>07 / Uncertainty and evaluation</span>
<h2>Where predictions break down</h2>
</header>

Every imagined transition depends on the predictive state it receives. In a recursive rollout, an error can change the next input, which changes the next prediction. The result may be a trajectory outside the training distribution.

But “model error” does not name one universal phenomenon. Measurement noise can make the state ambiguous. Uncertain parameters can produce disagreement between dynamics models. A misspecified model class can make all models agree on an incorrect result. A policy can steer the system into states that the dataset scarcely covers.

Thirteen spring models below share an initial state but disagree about stiffness. Their mean stiffness is also different from the true system. One group rolls forward without correction. The other receives the exact state every eight steps, or 0.4 seconds. Its predictions repeatedly return to the observed trajectory, although the incorrect parameter assumptions remain.

<!-- hub:uncertainty -->

### Spread is not automatically confidence

The band shows the minimum and maximum of these thirteen selected trajectories. It is not a 95% interval, and the number of members does not make it calibrated. Reducing their parameter spread can make the models more confident-looking while their shared assumption remains wrong.

**Epistemic uncertainty** concerns missing knowledge about the model or its parameters. **Aleatoric uncertainty** concerns variability in the observation or transition process. Separating them requires an explicit modeling assumption; a fan of arbitrary deterministic models does not provide a full uncertainty decomposition.

[PETS](https://arxiv.org/abs/1805.12114) is a useful reference for ensembles and uncertainty propagation. [MBPO](https://arxiv.org/abs/1906.08253) is a useful reference for balancing additional imagined experience against model error. Read them alongside experiments that vary horizon and dataset coverage.

### An evaluation ladder

| Capability | Controlled comparison | Useful measurements |
| --- | --- | --- |
| Predict observed transitions | Held-out episodes; compare one-step and recursive prediction | State error against horizon; failure slices |
| Preserve task-relevant structure | Occlusions, contacts, and persistent object changes | Consistency under the chosen task’s rules |
| Respond to actions | Fix starting context and change the action sequence | Correct sensitivity to action and constraint changes |
| Express uncertainty | Test covered and shifted conditions | Calibration, coverage, disagreement, and error together |
| Improve decisions | Match real data, compute, and task evaluation budgets | Real return or success, interaction cost, and recovery |

Report which capability your result actually tests. A demonstration of interactive response is useful, but it is not the same as demonstrating a better planning policy.

### Conditioning and intervention

Action-conditioned prediction, p(s′ | s, a), is not automatically a causally identified intervention model, p(s′ | s, do(a)). If actions in the dataset depend on hidden circumstances, a model can learn correlations that fail when a different policy selects actions.

The practical response is to examine data collection, vary actions under controlled conditions where possible, and describe the assumptions behind a causal claim. A model’s input having an “action” field is not sufficient evidence of intervention validity.

### Three research extensions of the same problem

**Other agents change the transition.** A pedestrian, opponent, or collaborating robot chooses actions too. A predictor may need to represent another agent’s intention or policy, and the behavior it observes can change in response to the learner. Test a changed counterpart policy rather than assuming training-time behavior remains fixed.

**Embodiment changes what an action means.** The same abstract instruction can correspond to different actuator ranges, kinematics, delays, or contact dynamics. A shared representation can help, but cross-embodiment evaluation must specify how observations and actions are aligned. A result with one robot is evidence about that setup, not automatic evidence about every body.

**Driving adds representation choices.** Future images, object trajectories, occupancy, and geometry expose different errors and support different downstream decisions. Preserve the coordinate system, action interface, and evaluated horizon when comparing models. An accurate-looking scene is only one part of a driving task’s evidence.

These extensions are ways to turn the same state/prediction/action questions into research protocols. The surveys below provide a broader map of embodiments, representations, and evaluation settings.

### The questions that remain open

Long-horizon memory, uncertainty calibration, multi-agent interaction, changing embodiments, physical consistency, compute cost, and failure recovery all complicate a general world model. These problems interact: adding memory can change state estimation; changing the embodiment can change action semantics; reducing latency can constrain prediction detail.

The [comprehensive embodied-AI survey](https://arxiv.org/abs/2510.16732) organizes approaches by functionality, temporal modeling, and spatial representation. The [actionability survey](https://arxiv.org/abs/2609.16697) puts behavior improvement at the center. The spring and obstacle examples give their categories concrete counterparts: state error, model mismatch, and the cost of acting on a wrong prediction.

<details><summary>can every model agree and still be wrong?</summary><p>Yes. An ensemble can share a missing variable, incorrect model class, or dataset bias. Agreement can measure similarity of the chosen models rather than correctness. Evaluate predictions and decisions against held-out or real observations.</p></details>

<header class="wm-chapter-heading" id="build-roadmap" data-chapter>
<span>08 / Build and investigate</span>
<h2>Experiments worth extending</h2>
</header>

The small systems in this article suggest several implementation projects. Each makes one failure visible: hidden velocity, accumulating rollout error, missing constraints, or agreement between incorrect models. The list below includes an output to inspect and a comparison to run.

A learner interested in robotics can spend more time on estimation and MPC. A learner interested in visual representation can branch toward JEPA or tokenized sequence models. Neither needs to treat all architecture families as one mandatory chronological queue.

<!-- hub:projects -->

### Design the research question before scaling the system

“Build a general world model” leaves too many variables changing together. A more tractable question is whether a specified uncertainty mechanism reduces a specified planning failure under a fixed data budget.

That comparison needs a fixed environment, action space, planning horizon, and data budget. Its outcome is the behavior in the environment. A lower predicted cost alone could mean the planner has become better at exploiting the model’s errors.

A useful report contains the hypothesis, implementation, dataset and evaluation splits, matched budgets, seeds, uncertainty in the estimates, and representative failures. Publish the smallest reproducible artifact that lets another reader inspect the mechanism.

### A reading sequence

1. **Where does simulated experience enter learning?** Dyna, then a small tabular implementation.
2. **How should uncertain dynamics enter a decision?** PILCO, PETS, and MBPO.
3. **What is a useful latent predictive state?** World Models, PlaNet, and the Dreamer sequence.
4. **Which predictions are sufficient for search?** MuZero and TD-MPC2.
5. **What changes when dynamics become a token sequence?** IRIS.
6. **What does representation prediction preserve?** JEPA and V-JEPA variants.
7. **What does controllable generation actually demonstrate?** Genie and model-specific video-generation reports.
8. **What changes in physical systems?** DayDreamer, robot-imagination work, and Cosmos’s model-specific interfaces.
9. **What would count as actionability?** The two surveys, revisited with evidence from your own implementation.

These papers become easier to compare when the same questions stay in view: what the state contains, where actions enter, what gets predicted, and how that prediction affects behavior. Architecture names alone obscure those differences.

The missing-obstacle example is a small version of a broader problem. Better search cannot recover a constraint the model never represents. A useful next experiment would change what the model knows, hold the planning budget fixed, and measure whether the executed behavior improves.
