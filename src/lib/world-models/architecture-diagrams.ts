/** Model/version scope and primary sources for the original explanatory figures. */
export type ArchitectureId='dreamer'|'planning'|'tokens'|'jepa'|'video'|'embodied';
interface Diagram {title:string;description:string;change:string;sources:{title:string;url:string}[];}
export const architectureDiagrams:Record<ArchitectureId,Diagram>={
  "dreamer": {
    "title": "PlaNet and Dreamer: shared latent dynamics, different ways to choose actions",
    "description": "A learned RSSM infers a latent state from observations and prior history. PlaNet searches imagined action sequences using predicted rewards. Dreamer trains an actor and critic from imagined trajectories and acts with the learned policy.",
    "change": "The main change is how imagined experience produces behavior: online search in PlaNet, actor-critic learning in Dreamer.",
    "sources": [
      {
        "title": "PlaNet paper · planning",
        "url": "https://arxiv.org/abs/1811.04551"
      },
      {
        "title": "Dreamer paper · behavior learning",
        "url": "https://arxiv.org/abs/1912.01603"
      },
      {
        "title": "DreamerV3 code · Agent.loss / policy",
        "url": "https://github.com/danijar/dreamerv3/blob/main/dreamerv3/agent.py"
      },
      {
        "title": "DreamerV3 RSSM · observe / imagine / loss",
        "url": "https://github.com/danijar/dreamerv3/blob/main/dreamerv3/rssm.py"
      }
    ]
  },
  "planning": {
    "title": "MuZero and TD-MPC2: predicting what a search procedure needs",
    "description": "MuZero combines representation h, action-conditioned dynamics g, and policy/value prediction f for Monte Carlo tree search. TD-MPC2 encodes observations and evaluates sampled latent rollouts using rewards and terminal Q values, then executes the first selected action.",
    "change": "The observation decoder drops out of the training objective. Reward and value predictions shape a state useful for search.",
    "sources": [
      {
        "title": "MuZero paper · Figure 1",
        "url": "https://arxiv.org/html/1911.08265v2"
      },
      {
        "title": "TD-MPC2 model code",
        "url": "https://github.com/nicklashansen/tdmpc2/blob/main/tdmpc2/common/world_model.py"
      },
      {
        "title": "TD-MPC2 planner · _estimate_value / _plan",
        "url": "https://github.com/nicklashansen/tdmpc2/blob/main/tdmpc2/tdmpc2.py"
      }
    ]
  },
  "tokens": {
    "title": "IRIS: a visual tokenizer, an autoregressive world model, and imagined actor-critic learning",
    "description": "Images are encoded into discrete visual tokens. A causal Transformer receives visual and action tokens and predicts next visual tokens, reward, and episode end. Predicted image tokens are decoded into frames used by an actor-critic inside the learned environment.",
    "change": "The temporal state becomes a sequence of discrete visual and action tokens. Imagined frames are decoded before the actor-critic sees them.",
    "sources": [
      {
        "title": "IRIS paper · model overview",
        "url": "https://arxiv.org/html/2209.00588v2"
      },
      {
        "title": "Prediction heads · world_model.py",
        "url": "https://github.com/eloialonso/iris/blob/main/src/models/world_model.py"
      },
      {
        "title": "Decode path · world_model_env.py",
        "url": "https://github.com/eloialonso/iris/blob/main/src/envs/world_model_env.py"
      },
      {
        "title": "IRIS actor–critic code",
        "url": "https://github.com/eloialonso/iris/blob/main/src/models/actor_critic.py"
      },
      {
        "title": "IRIS tokenizer objectives",
        "url": "https://github.com/eloialonso/iris/blob/main/src/models/tokenizer/tokenizer.py"
      }
    ]
  },
  "jepa": {
    "title": "V-JEPA 2: feature prediction during pretraining, action-conditioned prediction after adaptation",
    "description": "During pretraining, a context encoder and predictor estimate target features from masked video. An exponential-moving-average target encoder supplies the loss target without receiving gradients. V-JEPA 2-AC freezes the pretrained encoder and adds an action-conditioned predictor for planning toward goal features.",
    "change": "Prediction is compared in feature space. Robot actions enter in the separate V-JEPA 2-AC stage, not in action-free pretraining.",
    "sources": [
      {
        "title": "V-JEPA 2 paper · Sections 2–4",
        "url": "https://arxiv.org/html/2506.09985v1"
      },
      {
        "title": "Pretraining · EMA and target branch",
        "url": "https://github.com/facebookresearch/vjepa2/blob/main/app/vjepa/train.py"
      },
      {
        "title": "Action-conditioned training code",
        "url": "https://github.com/facebookresearch/vjepa2/blob/main/app/vjepa_droid/train.py"
      }
    ]
  },
  "video": {
    "title": "Original Genie: learn a latent action interface, then use it to generate frames",
    "description": "Training video feeds a video tokenizer and a latent action model. The action model infers a discrete code from earlier and next frames. At inference the user selects a code, which conditions a spatiotemporal dynamics model. Predicted frame tokens are decoded into an image.",
    "change": "The action labels can be learned from video. At inference, a user-selected code replaces the action inferred from the next frame.",
    "sources": [
      {
        "title": "Genie paper · components and inference",
        "url": "https://arxiv.org/html/2402.15391v1"
      }
    ]
  },
  "embodied": {
    "title": "Physical AI: a robot-learning loop versus a video-generation model",
    "description": "DayDreamer trains a latent world model from robot experience and an actor-critic from imagination; the actor interacts with the real robot. The separately shown Cosmos Predict2.5 base model conditions a video diffusion Transformer on text and visual context to generate video. A generated video is not itself an actuator policy.",
    "change": "Embodiment specifies sensors and actuators. It does not imply a single architecture: learning a robot policy and generating a video serve different roles.",
    "sources": [
      {
        "title": "DayDreamer paper",
        "url": "https://arxiv.org/abs/2206.14176"
      },
      {
        "title": "DayDreamer agent code",
        "url": "https://github.com/danijar/daydreamer/blob/main/embodied/agents/dreamerv2plus/agent.py"
      },
      {
        "title": "Cosmos-Predict2.5 report",
        "url": "https://arxiv.org/html/2511.00062v1"
      },
      {
        "title": "Cosmos base inference interfaces",
        "url": "https://github.com/nvidia-cosmos/cosmos-predict2.5/blob/main/docs/inference.md"
      },
      {
        "title": "Predict2.5 rectified-flow code",
        "url": "https://github.com/nvidia-cosmos/cosmos-predict2.5/blob/main/cosmos_predict2/_src/predict2/models/video2world_model_rectified_flow.py"
      }
    ]
  }
};
