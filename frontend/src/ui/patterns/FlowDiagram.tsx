import React from 'react';
import styles from './FlowDiagram.module.scss';

export interface FlowNode {
  id: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  sublabelIcon?: React.ReactNode;
  selected?: boolean;
  badge?: { icon: React.ReactNode; label: string };
}

export interface FlowDiagramProps {
  nodes: FlowNode[];
  ariaLabel?: string;
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ nodes, ariaLabel = 'Network flow' }) => (
  <div className={styles.wrap} role="img" aria-label={ariaLabel}>
    {nodes.map((node, i) => (
      <React.Fragment key={node.id}>
        <div className={styles.node}>
          <div
            className={[styles.nodeIcon, node.selected ? styles.nodeIconSelected : '']
              .filter(Boolean)
              .join(' ')}
          >
            {node.icon}
          </div>
          <div className={styles.nodeLabel}>{node.label}</div>
          {node.sublabel ? (
            <div className={styles.nodeSublabel}>
              (
              {node.sublabelIcon ? (
                <span className={styles.nodeSublabelIcon}>{node.sublabelIcon}</span>
              ) : null}
              {node.sublabel})
            </div>
          ) : null}
          {node.badge ? (
            <div className={styles.nodeBadge}>
              {node.badge.icon}
              <span>{node.badge.label}</span>
            </div>
          ) : null}
        </div>
        {i < nodes.length - 1 ? (
          <div className={styles.connector} aria-hidden="true">
            <div className={styles.track} />
            <div className={styles.arrow} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        ) : null}
      </React.Fragment>
    ))}
  </div>
);
