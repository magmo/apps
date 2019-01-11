import { Channel } from 'fmg-core';
import { INITIALIZATION_SUCCESS, INITIALIZATION_FAILURE, CHANNEL_OPENED, ChannelOpened, FUNDING_FAILURE, FUNDING_SUCCESS, FundingResponse, SIGNATURE_FAILURE, SIGNATURE_SUCCESS, SignatureResponse, VALIDATION_SUCCESS, VALIDATION_FAILURE, ValidationResponse, messageRequest } from './interface/from-wallet';
import { INITIALIZE_REQUEST, openChannelRequest, initializeRequest, fundingRequest, signatureRequest, validationRequest, receiveMessage } from './interface/to-wallet';
import BN from 'bn.js';

// Initialized the wallet with a given user id.
// The promise resolves when the wallet is initialized or an error occurs
// The promise returns the wallet address.
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


// Opens the channel. 
//TODO: Can this be part of funding instead of it's own method
export function openChannel(iFrameId: string, channel: Channel): void {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = openChannelRequest(channel);
  iFrame.contentWindow.postMessage(message, "*");

}

// Validates signed data.
// Promise resolves when the data is verified or an error occurs.
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

// Signs data with the wallet's private key. 
// Promise resolves when a signature is received from the wallet or an error occurs.
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

// Sends a message to the wallet.
// This is used for communicating messages from the opponent's wallet to the current wallet.
// TODO: Come up with a clearer name.
export function messageWallet(iFrameId: string, data, signature: string) {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = receiveMessage(data, signature);
  iFrame.contentWindow.postMessage(message, '*');
}


// Starts the funding process. Returns immediately.
// The wallet will throw a FUNDING_SUCCESS or FUNDING_FAILURE event when the funding process is complete.
// The funding process also relies on sending a message to the other opponent's wallet, so the MESSAGE_REQUEST event
// should be monitored when funding in underway.
export function startFunding(iFrameId: string,
  channelId: string,
  myAddress: string,
  opponentAddress: string,
  myBalance: BN,
  opponentBalance: BN,
  playerIndex: number): void {

  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  const message = fundingRequest(channelId, myAddress, opponentAddress, myBalance, opponentBalance, playerIndex);
  iFrame.contentWindow.postMessage(message, "*");
}
