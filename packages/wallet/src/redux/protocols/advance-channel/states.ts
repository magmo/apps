import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';

// -------
// States
// -------

export type AdvanceChannelType = AdvanceChannelState['type'];

interface BaseState {
  processId: string;
  ourIndex: number;
}

export interface ChannelUnknown extends BaseState {
  type: 'AdvanceChannel.ChannelUnknown';
  privateKey: string;
}

export interface NotSafeToSend extends BaseState {
  type: 'AdvanceChannel.NotSafeToSend';
  channelId: string;
}

export interface CommitmentSent extends BaseState {
  type: 'AdvanceChannel.CommitmentSent';
  channelId: string;
}

export interface Success {
  type: 'AdvanceChannel.Success';
}

export interface Failure {
  type: 'AdvanceChannel.Failure';
}

// ------------
// Constructors
// ------------

const base: StateConstructor<BaseState> = params => {
  const { processId, channelId, ourIndex } = params;
  return {
    processId,
    channelId,
    ourIndex,
  };
};

export const channelUnknown: StateConstructor<ChannelUnknown> = params => {
  const { privateKey } = params;
  return {
    ...base(params),
    type: 'AdvanceChannel.ChannelUnknown',
    privateKey,
  };
};

export const notSafeToSend: StateConstructor<NotSafeToSend> = params => {
  return {
    ...base(params),
    type: 'AdvanceChannel.NotSafeToSend',
    channelId: params.channelId,
  };
};

export const commitmentSent: StateConstructor<CommitmentSent> = params => {
  const { transactionSubmissionState, channelId } = params;
  return {
    ...base(params),
    type: 'AdvanceChannel.CommitmentSent',
    transactionSubmissionState,
    channelId,
  };
};

export const success: StateConstructor<Success> = params => {
  return {
    type: 'AdvanceChannel.Success',
  };
};

export const failure: StateConstructor<Failure> = params => {
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
