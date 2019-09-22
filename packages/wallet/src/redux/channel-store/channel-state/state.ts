import { ChannelStorage, SignedState } from 'nitro-protocol';
import { State } from 'nitro-protocol/lib/src/contract/state';
import _ from 'lodash';
import { StateConstructor } from '../../utils';
import { Channel } from 'nitro-protocol/lib/src/contract/channel';

export interface BaseChannelState extends ChannelStorage {
  challengeState?: State; // TODO: Should this be a signed state to be consistent?
  finalizesAt?: string;
  turnNumRecord: number;
  signedStates: SignedState[];

  channel: Channel;
}
export interface WaitForState extends BaseChannelState {
  type: 'Channel.WaitForState';
}

export interface WaitForValidation extends BaseChannelState {
  type: 'Channel.WaitForValidation';
  statesBeingValidated: SignedState[];
}

export type ChannelState = WaitForState | WaitForValidation;

export const waitForState: StateConstructor<WaitForState> = p => {
  return { ...cloneState(p), type: 'Channel.WaitForState' };
};

export const waitForValidation: StateConstructor<WaitForValidation> = p => {
  return { ...cloneState(p), type: 'Channel.WaitForValidation' };
};

function cloneState<T extends BaseChannelState>(channelState: T): T {
  return _.cloneDeep(channelState);
}
