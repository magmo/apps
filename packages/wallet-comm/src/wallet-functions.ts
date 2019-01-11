import { Channel } from 'fmg-core';
import { INITIALIZATION_SUCCESS, INITIALIZATION_FAILURE, CHANNEL_OPENED, ChannelOpened, FUNDING_FAILURE, FUNDING_SUCCESS, FundingResponse, SIGNATURE_FAILURE, SIGNATURE_SUCCESS, SignatureResponse, VALIDATION_SUCCESS, VALIDATION_FAILURE, ValidationResponse } from './interface/from-wallet';
import { INITIALIZE_REQUEST, openChannelRequest, initializeRequest, fundingRequest, signatureRequest, validationRequest } from './interface/to-wallet';
import BN from 'bn.js';

export async function initializeWallet(iFrameId: string, userId: string): Promise<string> {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = initializeRequest(userId);
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

export function openChannel(iFrameId: string, channel: Channel): void {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = openChannelRequest(channel);
  iFrame.contentWindow.postMessage(message, "*");

}

export async function validateSignature(iFrameId: string, data, signature: string): Promise<boolean> {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = validationRequest(data, signature);
  iFrame.contentWindow.postMessage(message, "*");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function eventListener(event: MessageEvent) {
      if (event.data && event.data.type &&
        (event.data.type === VALIDATION_SUCCESS || event.data.type === VALIDATION_FAILURE)) {
        const receivedMessage = event.data as ValidationResponse;
        window.removeEventListener("message", eventListener);
        if (receivedMessage.type === VALIDATION_SUCCESS) {
          resolve(true);
        } else {
          const { error, reason } = receivedMessage;
          reject({ error, reason });
        }
      }
    });
  });
}

export async function signData(iFrameId: string, data): Promise<string> {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = signatureRequest(data);
  iFrame.contentWindow.postMessage(message, "*");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function eventListener(event: MessageEvent) {
      if (event.data && event.data.type &&
        (event.data.type === SIGNATURE_SUCCESS || event.data.type === SIGNATURE_FAILURE)) {
        const receivedMessage = event.data as SignatureResponse;
        window.removeEventListener("message", eventListener);
        if (receivedMessage.type === SIGNATURE_SUCCESS) {
          const { signature } = receivedMessage;
          resolve(signature);
        } else {
          const { error, reason } = receivedMessage;
          reject({ error, reason });
        }
      }
    });
  });
}
// TODO: We probably don't want this as an async function since
// funding won't succeed without the app sending some messages during the funding stageß
export async function requestFunding(iFrameId: string,
  channelId: string,
  myAddress: string,
  opponentAddress: string,
  myBalance: BN,
  opponentBalance: BN,
  playerIndex: number): Promise<{ channelId, position }> {

  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = fundingRequest(channelId, myAddress, opponentAddress, myBalance, opponentBalance, playerIndex);
  iFrame.contentWindow.postMessage(message, "*");
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function eventListener(event: MessageEvent) {
      if (event.data && event.data.type &&
        (event.data.type === FUNDING_SUCCESS || event.data.type === FUNDING_FAILURE)) {
        const receivedMessage = event.data as FundingResponse;
        window.removeEventListener("message", eventListener);
        if (receivedMessage.type === FUNDING_SUCCESS) {
          const { channelId, position } = receivedMessage;
          resolve({ channelId, position });
        } else {
          reject(receivedMessage.reason);
        }
      }
    });
  });
}
