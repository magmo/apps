import { SharedData } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData } from '..';
import { ExistingChannelFundingAction } from './actions';

export const initialize = (processId: string,
  channelId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData): ProtocolStateWithSharedData<states.ExistingChannelFundingState> {
  return {sharedData, protocolState: states.success({})};
  }

  export const existingChannelFundingReducer =(
    protocolState: states.ExistingChannelFundingState,
    sharedData:SharedData,
    action: ExistingChannelFundingAction
  ): ProtocolStateWithSharedData<states.ExistingChannelFundingState>{
    return {protocolState,sharedData};
  }