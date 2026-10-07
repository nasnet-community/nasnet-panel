export const GITHUB_ISSUES_URL = 'https://github.com/nasnet-community/nasnet-panel/issues/new';

export const TELEGRAM_SUPPORT_URL = 'https://t.me/joinNASNETGroup';

// Languages the joinnasnet.com guides are published in. Any other language gets English.
const GUIDE_LANGUAGES: readonly string[] = ['en', 'fa'];

export const userGuideUrl = (language: string) =>
  `https://www.joinnasnet.com/${GUIDE_LANGUAGES.includes(language) ? language : 'en'}/guides/nasnet-panel`;

export const USER_GUIDE_SECTIONS = new Map<string, string>([
  ['', 'overview'],
  ['internet', 'internet'],
  ['wan', 'wan'],
  ['lan', 'lan'],
  ['dns', 'lan/dns'],
  ['firewall', 'lan/firewall'],
  ['wireless', 'wifi'],
  ['vpn', 'vpn-server'],
  ['plugins', 'plugins'],
  ['diagnostics', 'diagnostics'],
  ['logs', 'logs'],
  ['help', 'help'],
]);
