import { SharedIndirectFundingState, INDIRECT_FUNDING } from '../shared/state';
export { SharedIndirectFundingState, INDIRECT_FUNDING };

// ChannelFundingStatus
export const FUNDER_CHANNEL_DOES_NOT_EXIST = 'FUNDER_CHANNEL_DOES_NOT_EXIST';
export const FUNDER_CHANNEL_EXISTS = 'FUNDER_CHANNEL_EXISTS';
export const CHANNEL_FUNDED = 'CHANNEL_FUNDED';

// Funding status
export type ChannelFundingStatus =
  | typeof FUNDER_CHANNEL_DOES_NOT_EXIST
  | typeof FUNDER_CHANNEL_EXISTS
  | typeof CHANNEL_FUNDED;

export interface BaseIndirectFundingState extends SharedIndirectFundingState {
  channelFundingStatus: ChannelFundingStatus;
}

export interface FunderChannelDoesNotExist extends BaseIndirectFundingState {
  channelFundingStatus: typeof FUNDER_CHANNEL_DOES_NOT_EXIST;
}

export interface FunderChannelExists extends BaseIndirectFundingState {
  channelFundingStatus: typeof FUNDER_CHANNEL_EXISTS;
  funderChannelId: string;
}

export interface ChannelFunded extends BaseIndirectFundingState {
  channelFundingStatus: typeof CHANNEL_FUNDED;
  funderChannelId: string;
}

export type IndirectFundingState = FunderChannelDoesNotExist | FunderChannelExists | ChannelFunded;

// type guards
const guardGenerator = <T extends IndirectFundingState>(type) => (
  state: IndirectFundingState,
): state is T => {
  return state.channelFundingStatus === type;
};

export const stateIsFunderChannelDoesNotExist = guardGenerator<FunderChannelDoesNotExist>(
  FUNDER_CHANNEL_DOES_NOT_EXIST,
);

export const stateIsFunderChannelExists = guardGenerator<FunderChannelExists>(
  FUNDER_CHANNEL_EXISTS,
);

export const stateIsChannelFunded = guardGenerator<ChannelFunded>(CHANNEL_FUNDED);

// constructors
export function sharedIndirectFundingState<T extends SharedIndirectFundingState>(
  params: T,
): SharedIndirectFundingState {
  const {
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    channelFundingStatus,
  } = params;
  return {
    fundingType: INDIRECT_FUNDING,
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    channelFundingStatus,
  };
}

export function funderChannelDoesNotExist<T extends BaseIndirectFundingState>(
  params: T,
): FunderChannelDoesNotExist {
  return {
    ...sharedIndirectFundingState(params),
    channelFundingStatus: FUNDER_CHANNEL_DOES_NOT_EXIST,
  };
}

export function funderChannelExists<T extends BaseIndirectFundingState>(
  params: T,
  funderChannelId: string,
): FunderChannelExists {
  return {
    ...sharedIndirectFundingState(params),
    channelFundingStatus: FUNDER_CHANNEL_EXISTS,
    funderChannelId,
  };
}

export function channelFunded<T extends BaseIndirectFundingState>(
  params: T,
  funderChannelId: string,
): ChannelFunded {
  return {
    ...sharedIndirectFundingState(params),
    channelFundingStatus: CHANNEL_FUNDED,
    funderChannelId,
  };
}
