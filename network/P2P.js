const WebSocket = require('ws');
const Node = require('./Node.js');

class P2P {
    constructor(node, peers = []) {
        this.node = node;
        this.server = null;
        this.clients = new Map(); // peerAddress -> WebSocket
        this.peers = new Set(peers);
        this.messageQueue = [];
    }

    start(port = this.node.port) {
        // Start WebSocket server
        this.server = new WebSocket.Server({ port });
        
        this.server.on('connection', (ws, req) => {
            const peerAddress = req.socket.remoteAddress || 'unknown';
            console.log(`New connection from ${peerAddress}`);
            
            this.clients.set(peerAddress, ws);
            this.peers.add(peerAddress);
            this.node.addPeer(peerAddress);

            ws.on('message', (message) => {
                this.handleMessage(peerAddress, message);
            });

            ws.on('close', () => {
                console.log(`Connection closed with ${peerAddress}`);
                this.clients.delete(peerAddress);
                this.peers.delete(peerAddress);
                this.node.removePeer(peerAddress);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error with ${peerAddress}:`, error);
            });
        });

        this.server.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });

        console.log(`P2P server started on port ${port}`);

        // Connect to known peers
        this.connectToPeers();
    }

    connectToPeers() {
        this.peers.forEach(peer => {
            if (peer !== this.node.address && !this.clients.has(peer)) {
                this.connectToPeer(peer);
            }
        });
    }

    connectToPeer(peerAddress) {
        try {
            // Extract host and port from peer address
            const [host, port] = peerAddress.split(':');
            const wsUrl = `ws://${host}:${port || 8080}`;
            
            console.log(`Connecting to peer: ${wsUrl}`);
            
            const ws = new WebSocket(wsUrl);
            
            ws.on('open', () => {
                console.log(`Connected to ${peerAddress}`);
                this.clients.set(peerAddress, ws);
                this.peers.add(peerAddress);
                this.node.addPeer(peerAddress);
                
                // Send handshake
                this.send(peerAddress, {
                    type: 'HANDSHAKE',
                    node: this.node.toJSON()
                });
            });

            ws.on('message', (message) => {
                this.handleMessage(peerAddress, message);
            });

            ws.on('close', () => {
                console.log(`Disconnected from ${peerAddress}`);
                this.clients.delete(peerAddress);
                this.peers.delete(peerAddress);
                this.node.removePeer(peerAddress);
            });

            ws.on('error', (error) => {
                console.error(`Connection error with ${peerAddress}:`, error);
            });
        } catch (error) {
            console.error(`Failed to connect to ${peerAddress}:`, error);
        }
    }

    send(peerAddress, message) {
        const ws = this.clients.get(peerAddress);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    broadcast(message) {
        const jsonMessage = JSON.stringify(message);
        this.clients.forEach((ws, peerAddress) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(jsonMessage);
            }
        });
    }

    handleMessage(peerAddress, message) {
        try {
            const data = JSON.parse(message);
            console.log(`Received from ${peerAddress}:`, data.type);

            switch (data.type) {
                case 'HANDSHAKE':
                    this.handleHandshake(peerAddress, data);
                    break;
                case 'SYNC_REQUEST':
                    this.handleSyncRequest(peerAddress);
                    break;
                case 'SYNC_RESPONSE':
                    this.handleSyncResponse(data);
                    break;
                case 'NEW_BLOCK':
                    this.handleNewBlock(data);
                    break;
                case 'NEW_TRANSACTION':
                    this.handleNewTransaction(data);
                    break;
                case 'CHANNEL_SYNC_REQUEST':
                    this.handleChannelSyncRequest(peerAddress);
                    break;
                case 'CHANNEL_SYNC_RESPONSE':
                    this.handleChannelSyncResponse(data);
                    break;
                case 'CHANNEL_TRANSACTION':
                    this.handleChannelTransaction(data);
                    break;
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    handleHandshake(peerAddress, data) {
        console.log(`Handshake with ${peerAddress}`);
        // Add peer to node
        this.node.addPeer(peerAddress);
        
        // Respond with our info
        this.send(peerAddress, {
            type: 'HANDSHAKE_RESPONSE',
            node: this.node.toJSON()
        });
    }

    handleSyncRequest(peerAddress) {
        console.log(`Sync request from ${peerAddress}`);
        this.send(peerAddress, {
            type: 'SYNC_RESPONSE',
            blockchain: this.node.blockchain.toJSON()
        });
    }

    handleSyncResponse(data) {
        console.log('Received blockchain sync response');
        // In a real implementation, we would merge the blockchain
        // For now, just log it
        console.log('Blockchain height:', data.blockchain.chain.length);
    }

    handleNewBlock(data) {
        console.log('Received new block:', data.block.hash);
        // In a real implementation, we would validate and add to blockchain
    }

    handleNewTransaction(data) {
        console.log('Received new transaction:', data.transaction.hash);
        // In a real implementation, we would validate and add to pending transactions
    }

    handleChannelSyncRequest(peerAddress) {
        console.log(`Channel sync request from ${peerAddress}`);
        this.send(peerAddress, {
            type: 'CHANNEL_SYNC_RESPONSE',
            channels: this.node.channelManager.toJSON()
        });
    }

    handleChannelSyncResponse(data) {
        console.log('Received channel sync response');
        // In a real implementation, we would sync channel state
    }

    handleChannelTransaction(data) {
        console.log('Received channel transaction:', data.transaction.hash);
        // In a real implementation, we would process the channel transaction
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        
        this.clients.forEach((ws, peerAddress) => {
            ws.close();
        });
        this.clients.clear();
        this.peers.clear();
        
        console.log('P2P server stopped');
    }

    getStatus() {
        return {
            peerCount: this.peers.size,
            connectedPeers: Array.from(this.peers),
            isRunning: this.server !== null
        };
    }
}

module.exports = P2P;