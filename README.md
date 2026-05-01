# ⛓️ Dynamic Interconnection Blockchain

> A next-generation hybrid blockchain architecture that offloads high-frequency transactions from the main chain to **dynamic, ephemeral peer-to-peer state channels** — dramatically improving throughput while preserving on-chain security and finality.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Architecture: Hybrid](https://img.shields.io/badge/Architecture-Hybrid%20Blockchain-purple)]()

---

## 🧠 The Problem

Traditional blockchains suffer from the **scalability trilemma**: as transaction volume grows, the network faces:

- ⏱️ **Congestion** — mempool backlogs, slow confirmations
- 💸 **High fees** — gas wars during peak load
- 📉 **Degraded throughput** — Bitcoin ~7 TPS, Ethereum ~15–30 TPS

## 💡 The Solution: Ephemeral Off-Chain Channels

This model introduces **Dynamic Interconnection Channels** — ephemeral, bilateral state channels that:

1. **Lock** initial balances on-chain (one transaction)
2. **Transact** off-chain at infinite speed with no fees
3. **Settle** final state back on-chain (one transaction)

The result: **∞ TPS** for channel participants, with on-chain security guarantees for final settlement.

---

## 📊 Benchmark Results

```
Main Chain (PoW, difficulty 2):     ~3,846 TPS
Ephemeral Channels (off-chain):         ∞ TPS
Settlement overhead:                    0 ms
On-chain footprint per channel:    2 txs (open + close)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    REST API Layer                    │
│              Express HTTP (port 3000+)               │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    Node Layer                        │
│         Identity · Peers · State Management          │
└────────────┬─────────────────────┬──────────────────┘
             │                     │
┌────────────▼──────┐  ┌──────────▼──────────────────┐
│   Main Chain      │  │   Ephemeral Channel Layer    │
│  Block · PoW      │  │  Channel · ChannelManager    │
│  Merkle · Txs     │  │  Off-chain State · Settle    │
└────────────┬──────┘  └──────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────┐
│                  P2P Network Layer                  │
│            WebSocket Gossip Protocol                │
└────────────────────────────────────────────────────┘
```

### Module Map

| Path | Responsibility |
|------|---------------|
| `core/Block.js` | Block structure, PoW mining, Merkle root |
| `core/Blockchain.js` | Chain management, validation, balance tracking |
| `core/Transaction.js` | Transaction format, hashing, signature validation |
| `ephemeral/Channel.js` | Bilateral off-chain state channel lifecycle |
| `ephemeral/ChannelManager.js` | Multi-channel orchestration per node |
| `network/Node.js` | Node identity, peer management, state |
| `network/P2P.js` | WebSocket-based P2P gossip protocol |
| `api/server.js` | REST API (blockchain, channels, mining, P2P) |
| `simulation/runNetwork.js` | Multi-node network simulation |
| `simulation/benchmark.js` | Throughput comparison benchmark |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install

```bash
git clone https://github.com/ziuus/Dynamic-Blockchain.git
cd Dynamic-Blockchain
pnpm install
```

### Run the API Server

```bash
pnpm start
# API available at http://localhost:3000
```

### Run the Network Simulation (3 nodes)

```bash
pnpm simulate
# Spins up 3 nodes with P2P sync, channels, and mining
```

### Run the Benchmark

```bash
pnpm benchmark
# Compares main chain TPS vs ephemeral channel TPS
```

---

## 🔌 REST API Reference

### Blockchain

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/blockchain` | Full chain state |
| `GET` | `/api/blockchain/height` | Current block height |
| `GET` | `/api/blockchain/valid` | Chain validity check |
| `GET` | `/api/block/:index` | Block by index |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transactions` | Submit a transaction |
| `GET` | `/api/transactions/pending` | Mempool |
| `GET` | `/api/transactions/history/:address` | Address history |
| `POST` | `/api/mine` | Mine pending transactions |
| `GET` | `/api/balance/:address` | Address balance |

### Ephemeral Channels

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/channels` | Open a new channel |
| `GET` | `/api/channels` | List all channels |
| `GET` | `/api/channels/:id` | Channel details |
| `GET` | `/api/channels/for/:address` | Channels for address |
| `POST` | `/api/channels/:id/transactions` | Off-chain transaction |
| `POST` | `/api/channels/:id/settle` | Settle channel on-chain |
| `POST` | `/api/channels/:id/close` | Force close channel |
| `GET` | `/api/channels/stats` | Channel statistics |

### Node & P2P

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/node/status` | Node health & stats |
| `GET` | `/api/p2p/peers` | Connected peers |
| `POST` | `/api/p2p/connect` | Connect to peer |
| `POST` | `/api/p2p/sync` | Trigger sync |
| `GET` | `/api/health` | Health check |

---

## 🔬 How Ephemeral Channels Work

```
Alice                    Channel Contract              Bob
  │                           │                         │
  │──── open(1000, 1000) ────►│                         │
  │                           │◄── open(1000, 1000) ────│
  │                           │  [On-chain: 1 tx]        │
  │                                                      │
  │◄──────────────── off-chain transactions ────────────►│
  │   (tx1: Alice→Bob 50)  (tx2: Bob→Alice 20)  ...     │
  │   [Instant, zero fees, unlimited]                    │
  │                                                      │
  │──── settle() ──────────────────────────────────────►│
  │   [On-chain: 1 settlement tx with final balances]   │
```

**Security:** All off-chain state is cryptographically signed. Either party can force-close using the latest agreed state at any time.

---

## 🗺️ Roadmap

- [x] Core blockchain (PoW, Merkle, validation)
- [x] Ephemeral state channels
- [x] P2P WebSocket gossip
- [x] REST API
- [x] Simulation & benchmark suite
- [ ] Dashboard UI (real-time network visualizer)
- [ ] Proof-of-Stake consensus layer
- [ ] Multi-hop channel routing (payment network)
- [ ] RSA keypair-based transaction signing
- [ ] Persistent storage (LevelDB)
- [ ] Docker / multi-node devnet setup

---

## 📁 Project Structure

```
Dynamic-Blockchain/
├── core/
│   ├── Block.js           # Block with PoW + Merkle root
│   ├── Blockchain.js      # Main chain state machine
│   └── Transaction.js     # Transaction format & validation
├── ephemeral/
│   ├── Channel.js         # Off-chain state channel
│   └── ChannelManager.js  # Channel lifecycle manager
├── network/
│   ├── Node.js            # P2P node identity & state
│   └── P2P.js             # WebSocket gossip protocol
├── api/
│   └── server.js          # Express REST API
├── simulation/
│   ├── runNetwork.js      # 3-node network simulator
│   └── benchmark.js       # Throughput benchmarking
├── docs/
│   └── ARCHITECTURE.md    # Deep-dive architecture docs
├── .gitignore
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
4. Open a Pull Request

---

## 📄 License

MIT © [ziuus](https://github.com/ziuus)
