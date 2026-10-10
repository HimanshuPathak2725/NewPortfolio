interface ResearchArtifact {
  title: string;
  href: string;
  kind: string;
  description: string;
  illustration?: 'consequence' | 'symbols' | 'knowing';
  note?: string;
  related?: { label: string; href: string }[];
}

// Curated from public cards and the execution-teaching repository, October 2026.
// Keep artifact types explicit: HF dataset repositories can also hold adapters
// or evaluation archives. Do not infer benchmark quality from repository names.
export const researchArtifacts: ResearchArtifact[] = [
  {
    title: 'GLM-4.7-Flash — Generalized C++ GRPO',
    illustration: 'consequence',
    href: 'https://huggingface.co/datasets/HimanshuPathak/grpo_iter19_sept_1',
    kind: 'LoRA adapters · Training data · GRPO',
    description: 'Portable checkpoints from a C++ post-training experiment, warm-started from the Phone Number GRPO adapter. The release includes the six-task training set, manifests, and reproduction evidence, with iteration 19 selected for release.',
    note: 'Access conditions apply. The training tasks overlap Fixed26; reported evaluations measure assisted regression.',
    related: [
      {
        label: 'Aider / Fixed26 evaluation archive',
        href: 'https://huggingface.co/datasets/HimanshuPathak/EVAL_GRPO20',
      },
    ],
  },
  {
    title: 'Phone Number — Kernel12 GRPO20',
    illustration: 'symbols',
    href: 'https://github.com/HimanshuPathak2725/let-execution-do-the-teaching#post-training-evaluations',
    kind: 'Training data · Adapter · WootzappLab',
    description: 'The Phone Number post-training experiment, with links to its training JSONL, scored adapter, launch configuration, and evaluation method in the execution-teaching repository.',
    // These exact revision-pinned links come from the public project README.
    // The HF files could not be independently fetched; make no access claims.
    related: [
      {
        label: 'Training data',
        href: 'https://huggingface.co/WootzappLab/phone-number-kernel12-GRPO20/blob/adf419fcb32baa335d80c3d9a96c618f3f286a14/Phone_Number_train.jsonl',
      },
      {
        label: 'Iteration 14 adapter',
        href: 'https://huggingface.co/WootzappLab/phone-number-kernel12-GRPO20/tree/adf419fcb32baa335d80c3d9a96c618f3f286a14/checkpoints/iter_0000014/adapter',
      },
    ],
  },
  {
    title: 'Stack v2 — C++ Task Candidates',
    illustration: 'knowing',
    href: 'https://huggingface.co/datasets/HimanshuPathak/stack-v2-cpp-task-candidates',
    kind: 'Dataset · Benchmark development',
    description: 'Independently authored C++ task candidates developed from functionality discovered through Stack v2 metadata and Software Heritage. The collection preserves provenance and validation evidence for reviewing each candidate.',
    note: 'Candidate stage; not approved for training or evaluation. Access conditions apply.',
  },
  {
    title: 'SimHim',
    href: 'https://huggingface.co/HimanshuPathak/SimHim',
    kind: 'Model repository',
    // Listed on the author's public profile; no architecture or capability
    // claims until its model card can be independently inspected.
    description: 'My SimHim model repository on Hugging Face.',
  },
];
