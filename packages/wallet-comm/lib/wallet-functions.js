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
        const message = {
            type: to_wallet_1.INITIALIZE_REQUEST,
            userId
        };
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
//# sourceMappingURL=wallet-functions.js.map