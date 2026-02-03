# Contributing to jsPsych-Tobii

Thank you for your interest in contributing! This document provides guidelines for contributing to the jsPsych-Tobii project.

## Development Setup

### Prerequisites

- Node.js 18.0 or higher
- Python 3.9 or higher
- Tobii Pro eye tracker (for testing)

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jspsych/jspsych-tobii.git
   cd jspsych-tobii
   ```

2. Install dependencies:
   ```bash
   npm install
   cd python && pip install -e ".[dev]" && cd ..
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

## Project Structure

This is a monorepo containing:

- **packages/extension-tobii**: Core extension
- **packages/plugin-tobii-calibration**: Calibration plugin
- **packages/plugin-tobii-validation**: Validation plugin
- **packages/plugin-tobii-user-position**: User position guide plugin
- **python**: Python WebSocket server

## Development Workflow

### JavaScript Development

1. Make changes to source files in `packages/*/src/`
2. Build packages:
   ```bash
   npm run build
   ```
3. Or use watch mode:
   ```bash
   npm run build:watch
   ```

### Python Development

1. Make changes to Python files in `python/jspsych_tobii/`
2. Test changes:
   ```bash
   cd python
   pytest
   ```

### Testing

Run all tests:
```bash
npm test
```

Run Python tests:
```bash
cd python
pytest
```

### Code Quality

Format code:
```bash
npm run format
```

Lint code:
```bash
npm run lint
```

## Contribution Guidelines

### Reporting Issues

- Check existing issues first
- Provide clear description
- Include:
  - OS and browser version
  - Tobii tracker model
  - Steps to reproduce
  - Expected vs actual behavior
  - Error messages/logs

### Pull Requests

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass:
   ```bash
   npm test
   ```
6. Format code:
   ```bash
   npm run format
   ```
7. Commit with clear message:
   ```bash
   git commit -m "feat: description"
   ```
8. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```
9. Open a pull request

### Commit Messages

Follow conventional commits format:

- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `test: Add tests`
- `refactor: Refactor code`
- `style: Format code`
- `chore: Update dependencies`

### Code Style

JavaScript/TypeScript:
- Use Prettier for formatting
- Follow ESLint rules
- Add JSDoc comments for public APIs
- Use TypeScript types

Python:
- Use Black for formatting
- Follow PEP 8
- Add type hints
- Add docstrings

## Release Process

Releases are handled by maintainers using [changesets](https://github.com/changesets/changesets):

1. Create a changeset describing your changes:
   ```bash
   npm run changeset
   ```
2. Maintainers version and release:
   ```bash
   npm run version
   npm run release
   ```

## Questions?

- Open a [discussion](https://github.com/jspsych/jspsych-tobii/discussions)
- Join our community chat
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
