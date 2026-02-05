# Contributing to jsPsych-Tobii

Thank you for your interest in contributing to jsPsych-Tobii! This guide will help you get set up for development.

## Prerequisites

- Node.js >= 18 and npm >= 9
- Python >= 3.9
- Git

## Development Setup

### 1. Clone and install

```bash
git clone https://github.com/jspsych/jspsych-tobii.git
cd jspsych-tobii
npm install
```

This installs dependencies for all packages via npm workspaces.

### 2. Python environment

```bash
cd python
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows
pip install -e ".[dev]"
```

### 3. Build all packages

```bash
npm run build
```

## Running Tests

### JavaScript tests

```bash
npm test                                         # All packages
cd packages/extension-tobii && npm test          # Single package
cd packages/extension-tobii && npm run test:watch # Watch mode
```

### Python tests

```bash
cd python
source .venv/bin/activate
pytest
```

## Linting and Formatting

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
```

Python:

```bash
cd python
black jspsych_tobii
ruff check jspsych_tobii
```

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Each commit message should follow this format:

```
<type>: <description>
```

Common types:

- `feat:` — A new feature
- `fix:` — A bug fix
- `docs:` — Documentation changes
- `test:` — Adding or updating tests
- `refactor:` — Code changes that neither fix a bug nor add a feature
- `style:` — Formatting, whitespace, etc.
- `chore:` — Build process, tooling, or dependency changes

## Pull Request Process

1. Create a feature branch from `main`.
2. Make your changes, ensuring tests pass (`npm test` and `pytest`).
3. Run `npm run lint` and `npm run format:check` to verify code style.
4. Push your branch and open a pull request against `main`.
5. Provide a clear description of the changes and link any related issues.

## Release Process

### JavaScript/TypeScript Packages (npm)

This project uses [Changesets](https://github.com/changesets/changesets) for managing package versions and releases.

When you make changes that should trigger a release, create a changeset:

```bash
npm run changeset
```

Follow the prompts to select which packages changed, choose the semver bump type, and write a summary. Commit the generated changeset file with your changes.

When changesets are merged to `main`, the GitHub Actions workflow will create a "Version Packages" PR that aggregates all changesets and updates versions and CHANGELOGs. Merging that PR publishes the updated packages to npm.

## Project Structure

- `packages/extension-tobii` — Core jsPsych extension
- `packages/plugin-tobii-calibration` — Calibration plugin
- `packages/plugin-tobii-validation` — Validation plugin
- `packages/plugin-tobii-user-position` — User position guide plugin
- `python/` — Python WebSocket server
