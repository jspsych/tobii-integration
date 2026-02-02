# GitHub Actions Workflows

This directory contains automated workflows for the jsPsych-Tobii project.

## Workflows

### Python CI (`python-ci.yml`)

Runs on every push and pull request that affects Python code.

**What it does:**
- Tests across Python 3.9, 3.10, 3.11, and 3.12
- Runs linters (black, ruff, mypy)
- Runs pytest with coverage
- Builds and validates the package
- Uploads coverage reports to Codecov

### Release Python Package (`release-python.yml`)

Manual workflow for releasing the Python package to PyPI.

**How to use:**
1. Go to Actions → Release Python Package
2. Click "Run workflow"
3. Enter version (e.g., `0.1.1`, `1.0.0`)
4. Optionally mark as pre-release
5. Click "Run workflow"

**What it does:**
- Updates version in `pyproject.toml`
- Builds the Python package
- Validates with `twine check`
- Commits version bump
- Creates git tag (`python-v{version}`)
- Creates GitHub release
- Publishes to PyPI using trusted publishing

**Requirements:**
- Configure PyPI trusted publishing in repository settings
- Or add `PYPI_API_TOKEN` secret for token-based auth

## Design Philosophy

These workflows follow similar patterns to the JavaScript release process:

- **JavaScript packages**: Use Changesets for automated versioning and releases to npm
- **Python package**: Use workflow_dispatch for manual, controlled releases to PyPI

This separation allows:
- Independent versioning of JavaScript and Python packages
- Different release cadences for different ecosystems
- Ecosystem-specific best practices
- Clear separation of concerns

## Future Enhancements

Potential improvements:
- Automated Python releases triggered by tags or file changes
- Integration with changelog automation
- Automated version bumping based on conventional commits
- Pre-release/beta channel support
- Test PyPI publishing for validation
