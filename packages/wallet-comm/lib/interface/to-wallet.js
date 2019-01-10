"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PlayerIndex;
(function (PlayerIndex) {
    PlayerIndex[PlayerIndex["A"] = 0] = "A";
    PlayerIndex[PlayerIndex["B"] = 1] = "B";
})(PlayerIndex = exports.PlayerIndex || (exports.PlayerIndex = {}));
exports.INITIALIZE_REQUEST = 'WALLET.INITIALIZE_REQUEST';
exports.initializeRequest = () => ({
    type: exports.INITIALIZE_REQUEST,
});
exports.FUNDING_REQUEST = 'WALLET.FUNDING.REQUEST';
exports.fundingRequest = (channelId, myAddress, opponentAddress, myBalance, opponentBalance, playerIndex) => ({
    type: exports.FUNDING_REQUEST,
    channelId,
    myAddress,
    opponentAddress,
    myBalance,
    opponentBalance,
    playerIndex,
});
exports.OPEN_CHANNEL_REQUEST = 'WALLET.CHANNEL.REQUEST.OPEN';
exports.openChannelRequest = (channel) => ({
    type: exports.OPEN_CHANNEL_REQUEST,
    channel,
});
exports.CONCLUDE_CHANNEL_REQUEST = 'WALLET.CHANNEL.REQUEST.CONCLUDE';
exports.concludeChannelRequest = () => ({
    type: exports.CONCLUDE_CHANNEL_REQUEST,
});
exports.CLOSE_CHANNEL_REQUEST = 'WALLET.CHANNEL.REQUEST.CLOSE';
exports.closeChannelRequest = () => ({
    type: exports.CLOSE_CHANNEL_REQUEST,
});
exports.VALIDATION_REQUEST = 'WALLET.VALIDATION.REQUEST';
exports.validationRequest = (requestId, data, signature) => ({
    type: exports.VALIDATION_REQUEST,
    requestId,
    data,
    signature,
});
exports.SIGNATURE_REQUEST = 'WALLET.SIGNATURE.REQUEST';
exports.signatureRequest = (requestId, data) => ({
    type: exports.SIGNATURE_REQUEST,
    requestId,
    data,
});
exports.WITHDRAWAL_REQUEST = 'WALLET.WITHDRAWAL.REQUEST';
exports.withdrawalRequest = (position) => ({
    type: exports.WITHDRAWAL_REQUEST,
    position,
});
exports.CREATE_CHALLENGE_REQUEST = 'WALLET.CHALLENGE.CREATE';
exports.createChallenge = () => ({
    type: exports.CREATE_CHALLENGE_REQUEST,
});
exports.RESPOND_TO_CHALLENGE = 'RESPOND_TO_CHALLENGE';
exports.respondToChallenge = (position) => ({
    position,
    type: exports.RESPOND_TO_CHALLENGE,
});
exports.RECEIVE_MESSAGE = 'WALLET.MESSAGING.RECEIVE';
exports.receiveMessage = (data, signature) => ({
    type: exports.RECEIVE_MESSAGE,
    data,
    signature,
});
exports.MESSAGE_SENT = 'WALLET.MESSAGING.MESSAGE_SENT';
exports.messageSent = (positionData, signature) => ({
    type: exports.MESSAGE_SENT,
    positionData,
    signature,
});
//# sourceMappingURL=to-wallet.js.map