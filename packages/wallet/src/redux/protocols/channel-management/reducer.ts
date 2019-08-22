import { SharedData } from '../../state';
import { ProtocolStateWithSharedData } from '..';
import * as states from './states';
import { isChannelManagementAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import {
  getOurAddress,
  getOpponentAddress,
  getOurAllocation,
  getOpponentAllocation,
  getOurOpenHubChannels,
  showWallet,
  hideWallet,
  getAllocationTotal,
  getOurOpenApplicationChannels,
  getTargetOfLedgerFunding,
  getFundingChannelId,
} from '../reducer-helpers';
import { WalletAction } from '../../actions';

const mapToDisplayChannel = (channelId: string, sharedData: SharedData): states.DisplayChannel => {
  const fundedBy = getFundingChannelId(channelId, sharedData);
  const fundingChannel = getTargetOfLedgerFunding(channelId, sharedData);
  return {
    channelId,
    ourAddress: getOurAddress(channelId, sharedData),
    opponentAddress: getOpponentAddress(channelId, sharedData),
    ourAmount: getOurAllocation(channelId, sharedData),
    opponentAmount: getOpponentAllocation(channelId, sharedData),
    channelAmount: getAllocationTotal(channelId, sharedData),
    fundingChannel: fundingChannel === channelId ? '' : fundingChannel,
    fundedBy,
  };
};
export const initialize = ({
  processId,
  sharedData,
}: {
  processId: string;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.ChannelManagementState> => {
  const ledgerChannels = getOurOpenHubChannels(sharedData).map(c =>
    mapToDisplayChannel(c, sharedData),
  );

  const applicationChannels = getOurOpenApplicationChannels(sharedData).map(c =>
    mapToDisplayChannel(c, sharedData),
  );
  return {
    protocolState: states.displayChannels({ processId, ledgerChannels, applicationChannels }),
    sharedData: showWallet(sharedData),
  };
};

export const channelManagementReducer = (
  protocolState: states.NonTerminalChannelManagementState,
  sharedData: SharedData,
  action: WalletAction,
): ProtocolStateWithSharedData<states.ChannelManagementState> => {
  if (!isChannelManagementAction(action)) {
    console.warn(`Expected channel management action, received ${action.type} instead`);
    return { protocolState, sharedData };
  }
  switch (protocolState.type) {
    case 'ChannelManagement.DisplayChannels':
      switch (action.type) {
        case 'WALLET.CHANNEL_MANAGEMENT.CLOSE_CHANNEL_MANAGEMENT':
          return { protocolState: states.success({}), sharedData: hideWallet(sharedData) };
        default:
          console.warn(
            `Received on channel management action ${action.type} in channel management protocol`,
          );
          return { protocolState, sharedData };
      }
    default:
      return unreachable(protocolState.type);
  }
};
