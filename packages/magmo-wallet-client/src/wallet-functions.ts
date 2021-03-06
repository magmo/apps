import {
  INITIALIZATION_SUCCESS,
  INITIALIZATION_FAILURE,
  SIGNATURE_FAILURE,
  SIGNATURE_SUCCESS,
  SignatureResponse,
  VALIDATION_SUCCESS,
  VALIDATION_FAILURE,
  ValidationResponse,
} from './wallet-events';
import {
  concludeChannelRequest,
  initializeRequest,
  fundingRequest,
  signCommitmentRequest,
  validateCommitmentRequest,
  receiveMessage,
  createChallenge,
  respondToChallenge,
} from './wallet-instructions';
import { Commitment } from 'fmg-core';

/**
 * Creates an iframe element for the wallet to be embedded in the page. The wallet iframe will hide itself and only show when interaction with the wallet is necessary.
 * @param iframeId The id for the iframe that will be created. This will be used in subsequent API calls to interact with the iframe.
 * @param walletUrl An optional parameter to specify the url the iframe will use to load the wallet. This defaults to https://wallet.magmo.com.
 * @returns {HTMLIFrameElement} The iframe element for the wallet that should be embedded in the page.
 */
export function createWalletIFrame(iframeId: string, walletUrl?: string): HTMLIFrameElement {
  walletUrl = walletUrl || 'https://wallet.magmo.com';
  const iFrame = document.createElement('iframe');
  iFrame.src = walletUrl;
  iFrame.id = iframeId;
  iFrame.style.display = 'none';
  iFrame.style.position = 'absolute';
  iFrame.style.left = '0px';
  iFrame.style.right = '0px';
  iFrame.style.bottom = '0px';
  iFrame.style.top = '0px';
  iFrame.width = '0';
  iFrame.height = '0';
  iFrame.style.zIndex = '9999';

  iFrame.setAttribute('allowtransparency', 'true');

  return iFrame;
}

/**
 * Initializes the wallet for a given user.
 * This must be called before any other interaction with the wallet.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param userId An id that is unique to the user who will be using the wallet.
 * @returns {Promise<string>} A promise that resolves to the address for the wallet.
 */
export async function initializeWallet(iFrameId: string, userId: string): Promise<string> {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = initializeRequest(userId);

  const initPromise = new Promise<null>((resolve, reject) => {
    window.addEventListener('message', function eventListener(event: MessageEvent) {
      if (
        event.data &&
        event.data.type &&
        (event.data.type === INITIALIZATION_SUCCESS || event.data.type === INITIALIZATION_FAILURE)
      ) {
        window.removeEventListener('message', eventListener);
        if (event.data.type === INITIALIZATION_SUCCESS) {
          resolve(event.data.address);
        } else {
          reject(event.data.message);
        }
      }
    });
  });

  iFrame.contentWindow.postMessage(message, '*');
  return initPromise;
}

/**
 * Validates that data was signed by the opponent's wallet.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param commitment The data that was signed.
 * @param signature The signature to validate.
 * @returns {Promise<Boolean>} A promise that resolves to whether the signature is valid for the data or not.
 */
export async function validateCommitmentSignature(
  iFrameId: string,
  commitment: Commitment,
  signature: string,
): Promise<boolean> {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = validateCommitmentRequest(commitment, signature);

  const validatePromise = new Promise<boolean>((resolve, reject) => {
    window.addEventListener('message', function eventListener(event: MessageEvent) {
      if (
        event.data &&
        event.data.type &&
        (event.data.type === VALIDATION_SUCCESS || event.data.type === VALIDATION_FAILURE)
      ) {
        const receivedMessage = event.data as ValidationResponse;
        window.removeEventListener('message', eventListener);
        if (receivedMessage.type === VALIDATION_SUCCESS) {
          resolve(true);
        } else {
          const { error, reason } = receivedMessage;
          reject({ error, reason });
        }
      }
    });
  });

  iFrame.contentWindow.postMessage(message, '*');
  return validatePromise;
}

/**
 * Signs data using the wallet's private key.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param commitment The commitment for the wallet to sign.
 * @returns {Promise<string>} A promise that resolves to the signature generated by the wallet.
 */
export async function signCommitment(iFrameId: string, commitment: Commitment): Promise<string> {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = signCommitmentRequest(commitment);

  const signPromise = new Promise<string>((resolve, reject) => {
    window.addEventListener('message', function eventListener(event: MessageEvent) {
      if (
        event.data &&
        event.data.type &&
        (event.data.type === SIGNATURE_SUCCESS || event.data.type === SIGNATURE_FAILURE)
      ) {
        const receivedMessage = event.data as SignatureResponse;
        window.removeEventListener('message', eventListener);
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

  iFrame.contentWindow.postMessage(message, '*');
  return signPromise;
}

/**
 * Relays a message to the wallet, from the opponent's wallet.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param walletMessage The message to send to the wallet that was received from the opponent's wallet.
 */
export function relayMessage(iFrameId: string, messagePayload: any) {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = receiveMessage(messagePayload);
  iFrame.contentWindow.postMessage(message, '*');
}

/**
 * Starts process of concluding the game. The wallet will communicate additional events during
 * using the [[WalletEventListener]] during the conclusion process.
 * @param iFrameId The id of the embedded wallet iframe.
 */
export function startConcludingGame(iFrameId: string, channelId: string): void {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = concludeChannelRequest(channelId);
  iFrame.contentWindow.postMessage(message, '*');
}

/**
 * Starts process of funding the game. The wallet will communicate additional events during using
 * the [[WalletEventListener]] during the funding process.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param channelId The id of the channel to fund.
 * @param myAddress The user's wallet address.
 * @param opponentAddress The opponent's wallet address.
 * @param myBalance The user's balance at the beginning of the game.
 * @param opponentBalance The opponent's balance at the beginning of the game.
 * @param playerIndex Whether the player is the first or second player in the game.
 */
export function startFunding(
  iFrameId: string,
  channelId: string,
  myAddress: string,
  opponentAddress: string,
  myBalance: string,
  opponentBalance: string,
  playerIndex: number,
): void {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = fundingRequest(
    channelId,
    myAddress,
    opponentAddress,
    myBalance,
    opponentBalance,
    playerIndex,
  );
  iFrame.contentWindow.postMessage(message, '*');
}

/**
 * Starts a challenge in the wallet.The wallet will communicate additional events during using the
 * [[WalletEventListener]] during the challenge process.
 * @param iFrameId The id of the embedded wallet iframe.
 */
export function startChallenge(iFrameId: string, channelId: string) {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = createChallenge(channelId);
  iFrame.contentWindow.postMessage(message, '*');
}

/**
 * Respond to a challenge when requested by the wallet.
 * @param iFrameId The id of the embedded wallet iframe.
 * @param responseCommitment The response to the challenge from the other user.
 */
export function respondToOngoingChallenge(iFrameId: string, responseCommitment: Commitment) {
  const iFrame = document.getElementById(iFrameId) as HTMLIFrameElement;
  const message = respondToChallenge(responseCommitment);
  iFrame.contentWindow.postMessage(message, '*');
}
