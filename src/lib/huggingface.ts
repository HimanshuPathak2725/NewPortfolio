export interface HFModel {
  id: string;
  downloads: number;
  likes: number;
  pipeline_tag?: string;
  tags: string[];
  createdAt: string;
}

const HF_API =
  'https://huggingface.co/api/models?author=HimanshuPathak&limit=50';

// Module-level cache: the fetch runs once per server process (dev) or once
// per build, instead of on every page request.
let cached: Promise<HFModel[]> | null = null;

export function getHFModels(): Promise<HFModel[]> {
  cached ??= fetch(HF_API, { signal: AbortSignal.timeout(6000) })
    .then(async (res) => {
      if (!res.ok) return [];
      const models = (await res.json()) as HFModel[];
      return models.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
    .catch(() => []);
  return cached;
}
