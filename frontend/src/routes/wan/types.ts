export type WanCategory = 'foreign' | 'domestic';

const WAN_LINK_TAG: Record<WanCategory, string> = {
  foreign: 'wan - foreign link',
  domestic: 'wan - domestic link',
};

export const matchesWanCategory = (comment: string | undefined, category: WanCategory): boolean =>
  (comment ?? '').toLowerCase().includes(WAN_LINK_TAG[category]);
