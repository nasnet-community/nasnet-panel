import styles from '../InternetPage.module.scss';

const DOT_DURATION = 2.4;
const DOT_DELAYS = [0, 0.8, 1.6];

interface EdgeProps {
  effectiveActive: boolean;
  d: string | undefined;
  pathId: string;
  fromId: string;
  toId: string;
}

export function Edge({ effectiveActive, d, pathId, fromId, toId }: EdgeProps) {
  if (!d) return null;
  return (
    <>
      <path
        id={pathId}
        d={d}
        data-from={fromId}
        data-to={toId}
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
        <circle key={`${prefix}-${d}`} r="2.5" opacity="0" className={styles.dotGreen}>
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
