"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUNDING_SUCCESS = 'WALLET.FUNDING.SUCCESS';
exports.FUNDING_FAILURE = 'WALLET.FUNDING.FAILURE';
exports.fundingSuccess = (channelId, position) => ({
    type: exports.FUNDING_SUCCESS,
    channelId,
    position,
});
exports.fundingFailure = (channelId, reason) => ({
    type: exports.FUNDING_FAILURE,
    channelId,
    reason,
});
exports.CHANNEL_OPENED = 'WALLET.CHANNEL.OPENED';
exports.CHANNEL_CLOSED = 'WALLET.CHANNEL.CLOSED';
exports.channelOpened = (channelId) => ({
    type: exports.CHANNEL_OPENED,
    channelId,
});
exports.channelClosed = (walletId) => ({
    type: exports.CHANNEL_CLOSED,
    walletId,
});
exports.VALIDATION_SUCCESS = 'WALLET.VALIDATION.SUCCESS';
exports.VALIDATION_FAILURE = 'WALLET.VALIDATION.FAILURE';
exports.validationSuccess = () => ({
    type: exports.VALIDATION_SUCCESS,
});
exports.validationFailure = (reason, error) => ({
    type: exports.VALIDATION_FAILURE,
    reason,
    error,
});
exports.SIGNATURE_SUCCESS = 'WALLET.SIGNATURE.SUCCESS';
exports.SIGNATURE_FAILURE = 'WALLET.SIGNATURE.FAILURE';
exports.signatureSuccess = (signature) => ({
    type: exports.SIGNATURE_SUCCESS,
    signature,
});
exports.signatureFailure = (reason, error) => ({
    type: exports.SIGNATURE_FAILURE,
    reason,
    error,
});
exports.WITHDRAWAL_SUCCESS = 'WALLET.WITHDRAWAL.SUCCESS';
exports.WITHDRAWAL_FAILURE = 'WALLET.WITHDRAWAL.FAILURE';
exports.withdrawalSuccess = transaction => ({
    type: exports.WITHDRAWAL_SUCCESS,
    transaction,
});
exports.withdrawalFailure = (reason) => ({
    type: exports.WITHDRAWAL_FAILURE,
    reason,
});
exports.INITIALIZATION_SUCCESS = 'WALLET.INITIALIZATION.SUCCESS';
exports.INITIALIZATION_FAILURE = 'WALLET.INITIALIZATION.FAILURE';
exports.initializationSuccess = address => ({
    type: exports.INITIALIZATION_SUCCESS,
    address,
});
exports.initializationFailure = (message) => ({
    type: exports.INITIALIZATION_FAILURE,
    message,
});
exports.CONCLUDE_SUCCESS = 'WALLET.CONCLUDE.SUCCESS';
exports.CONCLUDE_FAILURE = 'WALLET.CONCLUDE.FAILURE';
exports.concludeSuccess = () => ({
    type: exports.CONCLUDE_SUCCESS,
});
exports.concludeFailure = (message) => ({
    type: exports.CONCLUDE_FAILURE,
    message,
});
exports.CLOSE_SUCCESS = 'WALLET.CLOSE.SUCCESS';
exports.closeSuccess = () => ({
    type: exports.CLOSE_SUCCESS,
});
exports.SEND_MESSAGE = 'WALLET.MESSAGING.SEND';
exports.sendMessage = (to, data, signature) => ({
    type: exports.SEND_MESSAGE,
    to,
    data,
    signature,
});
exports.MESSAGE_RECEIVED = 'WALLET.MESSAGING.MESSAGE_RECEIVED';
exports.messageReceived = (positionData, signature) => ({
    type: exports.MESSAGE_RECEIVED,
    positionData,
    signature,
});
exports.CHALLENGE_POSITION_RECEIVED = 'WALLET.MESSAGING.CHALLENGE_POSITION_RECEIVED';
exports.challengePositionReceived = (positionData) => ({
    type: exports.CHALLENGE_POSITION_RECEIVED,
    positionData,
});
exports.CHALLENGE_REJECTED = 'WALLET.CHALLENGING.CHALLENGE_REJECTED';
exports.challengeRejected = (reason) => ({
    type: exports.CHALLENGE_REJECTED,
    reason,
});
exports.CHALLENGE_RESPONSE_REQUESTED = 'CHALLENGE_RESPONSE_REQUESTED';
exports.challengeResponseRequested = () => ({
    type: exports.CHALLENGE_RESPONSE_REQUESTED,
});
exports.CHALLENGE_COMPLETE = 'CHALLENGE_COMPLETE';
exports.challengeComplete = () => ({
    type: exports.CHALLENGE_COMPLETE,
});
//# sourceMappingURL=from-wallet.js.map