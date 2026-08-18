# Security Policy

Mark is a local-first desktop application. Markdown is treated as untrusted input: rendered HTML is sanitized before insertion into the preview, the renderer runs without Node.js integration, and privileged operations are exposed through a narrow preload bridge.

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.

Use GitHub's **Private vulnerability reporting** feature for this repository when available. Include:

- the affected version;
- operating system and architecture;
- clear reproduction steps;
- expected and actual behavior;
- impact assessment, if known.

Please avoid including real secrets or personal documents in the report. A minimal synthetic Markdown file is preferred.

## Scope

Security-sensitive areas include Markdown rendering and sanitization, local file handling, external link handling, IPC boundaries, recovery files, packaging, and code signing.
