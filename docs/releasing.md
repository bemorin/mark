# Releasing Mark

Public versions start at `1.0.0`. Pre-public development versions are not part of the public changelog.

## Release checklist

1. Update `package.json` to the intended semantic version.
2. Move relevant entries from `Unreleased` into a dated section in `CHANGELOG.md`.
3. Run `npm ci` (or `npm install` before the first lockfile exists).
4. Run `npm run check` and test the application manually.
5. Build and test the platform artifacts you intend to publish.
6. Commit the release changes.
7. Tag the exact release commit: `git tag vX.Y.Z`.
8. Push the commit and tag.
9. Create the GitHub Release from that tag and attach the tested binaries.
10. Keep release notes short: what shipped, what materially changed, and any platform caveat users need to know.

Do not commit `release/`, code-signing credentials, certificates, notarization credentials, or generated installers to the repository.
