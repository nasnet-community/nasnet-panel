import React from 'react';
import styles from './WanPage.module.scss';

interface Props {
  icon: React.ReactNode;
  text: string;
}

export function EmptyHint({ icon, text }: Props) {
  return (
    <div className={styles.empty}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
