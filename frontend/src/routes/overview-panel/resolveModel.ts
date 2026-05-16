import { MODELS } from './models';
import type { RouterModelDescriptor } from './types';

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const DEFAULT_MODEL: RouterModelDescriptor =
  MODELS.find((m) => m.key === 'hap-ax3') ?? MODELS[0];

export function resolveModelStrict(model: string | undefined | null): RouterModelDescriptor {
  const norm = normalize(model ?? '');
  if (!norm) return DEFAULT_MODEL;
  const match = MODELS.find((m) => m.aliases.some((alias) => norm.includes(normalize(alias))));
  return match ?? DEFAULT_MODEL;
}
