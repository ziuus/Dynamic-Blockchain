# Contributing to Dynamic Interconnection Blockchain

Thank you for your interest in contributing! This document outlines the process and conventions.

## Development Setup

```bash
git clone https://github.com/ziuus/Dynamic-Blockchain.git
cd Dynamic-Blockchain
pnpm install
```

## Branch Conventions

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation changes |
| `chore/*` | Tooling, CI, dependency updates |

## Commit Convention (Conventional Commits)

```
feat: add multi-hop channel routing
fix: resolve transaction validation edge case
docs: update API reference for /api/channels
chore: upgrade ws to v9
refactor: extract gossip protocol into its own class
test: add benchmark for 1000-node simulation
```

## Pull Request Process

1. Fork and create your branch from `main`
2. Make changes and ensure all modules still load (`node -e "require('./core/Blockchain.js')"`)
3. Run the benchmark to confirm no regressions: `pnpm benchmark`
4. Write a clear PR description explaining **why** the change is needed
5. Reference any related issues

## Code Style

- CommonJS modules (`require`/`module.exports`)
- Classes for all core concepts
- JSDoc comments on public methods
- Error messages should be descriptive and actionable

## Roadmap Items Open for Contribution

- [ ] Proof-of-Stake consensus layer
- [ ] LevelDB persistent storage adapter
- [ ] Dashboard UI (real-time network visualizer)
- [ ] Multi-hop payment routing
- [ ] Docker Compose devnet
- [ ] RSA keypair wallet integration
- [ ] Unit test suite (Jest)
