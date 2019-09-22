import { SignedState } from 'nitro-protocol';
import { ActionConstructor } from '../utils';
import { StatesReceived } from '../../communication';

export interface ValidationComplete {
  type: 'WALLET.CHANNEL.VALIDATION_COMPLETE';
  valid: boolean;
  signedStates: SignedState[];
}

export const validationComplete: ActionConstructor<ValidationComplete> = p => {
  return { ...p, type: 'WALLET.CHANNEL.VALIDATION_COMPLETE' };
};

export type ChannelAction = StatesReceived | ValidationComplete;
