export const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');
