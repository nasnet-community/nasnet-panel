import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FileDrop.module.scss';

export interface FileDropProps {
  accept?: string;
  label?: string;
  hint?: string;
  onFile: (file: File, text: string) => void;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const FileDrop: React.FC<FileDropProps> = ({
  accept = '.rsc,text/plain',
  label,
  hint,
  onFile,
}) => {
  const { t } = useTranslation('ui');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const consume = async (file: File) => {
    const text = await file.text();
    onFile(file, text);
  };

  return (
    <label
      className={cx(styles.zone, dragging && styles.zoneActive)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void consume(file);
      }}
    >
      <span className={styles.title}>{label ?? t('fileDrop.label')}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      <input
        ref={inputRef}
        type="file"
        className={styles.hidden}
        accept={accept}
        aria-label={t('fileDrop.uploadAriaLabel')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void consume(file);
        }}
      />
    </label>
  );
};
