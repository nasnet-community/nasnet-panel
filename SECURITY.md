# Security Policy

## Supported versions

Nasnet Panel is pre-1.0; only the latest released `0.x.y` is supported with security fixes. Older tags will not receive backports.

| Version       | Supported          |
| ------------- | ------------------ |
| Latest `0.x`  | Yes                |
| Anything else | No                 |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Use GitHub's private vulnerability reporting on this repository:

1. Go to https://github.com/nasnet-community/nasnet-panel/security/advisories/new
2. Fill in the form. Include reproduction steps, the version you saw the issue on, and the RouterOS version of any router involved.

If for any reason you cannot use the security advisory form, open a minimal public issue saying only "I have a security report, please contact me" with a way to reach you, and a maintainer will follow up privately.

## What to include

- A clear description of the vulnerability and its impact.
- Steps to reproduce, ideally with a minimal proof of concept.
- The version (release tag, commit SHA, or container digest) you tested against.
- The RouterOS version of any device used in the reproduction, if relevant.
- Your name or handle if you would like credit in the fix's release notes.

## What to expect

- Acknowledgement within 7 days on a best-effort basis.
- A fix in the next patch release once severity and reproduction are confirmed.
- Coordinated disclosure preferred. We will agree on a public-disclosure date with you before publishing the advisory.

## Out of scope

- Vulnerabilities that require a malicious router already trusted by the user (an attacker that already has admin credentials on the RouterOS device can do anything; that is the threat model RouterOS itself defends against, not us).
- Issues in third-party dependencies that have not yet been disclosed upstream. Please report those to the dependency first.
- Social engineering, physical attacks, and denial-of-service through resource exhaustion that requires authenticated access.

Thank you for helping keep Nasnet Panel and its users safe.
