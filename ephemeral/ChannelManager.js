const Channel = require('./Channel.js');

class ChannelManager {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.channels = new Map(); // channelId -> Channel
        this.participantIndex = new Map(); // address -> Set of channelIds
    }

    createChannel(participants, initialBalances) {
        const channelId = this.generateChannelId(participants);
        const channel = new Channel(channelId, participants, initialBalances, this.blockchain);
        
        this.channels.set(channelId, channel);
        
        // Update participant index
        participants.forEach(participant => {
            if (!this.participantIndex.has(participant)) {
                this.participantIndex.set(participant, new Set());
            }
            this.participantIndex.get(participant).add(channelId);
        });

        return channel;
    }

    generateChannelId(participants) {
        const sorted = [...participants].sort();
        return 'channel_' + sorted.join('_') + '_' + Date.now();
    }

    getChannel(channelId) {
        return this.channels.get(channelId);
    }

    getChannelsForParticipant(address) {
        const channelIds = this.participantIndex.get(address) || new Set();
        return Array.from(channelIds).map(id => this.channels.get(id)).filter(c => c);
    }

    executeTransaction(channelId, sender, receiver, amount, data = null) {
        const channel = this.getChannel(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        return channel.executeTransaction(sender, receiver, amount, data);
    }

    settleChannel(channelId) {
        const channel = this.getChannel(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        return channel.settle();
    }

    closeChannel(channelId) {
        const channel = this.getChannel(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        return channel.close();
    }

    getAllChannels() {
        return Array.from(this.channels.values());
    }

    getChannelStats() {
        return {
            totalChannels: this.channels.size,
            openChannels: Array.from(this.channels.values()).filter(c => c.isOpen).length,
            closedChannels: Array.from(this.channels.values()).filter(c => !c.isOpen).length,
            totalParticipants: new Set(
                Array.from(this.channels.values()).flatMap(c => c.participants)
            ).size
        };
    }

    cleanupClosedChannels() {
        const closedChannels = Array.from(this.channels.entries())
            .filter(([id, channel]) => !channel.isOpen);
        
        closedChannels.forEach(([id, channel]) => {
            this.channels.delete(id);
            channel.participants.forEach(participant => {
                const channels = this.participantIndex.get(participant);
                if (channels) {
                    channels.delete(id);
                }
            });
        });
        
        return closedChannels.length;
    }

    toJSON() {
        return {
            channels: Array.from(this.channels.values()).map(c => c.toJSON()),
            stats: this.getChannelStats()
        };
    }

    static fromJSON(data, blockchain) {
        const manager = new ChannelManager(blockchain);
        data.channels.forEach(channelData => {
            const channel = Channel.fromJSON(channelData, blockchain);
            manager.channels.set(channel.id, channel);
            channel.participants.forEach(participant => {
                if (!manager.participantIndex.has(participant)) {
                    manager.participantIndex.set(participant, new Set());
                }
                manager.participantIndex.get(participant).add(channel.id);
            });
        });
        return manager;
    }
}

module.exports = ChannelManager;