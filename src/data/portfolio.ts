// Shared content for the homepage and collection pages.
export const socials = [
  { label: 'GitHub', href: 'https://github.com/HimanshuPathak2725' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/himanshu-pathak-/' },
  { label: 'Hugging Face', href: 'https://huggingface.co/HimanshuPathak' },
  { label: 'Email', href: 'mailto:himanshu2725pathak@gmail.com' },
];

// Featured repositories supplied by Himanshu; summaries follow their public documentation.
export const projects = [
  {
    title: 'Let Execution Do the Teaching',
    href: 'https://github.com/HimanshuPathak2725/let-execution-do-the-teaching',
    description: 'Execution-based post-training experiments for code models: supervised fine-tuning, GRPO reward pipelines, and reproducible C++ evaluations with test feedback.',
    meta: 'Model post-training · SFT · GRPO · C++ evaluation',
    featured: true,
    upstream: {
      label: 'wootzapp/let-execution-do-the-teaching',
      href: 'https://github.com/wootzapp/let-execution-do-the-teaching',
    },
  },
  {
    title: 'Supervisory Analytics for SOC Assessment',
    href: 'https://github.com/HimanshuPathak2725/Supervisory-Analytics-Tool-for-SOC-Assessment-NCIIPC-',
    // Repository contents were unavailable; keep this summary limited to the supplied project title.
    description: 'A supervisory analytics project focused on assessing Security Operations Centre (SOC) operations.',
    meta: 'Security operations · Supervisory analytics',
    featured: true,
  },
  {
    title: 'VaporWall',
    href: 'https://github.com/HimanshuPathak2725/VaporWall',
    description: 'A Rust network-security project combining eBPF/XDP packet filtering with asynchronous TCP stream analysis and local ONNX threat classification.',
    meta: 'Rust · eBPF / XDP · Tokio · ONNX',
    featured: true,
  },
  {
    title: 'Fraud Radar — Real-Time Fraud Detection',
    href: 'https://github.com/HimanshuPathak2725/Real_Time_Fraud_Detection_System',
    description: 'A transaction anomaly-detection pipeline using Isolation Forest, Kafka streaming, and a FastAPI service with live WebSocket updates. Includes synthetic data generation and Docker Compose orchestration.',
    meta: 'Python · Isolation Forest · Kafka · FastAPI',
    featured: true,
  },
  {
    title: 'Comment Toxicity Classifier',
    href: 'https://github.com/HimanshuPathak2725/Comment-Toxicity-Classifier',
    description: 'A neural network for classifying toxic comments, with experiments in Jupyter notebooks.',
  },
  {
    title: 'AI Guide',
    href: 'https://github.com/HimanshuPathak2725/AI-GUIDE-SAAS',
    description: 'An LLM-powered tutoring platform built with TypeScript.',
  },
  {
    title: 'Guide AI Dictionary',
    href: 'https://github.com/HimanshuPathak2725/GUIDE-AI-DICTIONARY',
    description: 'An AI-powered agent for working with data dictionaries.',
  },
];

// Suggested learning resources; replace or extend with your own reading notes.
export const readingList = [
  {
    title: 'Reinforcement Learning: An Introduction',
    href: 'http://incompleteideas.net/book/the-book-2nd.html',
    author: 'Richard S. Sutton & Andrew G. Barto',
    description: 'The foundations: rewards, value functions, policy gradients, and learning through interaction.',
  },
  {
    title: 'Spinning Up in Deep RL',
    href: 'https://spinningup.openai.com/en/latest/',
    author: 'OpenAI',
    description: 'A practical introduction to deep reinforcement learning, with algorithm explanations and implementations.',
  },
  {
    title: 'The RLHF Book',
    href: 'https://rlhfbook.com/',
    author: 'Nathan Lambert',
    description: 'A guide to reinforcement learning from human feedback and language model post-training.',
  },
];
