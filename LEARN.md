# 🎓 Learn: Building a Hybrid Scalable Blockchain

Welcome! This guide explains how I built the **Dynamic Interconnection Blockchain**, a hybrid system that solves the "scalability trilemma" using a combination of a secure **Main Chain** and high-speed **Ephemeral Channels**.

## 🚀 The Core Idea

Traditional blockchains (like Bitcoin or Ethereum) are slow because every single transaction must be verified by the entire network and stored forever. This leads to high fees and congestion.

My project uses **State Channels**. Think of it like a bar tab:
1. You open a tab (Main Chain transaction).
2. You order many drinks (Off-chain, instant, free).
3. You pay the total and close the tab (One final Main Chain transaction).

## 🛠️ How it's Built

### 1. The Main Chain (`core/Blockchain.js`)
This is a standard Proof-of-Work blockchain.
- **SHA-256 Hashing**: Each block has a hash of its data + the previous block's hash.
- **Difficulty**: I implemented a simple difficulty system (leading zeros) to control block time.
- **Merkle Trees**: I use Merkle roots to efficiently verify that transactions within a block haven't been tampered with.

### 2. Ephemeral Channels (`ephemeral/Channel.js`)
This is the "secret sauce."
- **Bilateral State**: Two parties sign an initial state.
- **Sequence Numbers**: Every transaction incrementing the sequence number replaces the old one.
- **Settlement**: Only the *latest* signed state is submitted to the blockchain when the channel closes.

### 3. P2P Network (`network/Node.js`)
I used **WebSockets** to create a gossip protocol.
- When a node receives a new block or transaction, it "broadcasts" it to all its known peers.
- This ensures the entire network eventually reaches the same state.

## 📈 Learning Outcomes

By building this, I learned:
- How **cryptographic hashing** ensures data integrity.
- The tradeoff between **block time** and **network security**.
- Why **Layer 2 solutions** are essential for the future of Web3.
- How to manage **asynchronous state** across multiple distributed nodes.

## 🏁 Try it yourself

Check the [README.md](./README.md) for installation instructions and launch the real-time dashboard to see the TPS (Transactions Per Second) jump when you switch from Main Chain to Ephemeral Channels!
