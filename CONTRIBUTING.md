# Contributing

Thanks for helping improve Mark.

## Principles

Changes should preserve the product's core constraints: a quiet interface, predictable Markdown source, local-first behavior, useful structure without workspace complexity, and a small dependency surface.

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm start
```

Before opening a pull request:

```bash
npm run check
```

Build artifacts are generated into `release/` and must not be committed.

## Pull requests

Keep changes focused. For meaningful behavior or UX changes, explain the user problem, the chosen behavior, relevant alternatives considered, and the tradeoff introduced. Include screenshots for visible changes when useful.

Do not commit credentials, `.env` files, personal document paths, generated installers, or user data.
