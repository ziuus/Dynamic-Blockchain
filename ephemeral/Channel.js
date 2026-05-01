const crypto = require('crypto');
const Transaction = require('../core/Transaction.js');

class Channel {
    constructor(id, participants, initialBalances, blockchain) {
        this.id = id;
        this.participants = participants; // Array of participant addresses
        this.blockchain = blockchain;
        this.state = {};
        this.transactionQueue = [];
        this.isOpen = true;
        this.openingTransaction = null;
        this.closingTransaction = null;

        // Initialize state with balances
        participants.forEach((participant, index) => {
            this.state[participant] = {
                balance: initialBalances[index] || 0,
                lastUpdate: Date.now()
            };
        });

        // Create opening transaction on main chain
        this.createOpeningTransaction();
    }

    createOpeningTransaction() {
        const openingTx = new Transaction(
            'channel_contract',
            this.id,
            0,
            {
                type: 'channel_open',
                participants: this.participants,
                initialBalances: this.participants.map(p => this.state[p].balance),
                channelId: this.id
            }
        );
        openingTx.hash = openingTx.calculateHash();
        this.openingTransaction = openingTx;
        this.blockchain.addTransaction(openingTx);
    }

    executeTransaction(sender, receiver, amount, data = null) {
        if (!this.isOpen) {
            throw new Error('Channel is closed');
        }

        if (!this.participants.includes(sender) || !this.participants.includes(receiver)) {
            throw new Error('Participant not in channel');
        }

        if (this.state[sender].balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Create off-chain transaction
        const tx = new Transaction(sender, receiver, amount, data);
        tx.hash = tx.calculateHash();
        
        this.transactionQueue.push(tx);
        
        // Update state immediately (optimistic execution)
        this.state[sender].balance -= amount;
        this.state[receiver].balance += amount;
        this.state[sender].lastUpdate = Date.now();
        this.state[receiver].lastUpdate = Date.now();

        return tx;
    }

    getState() {
        return {
            id: this.id,
            participants: this.participants,
            state: this.state,
            isOpen: this.isOpen,
            transactionCount: this.transactionQueue.length,
            openingTransaction: this.openingTransaction?.hash,
            closingTransaction: this.closingTransaction?.hash
        };
    }

    settle() {
        if (!this.isOpen) {
            throw new Error('Channel is already closed');
        }

        // Create settlement transaction
        const settlementData = {
            type: 'channel_settle',
            channelId: this.id,
            finalBalances: this.participants.map(p => this.state[p].balance),
            transactionCount: this.transactionQueue.length
        };

        const settleTx = new Transaction(
            this.id,
            'channel_contract',
            0,
            settlementData
        );
        settleTx.hash = settleTx.calculateHash();
        this.closingTransaction = settleTx;
        
        this.blockchain.addTransaction(settleTx);
        this.isOpen = false;

        return settleTx;
    }

    close() {
        if (!this.isOpen) {
            throw new Error('Channel is already closed');
        }

        // Force close with current state
        return this.settle();
    }

    getTransactionHistory() {
        return this.transactionQueue.map(tx => tx.toJSON());
    }

    getBalance(address) {
        if (!this.participants.includes(address)) {
            throw new Error('Address not in channel');
        }
        return this.state[address].balance;
    }

    toJSON() {
        return {
            id: this.id,
            participants: this.participants,
            state: this.state,
            isOpen: this.isOpen,
            transactionQueue: this.transactionQueue.map(tx => tx.toJSON()),
            openingTransaction: this.openingTransaction?.toJSON(),
            closingTransaction: this.closingTransaction?.toJSON()
        };
    }

    static fromJSON(data, blockchain) {
        const channel = new Channel(
            data.id,
            data.participants,
            data.participants.map(p => data.state[p].balance),
            blockchain
        );
        channel.state = data.state;
        channel.transactionQueue = data.transactionQueue.map(tx => Transaction.fromJSON(tx));
        channel.isOpen = data.isOpen;
        channel.openingTransaction = data.openingTransaction ? Transaction.fromJSON(data.openingTransaction) : null;
        channel.closingTransaction = data.closingTransaction ? Transaction.fromJSON(data.closingTransaction) : null;
        return channel;
    }
}

module.exports = Channel;