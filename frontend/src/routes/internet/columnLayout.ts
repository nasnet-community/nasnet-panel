import type { RoutingNode, RoutingNodeKind, RoutingTopology } from '@nasnet/mocks';
import { COLUMN_ORDER, NODE_BOX_H, NODE_BOX_W } from './layout';

const COL_GAP = 48;
const ROW_H = 200;
const MARGIN = 16;
const ANCHOR_X = 50;
const ANCHOR_TOP = 50;
const ANCHOR_BOTTOM = NODE_BOX_H / 2 + 6;

export interface ColumnLayoutResult {
  positions: Map<string, { x: number; y: number }>;
  edges: Map<string, string>;
  columnX: Map<RoutingNodeKind, number>;
  width: number;
  height: number;
}

export function computeColumnLayout(topology: RoutingTopology): ColumnLayoutResult {
  const byKind = new Map<RoutingNodeKind, RoutingNode[]>();
  topology.nodes.forEach((n) => {
    const group = byKind.get(n.kind) ?? [];
    group.push(n);
    byKind.set(n.kind, group);
  });
  const kinds = COLUMN_ORDER.filter((k) => byKind.has(k));
  if (kinds.length === 0) {
    return { positions: new Map(), edges: new Map(), columnX: new Map(), width: 0, height: 0 };
  }

  const columnX = new Map<RoutingNodeKind, number>(
    kinds.map((k, i) => [k, MARGIN + NODE_BOX_W / 2 + i * (NODE_BOX_W + COL_GAP)]),
  );
  const maxRows = Math.max(...kinds.map((k) => (byKind.get(k) ?? []).length));
  const centerY = MARGIN + NODE_BOX_H / 2 + ((maxRows - 1) * ROW_H) / 2;

  const positions = new Map<string, { x: number; y: number }>();
  kinds.forEach((k) => {
    const nodes = byKind.get(k) ?? [];
    nodes.forEach((n, i) => {
      positions.set(n.id, {
        x: columnX.get(k) ?? 0,
        y: centerY + (i - (nodes.length - 1) / 2) * ROW_H,
      });
    });
  });

  const width = MARGIN * 2 + kinds.length * NODE_BOX_W + (kinds.length - 1) * COL_GAP;
  let height = MARGIN * 2 + NODE_BOX_H + (maxRows - 1) * ROW_H;

  const kindById = new Map(topology.nodes.map((n) => [n.id, n.kind]));
  const blocked = (y: number, x1: number, x2: number, skip: string[]) =>
    topology.nodes.some((n) => {
      if (skip.includes(n.id)) return false;
      const p = positions.get(n.id);
      if (!p) return false;
      return (
        Math.abs(p.y - y) < NODE_BOX_H / 2 &&
        p.x - NODE_BOX_W / 2 < Math.max(x1, x2) &&
        p.x + NODE_BOX_W / 2 > Math.min(x1, x2)
      );
    });

  const isElbow = (h: { fromId: string; toId: string }) => {
    const src = positions.get(h.fromId);
    const dst = positions.get(h.toId);
    if (!src || !dst) return false;
    if (Math.abs(src.y - dst.y) < 1) return false;
    const fromKind = kindById.get(h.fromId);
    const toKind = kindById.get(h.toId);
    if (fromKind === 'router' && toKind === 'wan') return false;
    if (fromKind === 'wan' && toKind === 'internet') return false;
    return true;
  };
  const laneKey = (h: { fromId: string; toId: string }) =>
    `${kindById.get(h.fromId)}>${kindById.get(h.toId)}`;
  const groupKey = (h: { fromId: string; toId: string; isActive: boolean }) =>
    `${laneKey(h)}:${h.isActive ? 'a' : 'i'}`;
  const groupsByPair = new Map<string, string[]>();
  topology.hops.forEach((h) => {
    if (!isElbow(h)) return;
    const pair = laneKey(h);
    const group = groupKey(h);
    const groups = groupsByPair.get(pair) ?? [];
    if (!groups.includes(group)) groups.push(group);
    groupsByPair.set(pair, groups);
  });

  const edges = new Map<string, string>();
  topology.hops.forEach((h) => {
    const src = positions.get(h.fromId);
    const dst = positions.get(h.toId);
    if (!src || !dst) return;
    const fromKind = kindById.get(h.fromId);
    const toKind = kindById.get(h.toId);
    const sameRow = Math.abs(src.y - dst.y) < 1;
    if (fromKind === 'wan' && toKind === 'internet') {
      const skip = [h.fromId, h.toId];
      const clear = !blocked(src.y, src.x + ANCHOR_X, dst.x, skip);
      if (sameRow && clear) {
        edges.set(h.id, `M ${src.x + ANCHOR_X} ${src.y} L ${dst.x - ANCHOR_X} ${dst.y}`);
        return;
      }
      const dir = dst.y > src.y ? 1 : -1;
      const entryY = sameRow || dir === -1 ? dst.y + ANCHOR_BOTTOM : dst.y - ANCHOR_TOP;
      if (clear) {
        edges.set(h.id, `M ${src.x + ANCHOR_X} ${src.y} L ${dst.x} ${src.y} L ${dst.x} ${entryY}`);
        return;
      }
      const bx = src.x + NODE_BOX_W / 2 + 8;
      const laneY = Math.max(sameRow ? src.y + ROW_H / 2 : src.y - dir * (ROW_H / 2), 8);
      height = Math.max(height, laneY + MARGIN);
      edges.set(
        h.id,
        `M ${src.x + ANCHOR_X} ${src.y} L ${bx} ${src.y} L ${bx} ${laneY} L ${dst.x} ${laneY} L ${dst.x} ${entryY}`,
      );
    } else if (sameRow) {
      edges.set(h.id, `M ${src.x + ANCHOR_X} ${src.y} L ${dst.x - ANCHOR_X} ${dst.y}`);
    } else if (fromKind === 'router' && toKind === 'wan') {
      const sy = dst.y > src.y ? src.y + ANCHOR_BOTTOM : src.y - ANCHOR_TOP;
      edges.set(h.id, `M ${src.x} ${sy} L ${src.x} ${dst.y} L ${dst.x - ANCHOR_X} ${dst.y}`);
    } else {
      const pair = laneKey(h);
      const groups = groupsByPair.get(pair) ?? [groupKey(h)];
      const groupIdx = groups.indexOf(groupKey(h));
      const mx = (src.x + dst.x) / 2 + (groupIdx - (groups.length - 1) / 2) * 12;
      const dir = dst.y > src.y ? 1 : -1;
      const sy = h.isActive ? src.y : src.y + dir * 12;
      const ey = h.isActive ? dst.y : dst.y - dir * 12;
      edges.set(
        h.id,
        `M ${src.x + ANCHOR_X} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${dst.x - ANCHOR_X} ${ey}`,
      );
    }
  });

  return { positions, edges, columnX, width, height };
}
