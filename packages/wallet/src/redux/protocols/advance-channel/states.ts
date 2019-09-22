import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';
import { ProtocolLocator } from '../../../communication';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';

// -------
// States
// -------
export enum StateType {
  PreFunding,
  PostFunding,
  Concluding,
}
export type AdvanceChannelType = AdvanceChannelState['type'];

interface BaseState {
  processId: string;
  stateType: StateType;
  protocolLocator: ProtocolLocator;
}

export interface ChannelUnknown extends BaseState {
  type: 'AdvanceChannel.ChannelUnknown';
  outcome: Outcome;
  participants: string[];
  chainId: string;
  appData: string;
  privateKey: string;
  clearedToSend: boolean;
  ourAddress: string;
  appDefinition: string;
  challengeDuration: string;
}

export interface NotSafeToSend extends BaseState {
  type: 'AdvanceChannel.NotSafeToSend';
  channelId: string;
  clearedToSend: boolean;
}

export interface CommitmentSent extends BaseState {
  type: 'AdvanceChannel.CommitmentSent';
  channelId: string;
}

export interface Success {
  type: 'AdvanceChannel.Success';
  stateType: StateType;
  channelId: string;
}

export interface Failure {
  type: 'AdvanceChannel.Failure';
}

// ------------
// Constructors
// ------------

const base: StateConstructor<BaseState> = params => {
  const { processId, protocolLocator, stateType } = params;
  return {
    processId,
    stateType,
    protocolLocator,
  };
};

export const channelUnknown: StateConstructor<ChannelUnknown> = params => {
  const {
    privateKey,
    outcome,
    participants,
    chainId,
    appData,
    clearedToSend,
    ourAddress,
    appDefinition,
    challengeDuration,
  } = params;
  return {
    ...base(params),
    type: 'AdvanceChannel.ChannelUnknown',
    privateKey,
    outcome,
    participants,
    chainId,
    appData,
    clearedToSend,
    ourAddress,
    appDefinition,
    challengeDuration,
  };
};

export const notSafeToSend: StateConstructor<NotSafeToSend> = params => {
  return {
    ...base(params),
    type: 'AdvanceChannel.NotSafeToSend',
    channelId: params.channelId,
    clearedToSend: params.clearedToSend,
  };
};

export const stateSent: StateConstructor<CommitmentSent> = params => {
  const { channelId } = params;
  return {
    ...base(params),
    type: 'AdvanceChannel.CommitmentSent',
    channelId,
  };
};

export const success: StateConstructor<Success> = params => {
  const { stateType, channelId } = params;
  return {
    type: 'AdvanceChannel.Success',
    stateType,
    channelId,
  };
};

export const failure: StateConstructor<Failure> = () => {
  return {
    type: 'AdvanceChannel.Failure',
  };
};

// -------
// Unions and Guards
// -------

export type NonTerminalAdvanceChannelState = ChannelUnknown | NotSafeToSend | CommitmentSent;

export type AdvanceChannelState = NonTerminalAdvanceChannelState | Success | Failure;

export type AdvanceChannelStateType = AdvanceChannelState['type'];

export function isTerminal(state: AdvanceChannelState): state is Failure | Success {
  return state.type === 'AdvanceChannel.Failure' || state.type === 'AdvanceChannel.Success';
}

export function isAdvanceChannelState(state: ProtocolState): state is AdvanceChannelState {
  return (
    state.type === 'AdvanceChannel.ChannelUnknown' ||
    state.type === 'AdvanceChannel.NotSafeToSend' ||
    state.type === 'AdvanceChannel.CommitmentSent' ||
    state.type === 'AdvanceChannel.Failure' ||
    state.type === 'AdvanceChannel.Success'
  );
}

export function isSuccess(state: AdvanceChannelState): state is Success {
  return state.type === 'AdvanceChannel.Success';
}

export function isFailure(state: AdvanceChannelState): state is Failure {
  return state.type === 'AdvanceChannel.Failure';
}
