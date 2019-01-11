"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const from_wallet_1 = require("./interface/from-wallet");
const to_wallet_1 = require("./interface/to-wallet");
function initializeWallet(iFrameId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = to_wallet_1.initializeRequest(userId);
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise((resolve, reject) => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type && (event.data.type === from_wallet_1.INITIALIZATION_SUCCESS || event.data.type === from_wallet_1.INITIALIZATION_FAILURE)) {
                    window.removeEventListener("message", eventListener);
                    if (event.data.type === from_wallet_1.INITIALIZATION_SUCCESS) {
                        resolve(event.data.address);
                    }
                    else {
                        reject(event.data.message);
                    }
                }
            });
        });
    });
}
exports.initializeWallet = initializeWallet;
function openChannel(iFrameId, channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = to_wallet_1.openChannelRequest(channel);
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise((resolve, reject) => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type &&
                    event.data.type === from_wallet_1.CHANNEL_OPENED) {
                    const receivedMessage = event.data;
                    window.removeEventListener("message", eventListener);
                    resolve(receivedMessage.channelId);
                }
            });
        });
    });
}
exports.openChannel = openChannel;
function validateSignature(iFrameId, data, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = to_wallet_1.validationRequest(data, signature);
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise((resolve, reject) => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type &&
                    (event.data.type === from_wallet_1.VALIDATION_SUCCESS || event.data.type === from_wallet_1.VALIDATION_FAILURE)) {
                    const receivedMessage = event.data;
                    window.removeEventListener("message", eventListener);
                    if (receivedMessage.type === from_wallet_1.VALIDATION_SUCCESS) {
                        resolve(true);
                    }
                    else {
                        const { error, reason } = receivedMessage;
                        reject({ error, reason });
                    }
                }
            });
        });
    });
}
exports.validateSignature = validateSignature;
function signData(iFrameId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = to_wallet_1.signatureRequest(data);
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise((resolve, reject) => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type &&
                    (event.data.type === from_wallet_1.SIGNATURE_SUCCESS || event.data.type === from_wallet_1.SIGNATURE_FAILURE)) {
                    const receivedMessage = event.data;
                    window.removeEventListener("message", eventListener);
                    if (receivedMessage.type === from_wallet_1.SIGNATURE_SUCCESS) {
                        const { signature } = receivedMessage;
                        resolve(signature);
                    }
                    else {
                        const { error, reason } = receivedMessage;
                        reject({ error, reason });
                    }
                }
            });
        });
    });
}
exports.signData = signData;
function requestFunding(iFrameId, channelId, myAddress, opponentAddress, myBalance, opponentBalance, playerIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = to_wallet_1.fundingRequest(channelId, myAddress, opponentAddress, myBalance, opponentBalance, playerIndex);
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise((resolve, reject) => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type &&
                    (event.data.type === from_wallet_1.FUNDING_SUCCESS || event.data.type === from_wallet_1.FUNDING_FAILURE)) {
                    const receivedMessage = event.data;
                    window.removeEventListener("message", eventListener);
                    if (receivedMessage.type === from_wallet_1.FUNDING_SUCCESS) {
                        const { channelId, position } = receivedMessage;
                        resolve({ channelId, position });
                    }
                    else {
                        reject(receivedMessage.reason);
                    }
                }
            });
        });
    });
}
exports.requestFunding = requestFunding;
//# sourceMappingURL=wallet-functions.js.map