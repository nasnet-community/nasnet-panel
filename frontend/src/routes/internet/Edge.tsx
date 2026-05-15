import styles from '../InternetPage.module.scss';
import { NODE_RADIUS, type Positioned } from './layout';

const DOT_DURATION = 2.4;
const DOT_DELAYS = [0, 0.8, 1.6];

interface EdgeProps {
  effectiveActive: boolean;
  from: Positioned | undefined;
  to: Positioned | undefined;
  pathId: string;
}

export function Edge({ effectiveActive, from, to, pathId }: EdgeProps) {
  if (!from || !to) return null;
  const startX = from.x + NODE_RADIUS;
  const endX = to.x - NODE_RADIUS - 6;
  const startY = from.y;
  const endY = to.y;
  const midX = (startX + endX) / 2;
  const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  return (
    <>
      <path
        id={pathId}
        d={d}
        className={effectiveActive ? `${styles.edge} ${styles.edgeActive}` : styles.edge}
        markerEnd={`url(#${effectiveActive ? 'arr-active' : 'arr-idle'})`}
      />
      {effectiveActive ? <FlowDots pathId={pathId} prefix={pathId} /> : null}
    </>
  );
}

function FlowDots({ pathId, prefix }: { pathId: string; prefix: string }) {
  return (
    <>
      {DOT_DELAYS.map((d) => (
        <circle key={`${prefix}-${d}`} r="6" opacity="0" className={styles.dotGreen}>
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.9;1"
            dur={`${DOT_DURATION}s`}
            begin={`${d}s`}
            repeatCount="indefinite"
          />
          <animateMotion dur={`${DOT_DURATION}s`} repeatCount="indefinite" begin={`${d}s`}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}
