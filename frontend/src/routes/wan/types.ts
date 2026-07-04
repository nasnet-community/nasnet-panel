export type WanCategory = 'foreign' | 'domestic';

export const matchesWanCategory = (comment: string | undefined, category: WanCategory): boolean =>
  (comment ?? '').toLowerCase().includes(category);
