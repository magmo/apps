import { Channel } from 'fmg-core';
import { INITIALIZATION_SUCCESS, INITIALIZATION_FAILURE } from './interface/from-wallet';
import { INITIALIZE_REQUEST } from './interface/to-wallet';

export async function initializeWallet(iFrameId: string, userId: string): Promise<string> {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = {
    type: INITIALIZE_REQUEST,
    userId
  };
  iFrame.contentWindow.postMessage(message, "*");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function eventListener(event: MessageEvent) {
      if (event.data && event.data.type && (
        event.data.type === INITIALIZATION_SUCCESS || event.data.type === INITIALIZATION_FAILURE)) {

        window.removeEventListener("message", eventListener);
        if (event.data.type === INITIALIZATION_SUCCESS) {
          resolve(event.data.address);
        } else {
          reject(event.data.message);
        }
      }
    });
  });
}
