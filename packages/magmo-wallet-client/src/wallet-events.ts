import { SignedState } from 'nitro-protocol';
// TODO: We should limit WalletEvent/WalletEventTypes to the bare minimum of events we expect the app to handle. Some of these can be pruned.
// Events that we handle for the user (HideWallet,ShowWallet, ValidateSuccess, etc..) should be removed from WalletEvent/WalletEventTypes
// We should also switch from ReturnType to declaring a fixed type/interface that the action creators implement.
// FUNDING
// =======
/**
 * The event type when funding succeeds.
 */
export const FUNDING_SUCCESS = 'WALLET.FUNDING.SUCCESS';

/**
 * The event type when funding fails.
 */
export const FUNDING_FAILURE = 'WALLET.FUNDING.FAILURE';

/**
 * @ignore
 */
export const fundingSuccess = (channelId, signedState: SignedState) => ({
  type: FUNDING_SUCCESS as typeof FUNDING_SUCCESS,
  channelId,
  signedState,
});

/**
 * @ignore
 */
export const fundingFailure = (
  channelId: any,
  reason: 'FundingDeclined' | 'Other',
  error?: string,
) => ({
  type: FUNDING_FAILURE as typeof FUNDING_FAILURE,
  channelId,
  reason,
  error,
});

/**
 * The event that is emitted on funding success.
 */
export type FundingSuccess = ReturnType<typeof fundingSuccess>;

/**
 * The event that is emitted on funding failure.
 */
export type FundingFailure = ReturnType<typeof fundingFailure>;

/**
 * The events that will be emitted for funding.
 */
export type FundingResponse = FundingSuccess | FundingFailure;

// SIGNING
export interface SignatureSuccess {
  type: 'WALLET.SIGNATURE.SUCCESS';
  signedState: SignedState;
}
export const signatureSuccess = (signedState: SignedState): SignatureSuccess => ({
  type: 'WALLET.SIGNATURE.SUCCESS',
  signedState,
});

export interface SignatureFailure {
  type: 'WALLET.SIGNATURE.FAILURE';
  error: any; // TODO: This should be typed when we settle on the errors we return
}
export const signatureFailure = (error): SignatureFailure => ({
  type: 'WALLET.SIGNATURE.FAILURE',
  error,
});

export type SignatureResponse = SignatureFailure | SignatureSuccess;

// VALIDATION/STORAGE
export interface ValidateAndSaveSuccess {
  type: 'WALLET.STORE.SUCCESS';
}
export const validateAndSaveSuccess = (): ValidateAndSaveSuccess => ({
  type: 'WALLET.STORE.SUCCESS',
});

export interface ValidateAndSaveFailure {
  type: 'WALLET.STORE.FAILURE';
  error: any; // TODO:
}
export const validateAndSaveFailure = (error): ValidateAndSaveFailure => ({
  type: 'WALLET.STORE.FAILURE',
  error, // TODO: This should be typed when we settle on the errors we return
});

export type ValidateAndSaveResponse = ValidateAndSaveSuccess | ValidateAndSaveFailure;

// INITIALIZATION
// ==============
/**
 * @ignore
 */
export const INITIALIZATION_SUCCESS = 'WALLET.INITIALIZATION.SUCCESS';
/**
 * @ignore
 */
export const INITIALIZATION_FAILURE = 'WALLET.INITIALIZATION.FAILURE';

/**
 * @ignore
 */
export const initializationSuccess = (address: string) => ({
  type: INITIALIZATION_SUCCESS as typeof INITIALIZATION_SUCCESS,
  address,
});
/**
 * @ignore
 */
export const initializationFailure = (message: string) => ({
  type: INITIALIZATION_FAILURE as typeof INITIALIZATION_FAILURE,
  message,
});
/**
 * @ignore
 */
export type InitializationSuccess = ReturnType<typeof initializationSuccess>;

// CONCLUDE
// ==============

/**
 * The event type when the opponent concludes the game.
 */
export const OPPONENT_CONCLUDED = 'WALLET.CONCLUDE.OPPONENT';

/**
 * @ignore
 */
export const opponentConcluded = () => ({
  type: OPPONENT_CONCLUDED as typeof OPPONENT_CONCLUDED,
});

/**
 * The event emitted when a conclude succeeds.
 */
export type OpponentConcluded = ReturnType<typeof opponentConcluded>;

/**
 * The event type when the game successfully concludes.
 */
export const CONCLUDE_SUCCESS = 'WALLET.CONCLUDE.SUCCESS';
/**
 * The event type when the game conclusion fails.
 */
export const CONCLUDE_FAILURE = 'WALLET.CONCLUDE.FAILURE';
/**
 * @ignore
 */
export const concludeSuccess = () => ({
  type: CONCLUDE_SUCCESS as typeof CONCLUDE_SUCCESS,
});
/**
 * @ignore
 */
export const concludeFailure = (reason: 'UserDeclined' | 'Other', error?: string) => ({
  type: CONCLUDE_FAILURE as typeof CONCLUDE_FAILURE,
  reason,
  error,
});
/**
 * The event emitted when a conclude succeeds.
 */
export type ConcludeSuccess = ReturnType<typeof concludeSuccess>;
/**
 * The event emitted when a conclude fails.
 */
export type ConcludeFailure = ReturnType<typeof concludeFailure>;

// DISPLAY
/**
 * @ignore
 */
export const SHOW_WALLET = 'WALLET.DISPLAY.SHOW_WALLET';
/**
 * @ignore
 */
export const showWallet = () => ({
  type: SHOW_WALLET as typeof SHOW_WALLET,
});
/**
 * @ignore
 */
export type ShowWallet = ReturnType<typeof showWallet>;

/**
 * @ignore
 */
export const HIDE_WALLET = 'WALLET.DISPLAY.HIDE_WALLET';
/**
 * @ignore
 */
export const hideWallet = () => ({
  type: HIDE_WALLET as typeof HIDE_WALLET,
});
/**
 * @ignore
 */
export type HideWallet = ReturnType<typeof hideWallet>;

// WALLET-TO-WALLET COMMUNICATION
// =========
/**
 * The type of event when a message relay to the opponent's wallet is requested.
 */
export const MESSAGE_RELAY_REQUESTED = 'WALLET.MESSAGING.MESSAGE_RELAY_REQUESTED';
/**
 * @ignore
 */
export const messageRelayRequested = (to: string, messagePayload: any) => ({
  type: MESSAGE_RELAY_REQUESTED as typeof MESSAGE_RELAY_REQUESTED,
  to,
  messagePayload,
});

/**
 * The event emitted when the wallet requests a message be relayed to the opponent's wallet.
 */
export type MessageRelayRequested = ReturnType<typeof messageRelayRequested>;

/**
 * The type for events where a challenge position is received from the wallet.
 */
export const CHALLENGE_STATE_RECEIVED = 'WALLET.MESSAGING.CHALLENGE_STATE_RECEIVED';
/**
 * @ignore
 */
export const challengeStateReceived = (signedState: SignedState) => ({
  type: CHALLENGE_STATE_RECEIVED as typeof CHALLENGE_STATE_RECEIVED,
  signedState,
});
/**
 * The event emitted when the wallet has received a challenge position.
 */
export type ChallengeStateReceived = ReturnType<typeof challengeStateReceived>;

/**
 * The event type when a user rejects a challenge.
 */
export const CHALLENGE_REJECTED = 'WALLET.CHALLENGING.CHALLENGE_REJECTED';
/**
 * @ignore
 */
export const challengeRejected = reason => ({
  type: CHALLENGE_REJECTED as typeof CHALLENGE_REJECTED,
  reason,
});
/**
 * The event emitted when a user rejects a challenge.
 */
export type ChallengeRejected = ReturnType<typeof challengeRejected>;
/**
 * The event type when a challenge response is requested from the application.
 */
export const CHALLENGE_RESPONSE_REQUESTED = 'WALLET.CHALLENGING.CHALLENGE_RESPONSE_REQUESTED';
/**
 * @ignore
 */
export const challengeResponseRequested = (channelId: string) => ({
  type: CHALLENGE_RESPONSE_REQUESTED as typeof CHALLENGE_RESPONSE_REQUESTED,
  channelId,
});
/**
 * The event emitted when a response to a challenge is requested from the application.
 */
export type ChallengeResponseRequested = ReturnType<typeof challengeResponseRequested>;
/**
 * The event type when a challenge is over.
 */
export const CHALLENGE_COMPLETE = 'WALLET.CHALLENGING.CHALLENGE_COMPLETE';
/**
 * @ignore
 */
export const challengeComplete = () => ({
  type: CHALLENGE_COMPLETE as typeof CHALLENGE_COMPLETE,
});
/**
 * The event emitted when the challenge is over.
 */
export type ChallengeComplete = ReturnType<typeof challengeComplete>;

/**
 * @ignore
 */
export type DisplayAction = ShowWallet | HideWallet;

// TODO: This could live exclusively in the wallet
export type WalletEvent =
  | ChallengeStateReceived
  | ChallengeComplete
  | ChallengeRejected
  | ChallengeResponseRequested
  | OpponentConcluded
  | ConcludeFailure
  | ConcludeSuccess
  | FundingFailure
  | FundingSuccess
  | InitializationSuccess
  | MessageRelayRequested
  | SignatureResponse
  | ValidateAndSaveResponse;

export type WalletEventType = WalletEvent['type'];
