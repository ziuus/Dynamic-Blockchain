const Blockchain = require('../core/Blockchain.js');
const ChannelManager = require('../ephemeral/ChannelManager.js');
const Node = require('../network/Node.js');
const P2P = require('../network/P2P.js');
const BlockchainServer = require('../api/server.js');

class NetworkSimulator {
    constructor(numNodes = 3, difficulty = 2) {
        this.numNodes = numNodes;
        this.difficulty = difficulty;
        this.nodes = [];
        this.p2pServers = [];
        this.apiServers = [];
    }

    createNode(port, address = `localhost:${port}`) {
        const blockchain = new Blockchain(this.difficulty);
        const channelManager = new ChannelManager(blockchain);
        const node = new Node(address, port, blockchain, channelManager);
        return { node, blockchain, channelManager };
    }

    startNode(port, peers = []) {
        const { node, blockchain, channelManager } = this.createNode(port);
        const p2p = new P2P(node, peers);
        const api = new BlockchainServer(node, port + 1000); // API on port + 1000

        node.start();
        p2p.start(port);
        api.start();

        this.nodes.push(node);
        this.p2pServers.push(p2p);
        this.apiServers.push(api);

        return { node, p2p, api, blockchain, channelManager };
    }

    startNetwork() {
        console.log(`Starting network with ${this.numNodes} nodes...`);

        // Start first node (genesis)
        const firstNode = this.startNode(8080);
        console.log(`Node 1 started on port 8080 (API: 9080)`);

        // Start remaining nodes and connect to first
        for (let i = 1; i < this.numNodes; i++) {
            const port = 8080 + i;
            const node = this.startNode(port, ['localhost:8080']);
            console.log(`Node ${i + 1} started on port ${port} (API: ${port + 1000})`);
        }

        console.log('Network started successfully!');
        console.log('Nodes:');
        this.nodes.forEach((node, index) => {
            console.log(`  Node ${index + 1}: ${node.address}:${node.port}`);
        });
    }

    stopNetwork() {
        console.log('Stopping network...');
        
        this.apiServers.forEach(server => server.stop());
        this.p2pServers.forEach(p2p => p2p.stop());
        this.nodes.forEach(node => node.stop());
        
        this.apiServers = [];
        this.p2pServers = [];
        this.nodes = [];
        
        console.log('Network stopped');
    }

    simulateTransactions(numTransactions = 10) {
        console.log(`Simulating ${numTransactions} transactions...`);

        for (let i = 0; i < numTransactions; i++) {
            const senderIndex = Math.floor(Math.random() * this.nodes.length);
            const receiverIndex = Math.floor(Math.random() * this.nodes.length);
            
            if (senderIndex === receiverIndex) continue;

            const senderNode = this.nodes[senderIndex];
            const receiverNode = this.nodes[receiverIndex];
            const amount = Math.floor(Math.random() * 100) + 1;

            // Create transaction on sender's blockchain
            const tx = new senderNode.blockchain.pendingTransactions[0]?.constructor(
                senderNode.address,
                receiverNode.address,
                amount,
                `Transaction ${i + 1}`
            );
            tx.hash = tx.calculateHash();
            senderNode.blockchain.addTransaction(tx);

            console.log(`Transaction ${i + 1}: ${senderNode.address} -> ${receiverNode.address} (${amount})`);
        }

        console.log('Transactions created');
    }

    simulateMining(rounds = 3) {
        console.log(`Simulating ${rounds} mining rounds...`);

        for (let i = 0; i < rounds; i++) {
            this.nodes.forEach((node, index) => {
                const block = node.blockchain.minePendingTransactions(node.address);
                if (block) {
                    console.log(`Node ${index + 1} mined block ${block.index} with ${block.transactions.length} transactions`);
                }
            });
        }

        console.log('Mining completed');
    }

    simulateChannels(numChannels = 2) {
        console.log(`Simulating ${numChannels} channels...`);

        for (let i = 0; i < numChannels; i++) {
            const node1Index = Math.floor(Math.random() * this.nodes.length);
            const node2Index = Math.floor(Math.random() * this.nodes.length);
            
            if (node1Index === node2Index) continue;

            const node1 = this.nodes[node1Index];
            const node2 = this.nodes[node2Index];

            // Create channel between two nodes
            const channel = node1.channelManager.createChannel(
                [node1.address, node2.address],
                [1000, 1000] // Initial balances
            );

            console.log(`Channel created: ${channel.id} between ${node1.address} and ${node2.address}`);

            // Execute some off-chain transactions
            for (let j = 0; j < 5; j++) {
                const senderIndex = Math.random() > 0.5 ? 0 : 1;
                const receiverIndex = senderIndex === 0 ? 1 : 0;
                const amount = Math.floor(Math.random() * 100) + 1;

                const participants = channel.participants;
                const tx = node1.channelManager.executeTransaction(
                    channel.id,
                    participants[senderIndex],
                    participants[receiverIndex],
                    amount,
                    `Off-chain tx ${j + 1}`
                );

                console.log(`  Off-chain tx: ${participants[senderIndex]} -> ${participants[receiverIndex]} (${amount})`);
            }

            // Settle the channel
            const settleTx = node1.channelManager.settleChannel(channel.id);
            console.log(`Channel settled: ${settleTx.hash}`);
        }

        console.log('Channel simulation completed');
    }

    printNetworkStatus() {
        console.log('\n=== Network Status ===');
        this.nodes.forEach((node, index) => {
            const status = node.getStatus();
            console.log(`\nNode ${index + 1} (${node.address}:${node.port}):`);
            console.log(`  Blockchain height: ${status.blockchainHeight}`);
            console.log(`  Pending transactions: ${status.pendingTransactions}`);
            console.log(`  Peer count: ${status.peerCount}`);
            console.log(`  Channel stats:`, status.channelStats);
        });
        console.log('======================\n');
    }
}

// Run the simulation
const simulator = new NetworkSimulator(3, 2);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    simulator.stopNetwork();
    process.exit(0);
});

// Start the network
simulator.startNetwork();

// Wait a bit for connections to establish
setTimeout(() => {
    // Simulate some activity
    simulator.simulateTransactions(5);
    simulator.simulateMining(2);
    simulator.simulateChannels(2);
    
    // Print status
    simulator.printNetworkStatus();
    
    // Simulate more activity
    simulator.simulateTransactions(3);
    simulator.simulateMining(1);
    
    // Print final status
    simulator.printNetworkStatus();
    
    console.log('Simulation complete. Press Ctrl+C to stop the network.');
}, 2000);

module.exports = NetworkSimulator;