const crypto = require('crypto');

class Node {
    constructor(address, port, blockchain, channelManager) {
        this.address = address;
        this.port = port;
        this.blockchain = blockchain;
        this.channelManager = channelManager;
        this.peers = new Set();
        this.isRunning = false;
        this.publicKey = null;
        this.privateKey = null;
        this.generateKeyPair();
    }

    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    start() {
        this.isRunning = true;
        console.log(`Node ${this.address}:${this.port} started`);
    }

    stop() {
        this.isRunning = false;
        console.log(`Node ${this.address}:${this.port} stopped`);
    }

    addPeer(peerAddress) {
        this.peers.add(peerAddress);
        console.log(`Added peer: ${peerAddress}`);
    }

    removePeer(peerAddress) {
        this.peers.delete(peerAddress);
        console.log(`Removed peer: ${peerAddress}`);
    }

    getPeers() {
        return Array.from(this.peers);
    }

    broadcast(message) {
        // In a real implementation, this would send to all connected peers
        console.log(`Broadcasting message to ${this.peers.size} peers:`, message);
        return Array.from(this.peers).map(peer => this.sendToPeer(peer, message));
    }

    sendToPeer(peerAddress, message) {
        // In a real implementation, this would send via WebSocket
        console.log(`Sending to ${peerAddress}:`, message);
        return Promise.resolve();
    }

    syncBlockchain() {
        // Request blockchain from peers and sync
        console.log('Syncing blockchain with peers...');
        return this.broadcast({ type: 'SYNC_REQUEST' });
    }

    syncChannels() {
        // Request channel state from peers
        console.log('Syncing channels with peers...');
        return this.broadcast({ type: 'CHANNEL_SYNC_REQUEST' });
    }

    getStatus() {
        return {
            address: this.address,
            port: this.port,
            isRunning: this.isRunning,
            peerCount: this.peers.size,
            blockchainHeight: this.blockchain.chain.length,
            pendingTransactions: this.blockchain.pendingTransactions.length,
            channelStats: this.channelManager.getChannelStats()
        };
    }

    toJSON() {
        return {
            address: this.address,
            port: this.port,
            publicKey: this.publicKey,
            peers: this.getPeers(),
            status: this.getStatus()
        };
    }
}

module.exports = Node;