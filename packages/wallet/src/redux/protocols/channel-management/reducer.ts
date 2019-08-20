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
  getOpenLedgerChannels,
  isLedgerChannelBeingUsedForFunding,
  showWallet,
  hideWallet,
  isTwoPlayerChannel,
} from '../reducer-helpers';
import { WalletAction } from '../../actions';

export const initialize = ({
  processId,
  sharedData,
}: {
  processId: string;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.ChannelManagementState> => {
  const openLedgerChannels = getOpenLedgerChannels(sharedData);
  const twoPlayerChannels = openLedgerChannels.filter(channelId =>
    isTwoPlayerChannel(channelId, sharedData),
  );

  const displayChannels: states.DisplayChannel[] = twoPlayerChannels.map(channelId => {
    return {
      channelId,
      ourAddress: getOurAddress(channelId, sharedData),
      opponentAddress: getOpponentAddress(channelId, sharedData),
      ourAmount: getOurAllocation(channelId, sharedData),
      opponentAmount: getOpponentAllocation(channelId, sharedData),
      inUse: isLedgerChannelBeingUsedForFunding(channelId, sharedData),
    };
  });

  return {
    protocolState: states.displayChannels({ processId, displayChannels }),
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
