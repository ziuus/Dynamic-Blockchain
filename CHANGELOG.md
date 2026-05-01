# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-05-01

### Added
- **Core layer**: `Block` with SHA-256 PoW, Merkle root, and chain linkage
- **Core layer**: `Blockchain` with mempool, mining, balance tracking, and chain validation
- **Core layer**: `Transaction` with hash integrity and RSA-SHA256 signature support
- **Ephemeral layer**: `Channel` — bilateral off-chain state channel with open/execute/settle lifecycle
- **Ephemeral layer**: `ChannelManager` — per-node channel registry and orchestration
- **Network layer**: `Node` — P2P node identity and peer state management
- **Network layer**: `P2P` — WebSocket gossip protocol for block and tx propagation
- **API layer**: Express REST API with 20+ endpoints (blockchain, channels, mining, P2P)
- **Simulation**: `runNetwork.js` — 3-node network simulator with transactions, mining, and channels
- **Simulation**: `benchmark.js` — throughput comparison (main chain vs ephemeral channels)
- **Docs**: README, ARCHITECTURE.md, CONTRIBUTING.md
- **Result**: Ephemeral channels achieve ∞ TPS vs ~3,846 TPS on-chain (difficulty 2)

---

## [Unreleased]

### Planned
- Dashboard UI (real-time network visualizer)
- Proof-of-Stake consensus layer
- Persistent storage (LevelDB)
- Multi-hop channel routing (payment network)
- RSA keypair wallet integration
- Unit test suite (Jest)
- Docker Compose devnet
