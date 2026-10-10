export type Cell = readonly [number, number];

// Handwritten toy dynamics, used only to explain planning. No learned model.
export const routes: Record<string, { label: string; cells: readonly Cell[] }> = {
  shortcut: {
    label: 'Across the hazard',
    cells: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [5, 2], [5, 1], [5, 0]],
  },
  safe: {
    label: 'Around the top',
    cells: [[0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  },
  hesitant: {
    label: 'Backtrack, then go around',
    cells: [[0, 3], [0, 2], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
  },
};

export function discountedReturn(rewards: readonly number[], discount = 0.95): number {
  return rewards.reduce((total, reward, index) => total + reward * discount ** index, 0);
}

export function routeRewards(cells: readonly Cell[]): number[] {
  return cells.slice(1).map(([x, y]) => {
    if (x === 5 && y === 0) return 10;
    if (x === 3 && y === 3) return -8;
    return -1;
  });
}

export function simulatePrediction(steps: number, bias: number) {
  const points = [{ step: 0, actual: 0, predicted: 0 }];
  for (let step = 1; step <= steps; step++) {
    const previous = points[points.length - 1];
    points.push({ step, actual: previous.actual + 1, predicted: (1 + bias) * previous.predicted + 1 });
  }
  return points;
}
