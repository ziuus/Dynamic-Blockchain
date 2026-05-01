const Blockchain = require('../core/Blockchain.js');
const ChannelManager = require('../ephemeral/ChannelManager.js');
const Transaction = require('../core/Transaction.js');

class Benchmark {
    constructor() {
        this.results = {};
    }

    async benchmarkMainChain(transactionsPerBlock = 10, numBlocks = 5, difficulty = 2) {
        console.log(`Benchmarking main chain with ${transactionsPerBlock} tx/block, ${numBlocks} blocks, difficulty ${difficulty}...`);
        
        const startTime = Date.now();
        const blockchain = new Blockchain(difficulty);
        
        // Create test addresses
        const addresses = Array.from({ length: 10 }, (_, i) => `address_${i}`);
        
        // Pre-create transactions
        const allTransactions = [];
        for (let b = 0; b < numBlocks; b++) {
            const blockTransactions = [];
            for (let t = 0; t < transactionsPerBlock; t++) {
                const senderIndex = Math.floor(Math.random() * addresses.length);
                const receiverIndex = Math.floor(Math.random() * addresses.length);
                if (senderIndex === receiverIndex) continue;
                
                const tx = new Transaction(
                    addresses[senderIndex],
                    addresses[receiverIndex],
                    Math.floor(Math.random() * 100) + 1,
                    `tx_${b}_${t}`
                );
                tx.hash = tx.calculateHash();
                blockTransactions.push(tx);
            }
            allTransactions.push(...blockTransactions);
        }
        
        // Add and mine transactions
        for (let b = 0; b < numBlocks; b++) {
            const blockStart = Date.now();
            const blockTransactions = allTransactions.slice(
                b * transactionsPerBlock,
                (b + 1) * transactionsPerBlock
            );
            
            blockTransactions.forEach(tx => blockchain.addTransaction(tx));
            blockchain.minePendingTransactions(addresses[0]);
            
            const blockEnd = Date.now();
            console.log(`  Block ${b + 1}: ${blockEnd - blockStart}ms`);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const totalTransactions = transactionsPerBlock * numBlocks;
        const tps = (totalTransactions / totalTime) * 1000;
        
        this.results.mainChain = {
            totalTime,
            totalTransactions,
            transactionsPerSecond: tps,
            blocksMined: numBlocks,
            difficulty,
            transactionsPerBlock
        };
        
        console.log(`Main chain benchmark completed in ${totalTime}ms`);
        console.log(`Total transactions: ${totalTransactions}`);
        console.log(`Transactions per second: ${tps.toFixed(2)}`);
        
        return this.results.mainChain;
    }

    async benchmarkEphemeralChannels(numChannels = 5, transactionsPerChannel = 20, difficulty = 2) {
        console.log(`Benchmarking ephemeral channels with ${numChannels} channels, ${transactionsPerChannel} tx/channel...`);
        
        const startTime = Date.now();
        const blockchain = new Blockchain(difficulty);
        const channelManager = new ChannelManager(blockchain);
        
        // Create test addresses
        const addresses = Array.from({ length: 10 }, (_, i) => `address_${i}`);
        
        // Create channels
        const channels = [];
        for (let c = 0; c < numChannels; c++) {
            const participantIndex1 = Math.floor(Math.random() * addresses.length);
            const participantIndex2 = Math.floor(Math.random() * addresses.length);
            
            const channel = channelManager.createChannel(
                [addresses[participantIndex1], addresses[participantIndex2]],
                [1000, 1000]
            );
            channels.push(channel);
        }
        
        // Execute off-chain transactions
        const channelStart = Date.now();
        for (const channel of channels) {
            for (let t = 0; t < transactionsPerChannel; t++) {
                const senderIndex = Math.random() > 0.5 ? 0 : 1;
                const receiverIndex = senderIndex === 0 ? 1 : 0;
                const amount = Math.floor(Math.random() * 100) + 1;
                
                channel.executeTransaction(
                    channel.participants[senderIndex],
                    channel.participants[receiverIndex],
                    amount,
                    `offchain_${t}`
                );
            }
        }
        const channelEnd = Date.now();
        
        // Settle all channels
        const settleStart = Date.now();
        for (const channel of channels) {
            channel.settle();
        }
        const settleEnd = Date.now();
        
        // Mine the settlement transactions
        const mineStart = Date.now();
        for (let i = 0; i < numChannels; i++) {
            blockchain.minePendingTransactions(addresses[0]);
        }
        const mineEnd = Date.now();
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const totalTransactions = numChannels * transactionsPerChannel;
        const tps = (totalTransactions / (channelEnd - channelStart)) * 1000;
        
        this.results.ephemeral = {
            totalTime,
            totalTransactions,
            transactionsPerSecond: tps,
            numChannels,
            transactionsPerChannel,
            channelCreationTime: channelStart - startTime,
            transactionExecutionTime: channelEnd - channelStart,
            settlementTime: settleEnd - settleStart,
            miningTime: mineEnd - mineStart
        };
        
        console.log(`Ephemeral channels benchmark completed in ${totalTime}ms`);
        console.log(`Total off-chain transactions: ${totalTransactions}`);
        console.log(`Off-chain transactions per second: ${tps.toFixed(2)}`);
        console.log(`Settlement time: ${settleEnd - settleStart}ms`);
        console.log(`Mining time: ${mineEnd - mineStart}ms`);
        
        return this.results.ephemeral;
    }

    async benchmarkComparison(transactionsPerBlock = 10, numBlocks = 5, numChannels = 5, transactionsPerChannel = 20) {
        console.log('=== Running Comparison Benchmark ===\n');
        
        // Benchmark main chain
        await this.benchmarkMainChain(transactionsPerBlock, numBlocks);
        console.log();
        
        // Benchmark ephemeral channels
        await this.benchmarkEphemeralChannels(numChannels, transactionsPerChannel);
        console.log();
        
        // Calculate comparison
        const mainChainTps = this.results.mainChain.transactionsPerSecond;
        const ephemeralTps = this.results.ephemeral.transactionsPerSecond;
        const speedup = ephemeralTps / mainChainTps;
        
        console.log('=== Comparison Results ===');
        console.log(`Main chain TPS: ${mainChainTps.toFixed(2)}`);
        console.log(`Ephemeral channels TPS: ${ephemeralTps.toFixed(2)}`);
        console.log(`Speedup: ${speedup.toFixed(2)}x`);
        
        return {
            mainChain: this.results.mainChain,
            ephemeral: this.results.ephemeral,
            speedup
        };
    }

    async runFullBenchmark() {
        console.log('=== Dynamic Interconnection Blockchain Benchmark ===\n');
        
        // Run comparison with different configurations
        const configs = [
            { txPerBlock: 5, numBlocks: 3, numChannels: 3, txPerChannel: 10 },
            { txPerBlock: 10, numBlocks: 5, numChannels: 5, txPerChannel: 20 },
            { txPerBlock: 20, numBlocks: 3, numChannels: 10, txPerChannel: 50 }
        ];
        
        const results = [];
        
        for (const config of configs) {
            console.log(`\n--- Configuration: ${config.txPerBlock} tx/block, ${config.numChannels} channels ---`);
            const result = await this.benchmarkComparison(
                config.txPerBlock,
                config.numBlocks,
                config.numChannels,
                config.txPerChannel
            );
            results.push({ config, result });
        }
        
        console.log('\n=== Summary ===');
        results.forEach((item, index) => {
            console.log(`\nConfig ${index + 1}:`);
            console.log(`  Main chain: ${item.result.mainChain.transactionsPerSecond.toFixed(2)} TPS`);
            console.log(`  Ephemeral: ${item.result.ephemeral.transactionsPerSecond.toFixed(2)} TPS`);
            console.log(`  Speedup: ${item.result.speedup.toFixed(2)}x`);
        });
        
        return results;
    }

    printResults() {
        console.log('\n=== Benchmark Results ===');
        console.log(JSON.stringify(this.results, null, 2));
    }
}

// Run the benchmark
async function runBenchmark() {
    const benchmark = new Benchmark();
    
    try {
        // Run a single comparison
        await benchmark.benchmarkComparison(10, 5, 5, 20);
        benchmark.printResults();
        
        // Uncomment to run full benchmark suite
        // await benchmark.runFullBenchmark();
        
        console.log('\nBenchmark complete!');
    } catch (error) {
        console.error('Benchmark failed:', error);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    runBenchmark();
}

module.exports = Benchmark;