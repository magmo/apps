import * as states from './states';
import { SharedData } from '../../state';
import { ProtocolReducer } from '..';
import { WalletAction } from '../../actions';
import { isVirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';

export const reducer: ProtocolReducer<states.VirtualFundingState> = (
  protocolState: states.NonTerminalVirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isVirtualFundingAction(action)) {
    console.error('Invalid action: expected WALLET.COMMON.COMMITMENTS_RECEIVED');
    return { protocolState, sharedData };
  }

  switch (protocolState.type) {
    case 'VirtualFunding.WaitForChannelPreparation': {
      return waitForChannelPreparationReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForGuarantorFunding': {
      return waitForGuarantorFundingReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForApplicationFunding': {
      return waitForApplicationFundingReducer(protocolState, sharedData, action);
    }
    default:
      return unreachable(protocolState);
  }
};

function waitForChannelPreparationReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}

function waitForGuarantorFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}

function waitForApplicationFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}
