const Block = require('./Block.js');
const Transaction = require('./Transaction.js');

class Blockchain {
    constructor(difficulty = 2) {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = difficulty;
        this.createGenesisBlock();
    }

    createGenesisBlock() {
        const genesisBlock = new Block(
            0,
            '0',
            Date.now(),
            [],
            this.difficulty
        );
        genesisBlock.mine();
        this.chain.push(genesisBlock);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        if (!transaction.isValid()) {
            throw new Error('Invalid transaction');
        }
        this.pendingTransactions.push(transaction);
    }

    minePendingTransactions(miningRewardAddress) {
        if (this.pendingTransactions.length === 0) {
            return null;
        }

        // Create reward transaction
        const rewardTx = new Transaction(
            'network',
            miningRewardAddress,
            100, // Mining reward
            'mining reward'
        );
        
        // For simplicity, we'll skip signing the reward transaction
        // In a real implementation, this would be signed by the network
        rewardTx.hash = rewardTx.calculateHash();
        
        const transactions = [...this.pendingTransactions, rewardTx];
        
        const latestBlock = this.getLatestBlock();
        const newBlock = new Block(
            latestBlock.index + 1,
            latestBlock.hash,
            Date.now(),
            transactions,
            this.difficulty
        );

        newBlock.mine();
        this.chain.push(newBlock);
        this.pendingTransactions = [];
        
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.isValid(previousBlock.hash)) {
                return false;
            }
        }
        return true;
    }

    getBalance(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.sender === address) {
                    balance -= tx.amount;
                }
                if (tx.receiver === address) {
                    balance += tx.amount;
                }
            }
        }

        for (const tx of this.pendingTransactions) {
            if (tx.sender === address) {
                balance -= tx.amount;
            }
            if (tx.receiver === address) {
                balance += tx.amount;
            }
        }

        return balance;
    }

    getTransactionHistory(address) {
        const history = [];

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.sender === address || tx.receiver === address) {
                    history.push({
                        ...tx.toJSON(),
                        blockIndex: block.index,
                        blockHash: block.hash
                    });
                }
            }
        }

        for (const tx of this.pendingTransactions) {
            if (tx.sender === address || tx.receiver === address) {
                history.push({
                    ...tx.toJSON(),
                    blockIndex: null,
                    blockHash: null
                });
            }
        }

        return history;
    }

    toJSON() {
        return {
            chain: this.chain.map(block => block.toJSON()),
            pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()),
            difficulty: this.difficulty
        };
    }

    static fromJSON(data) {
        const blockchain = new Blockchain(data.difficulty);
        blockchain.chain = data.chain.map(blockData => Block.fromJSON(blockData));
        blockchain.pendingTransactions = data.pendingTransactions.map(txData => Transaction.fromJSON(txData));
        return blockchain;
    }
}

module.exports = Blockchain;