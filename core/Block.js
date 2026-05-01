const crypto = require('crypto');
const Transaction = require('./Transaction.js');

class Block {
    constructor(index, previousHash, timestamp, transactions, difficulty = 2) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.nonce = 0;
        this.hash = this.calculateHash();
        this.merkleRoot = this.calculateMerkleRoot();
    }

    calculateHash() {
        const hashData = JSON.stringify({
            index: this.index,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => tx.hash),
            nonce: this.nonce,
            merkleRoot: this.merkleRoot
        });
        return crypto.createHash('sha256').update(hashData).digest('hex');
    }

    calculateMerkleRoot() {
        if (this.transactions.length === 0) {
            return crypto.createHash('sha256').update('').digest('hex');
        }

        let currentLayer = this.transactions.map(tx => tx.hash);
        
        while (currentLayer.length > 1) {
            const nextLayer = [];
            for (let i = 0; i < currentLayer.length; i += 2) {
                const left = currentLayer[i];
                const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : currentLayer[i];
                const combined = left + right;
                nextLayer.push(crypto.createHash('sha256').update(combined).digest('hex'));
            }
            currentLayer = nextLayer;
        }
        
        return currentLayer[0];
    }

    mine() {
        const target = '0'.repeat(this.difficulty);
        
        while (true) {
            this.hash = this.calculateHash();
            if (this.hash.startsWith(target)) {
                return this.hash;
            }
            this.nonce++;
        }
    }

    isValid(previousBlockHash) {
        // Check if hash is valid
        if (this.hash !== this.calculateHash()) {
            return false;
        }

        // Check if previous hash matches
        if (this.previousHash !== previousBlockHash) {
            return false;
        }

        // Check if transactions are valid
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        // Check if merkle root is valid
        if (this.merkleRoot !== this.calculateMerkleRoot()) {
            return false;
        }

        return true;
    }

    toJSON() {
        return {
            index: this.index,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => tx.toJSON()),
            difficulty: this.difficulty,
            nonce: this.nonce,
            hash: this.hash,
            merkleRoot: this.merkleRoot
        };
    }

    static fromJSON(data) {
        const transactions = data.transactions.map(tx => Transaction.fromJSON(tx));
        const block = new Block(
            data.index,
            data.previousHash,
            data.timestamp,
            transactions,
            data.difficulty
        );
        block.nonce = data.nonce;
        block.hash = data.hash;
        block.merkleRoot = data.merkleRoot;
        return block;
    }
}

module.exports = Block;