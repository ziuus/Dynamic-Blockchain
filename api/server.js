const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

class BlockchainServer {
    constructor(node, port = 3000) {
        this.node = node;
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Blockchain endpoints
        this.app.get('/api/blockchain', (req, res) => {
            res.json(this.node.blockchain.toJSON());
        });

        this.app.get('/api/blockchain/height', (req, res) => {
            res.json({ height: this.node.blockchain.chain.length });
        });

        this.app.get('/api/block/:index', (req, res) => {
            const index = parseInt(req.params.index);
            const block = this.node.blockchain.chain[index];
            if (block) {
                res.json(block.toJSON());
            } else {
                res.status(404).json({ error: 'Block not found' });
            }
        });

        this.app.get('/api/blockchain/valid', (req, res) => {
            const isValid = this.node.blockchain.isChainValid();
            res.json({ valid: isValid });
        });

        // Transaction endpoints
        this.app.post('/api/transactions', (req, res) => {
            try {
                const { sender, receiver, amount, data } = req.body;
                const tx = new this.node.blockchain.constructor().pendingTransactions[0].constructor(
                    sender, receiver, amount, data
                );
                tx.hash = tx.calculateHash();
                this.node.blockchain.addTransaction(tx);
                res.json(tx.toJSON());
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.get('/api/transactions/pending', (req, res) => {
            res.json(this.node.blockchain.pendingTransactions.map(tx => tx.toJSON()));
        });

        // Mining endpoint
        this.app.post('/api/mine', (req, res) => {
            const { miningRewardAddress } = req.body;
            if (!miningRewardAddress) {
                return res.status(400).json({ error: 'miningRewardAddress is required' });
            }
            const block = this.node.blockchain.minePendingTransactions(miningRewardAddress);
            if (block) {
                res.json(block.toJSON());
            } else {
                res.json({ message: 'No transactions to mine' });
            }
        });

        // Balance endpoint
        this.app.get('/api/balance/:address', (req, res) => {
            const address = req.params.address;
            const balance = this.node.blockchain.getBalance(address);
            res.json({ address, balance });
        });

        // Transaction history endpoint
        this.app.get('/api/transactions/history/:address', (req, res) => {
            const address = req.params.address;
            const history = this.node.blockchain.getTransactionHistory(address);
            res.json(history);
        });

        // Channel endpoints
        this.app.post('/api/channels', (req, res) => {
            try {
                const { participants, initialBalances } = req.body;
                if (!participants || !Array.isArray(participants)) {
                    return res.status(400).json({ error: 'participants array is required' });
                }
                const channel = this.node.channelManager.createChannel(
                    participants,
                    initialBalances || participants.map(() => 0)
                );
                res.json(channel.toJSON());
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.get('/api/channels', (req, res) => {
            const channels = this.node.channelManager.getAllChannels();
            res.json(channels.map(c => c.toJSON()));
        });

        this.app.get('/api/channels/:channelId', (req, res) => {
            const channel = this.node.channelManager.getChannel(req.params.channelId);
            if (channel) {
                res.json(channel.toJSON());
            } else {
                res.status(404).json({ error: 'Channel not found' });
            }
        });

        this.app.get('/api/channels/for/:address', (req, res) => {
            const channels = this.node.channelManager.getChannelsForParticipant(req.params.address);
            res.json(channels.map(c => c.toJSON()));
        });

        this.app.post('/api/channels/:channelId/transactions', (req, res) => {
            try {
                const { sender, receiver, amount, data } = req.body;
                const tx = this.node.channelManager.executeTransaction(
                    req.params.channelId,
                    sender,
                    receiver,
                    amount,
                    data
                );
                res.json(tx.toJSON());
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.post('/api/channels/:channelId/settle', (req, res) => {
            try {
                const tx = this.node.channelManager.settleChannel(req.params.channelId);
                res.json(tx.toJSON());
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.post('/api/channels/:channelId/close', (req, res) => {
            try {
                const tx = this.node.channelManager.closeChannel(req.params.channelId);
                res.json(tx.toJSON());
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Channel stats endpoint
        this.app.get('/api/channels/stats', (req, res) => {
            const stats = this.node.channelManager.getChannelStats();
            res.json(stats);
        });

        // Node status endpoint
        this.app.get('/api/node/status', (req, res) => {
            res.json(this.node.getStatus());
        });

        // P2P endpoints
        this.app.get('/api/p2p/peers', (req, res) => {
            res.json(this.node.getPeers());
        });

        this.app.post('/api/p2p/connect', (req, res) => {
            const { peerAddress } = req.body;
            if (!peerAddress) {
                return res.status(400).json({ error: 'peerAddress is required' });
            }
            this.node.addPeer(peerAddress);
            res.json({ message: `Peer ${peerAddress} added` });
        });

        this.app.post('/api/p2p/sync', (req, res) => {
            this.node.syncBlockchain();
            this.node.syncChannels();
            res.json({ message: 'Sync initiated' });
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: Date.now() });
        });

        // Root endpoint — serve the dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(require('path').resolve(__dirname, '../dashboard/index.html'));
        });
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`API server started on port ${this.port}`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('API server stopped');
        }
    }
}

module.exports = BlockchainServer;