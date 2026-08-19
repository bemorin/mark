# Changelog

This changelog tracks public GitHub releases only. Pre-public development iterations are intentionally omitted.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic versioning where practical.

## [Unreleased]

## [1.0.1] - 2026-08-19

### Added

- Pin or unpin the current document with the pin button to the left of the file name (up to 3). Pinned files appear under File → Pinned.

### Changed

- Windows Open with now labels the app as Mark instead of the long package description.
- File → Recent and File → Pinned are native submenus. Click a file to open it.
- The status bar shows editor, split, and preview as three explicit view buttons.
- The app opens in split view the first time, then restores the last view the user chose.

## [1.0.0] - 2026-08-18

### Added

- First public release of Mark.
- Local-first Markdown editing with editor, split, and preview modes.
- Live sanitized GitHub-Flavored Markdown rendering.
- Find and replace with highlighted preview matches.
- On-demand table of contents with navigation and section reordering.
- Preview block editing while preserving Markdown as the source of truth.
- Clickable task checkboxes, recent files, drag-and-drop opening, and multi-window file handling.
- Recovery copies for unsaved changes.
- Automatic English / French interface selection and system light / dark appearance.
- Windows, macOS, and Linux packaging configuration.
