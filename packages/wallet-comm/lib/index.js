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
function sendTestMessage(IFrameId, message) {
    const iFrame = document.getElementById(IFrameId);
    iFrame.contentWindow.postMessage(message, "*");
}
exports.sendTestMessage = sendTestMessage;
function initializeWallet(iFrameId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const iFrame = document.getElementById(iFrameId);
        const message = {
            type: 'INITIALIZE_WALLET',
            userId
        };
        iFrame.contentWindow.postMessage(message, "*");
        return new Promise(resolve => {
            window.addEventListener("message", function eventListener(event) {
                if (event.data && event.data.type && event.data.type === "WALLET.INITIALIZATION.SUCCESS") {
                    window.removeEventListener("message", eventListener);
                    console.log('init success');
                    resolve(event.data.address);
                }
            });
        });
    });
}
exports.initializeWallet = initializeWallet;
//# sourceMappingURL=index.js.map