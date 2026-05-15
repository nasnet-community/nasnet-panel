import styles from '../InternetPage.module.scss';
import { nodeIcon, nodeSubLabel } from './icons';
import { NODE_BOX_H, NODE_BOX_W, type Positioned } from './layout';

interface NodeBubbleProps {
  node: Positioned;
  onSelect: ((node: Positioned) => void) | undefined;
}

export function NodeBubble({ node, onSelect }: NodeBubbleProps) {
  const iconClass = node.isActive
    ? `${styles.nodeIcon} ${styles.nodeIconActive}`
    : node.kind === 'wan' || node.kind === 'vpn'
      ? `${styles.nodeIcon} ${styles.nodeIconDetached}`
      : styles.nodeIcon;
  const sub = nodeSubLabel(node);
  const inner = (
    <>
      <div className={iconClass}>{nodeIcon(node)}</div>
      <div className={styles.nodeLabel}>{node.label}</div>
      {sub ? <div className={styles.nodeSubLabel}>{sub}</div> : null}
    </>
  );
  return (
    <foreignObject
      x={node.x - NODE_BOX_W / 2}
      y={node.y - NODE_BOX_H / 2}
      width={NODE_BOX_W}
      height={NODE_BOX_H}
    >
      {onSelect ? (
        <button
          type="button"
          className={`${styles.nodeBubble} ${styles.nodeBubbleClickable}`}
          onClick={() => onSelect(node)}
          aria-label={`Configure ${node.label}`}
        >
          {inner}
        </button>
      ) : (
        <div className={styles.nodeBubble}>{inner}</div>
      )}
    </foreignObject>
  );
}
