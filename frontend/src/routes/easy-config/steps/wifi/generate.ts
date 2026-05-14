const SSID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PASS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function randomString(alphabet: string, length: number): string {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
}

export function generateSsid(): string {
  return randomString(SSID_ALPHABET, 8);
}

export function generatePassword(): string {
  return randomString(PASS_ALPHABET, 14);
}
