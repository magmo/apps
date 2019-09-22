import { WalletAction } from '../../actions';
import { ActionConstructor } from '../../utils';
import { DisputeAction, isDisputeAction } from '../dispute';
import { SignedState } from 'nitro-protocol';

// -------
// Actions
// -------
export interface StatesReceived {
  type: 'WALLET.APPLICATION.STATES_RECEIVED';
  processId: string;
  signedStates: SignedState[];
}

export interface ChallengeRequested {
  type: 'WALLET.APPLICATION.CHALLENGE_REQUESTED';
  processId: string;
  channelId: string;
}

export interface ChallengeDetected {
  type: 'WALLET.APPLICATION.CHALLENGE_DETECTED';
  processId: string;
  channelId: string;
  expiresAt: number;
  signedState: SignedState;
}
export interface Concluded {
  type: 'WALLET.APPLICATION.CONCLUDED';
  processId: string;
}

// -------
// Constructors
// -------
export const statesReceived: ActionConstructor<StatesReceived> = p => ({
  ...p,
  type: 'WALLET.APPLICATION.STATES_RECEIVED',
});

export const challengeRequested: ActionConstructor<ChallengeRequested> = p => ({
  ...p,
  type: 'WALLET.APPLICATION.CHALLENGE_REQUESTED',
});

export const challengeDetected: ActionConstructor<ChallengeDetected> = p => ({
  ...p,
  type: 'WALLET.APPLICATION.CHALLENGE_DETECTED',
});

export const concluded: ActionConstructor<Concluded> = p => {
  const { processId } = p;
  return {
    type: 'WALLET.APPLICATION.CONCLUDED',
    processId,
  };
};

// -------
// Unions and Guards
// -------

export type ApplicationAction =
  | StatesReceived
  | ChallengeDetected
  | ChallengeRequested
  | Concluded
  | DisputeAction;

export function isApplicationAction(action: WalletAction): action is ApplicationAction {
  return (
    isDisputeAction(action) ||
    action.type === 'WALLET.APPLICATION.STATES_RECEIVED' ||
    action.type === 'WALLET.APPLICATION.CHALLENGE_DETECTED' ||
    action.type === 'WALLET.APPLICATION.CHALLENGE_REQUESTED' ||
    action.type === 'WALLET.APPLICATION.CONCLUDED'
  );
}
