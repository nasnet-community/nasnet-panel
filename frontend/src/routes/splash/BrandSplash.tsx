import { motion, type Variants } from 'motion/react';
import styles from './BrandSplash.module.scss';

interface BrandSplashProps {
  phase: 'splash' | 'docked';
}

const wrapVariants: Variants = {
  splash: {
    justifyContent: 'center',
    minHeight: '78vh',
    flexDirection: 'column',
    textAlign: 'center',
    gap: 28,
  },
  docked: {
    justifyContent: 'flex-start',
    minHeight: 0,
    flexDirection: 'row',
    textAlign: 'left',
    gap: 16,
  },
};

const logoVariants: Variants = {
  splash: { width: 120, height: 120 },
  docked: { width: 44, height: 44 },
};

const titleVariants: Variants = {
  splash: { fontSize: 64, letterSpacing: '0.04em' },
  docked: { fontSize: 24, letterSpacing: '0.02em' },
};

const transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

export function BrandSplash({ phase }: BrandSplashProps) {
  return (
    <motion.div
      className={styles.wrap}
      layout
      initial={phase}
      animate={phase}
      variants={wrapVariants}
      transition={transition}
    >
      <motion.img
        className={styles.logoImg}
        src="/favicon.png"
        alt="Nasnet Panel"
        variants={logoVariants}
        transition={transition}
      />
      <motion.div className={styles.brandText} layout>
        <motion.h1 className={styles.title} variants={titleVariants} transition={transition}>
          Nasnet Panel
        </motion.h1>
      </motion.div>
    </motion.div>
  );
}
