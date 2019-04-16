import { SharedData, ProtocolStateWithSharedData } from '..';
import * as states from './states';
import { WithdrawalAction } from './actions';

export function initialize(
  withdrawalAmount: string,
  processId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.WithdrawalState> {
  return {
    protocolState: states.waitForApproval({ withdrawalAmount, processId }),
    sharedData,
  };
}

export function withdrawalReducer(
  protocolState: states.WithdrawalState,
  sharedData: SharedData,
  action: WithdrawalAction,
): ProtocolStateWithSharedData<states.WithdrawalState> {
  return { protocolState, sharedData };
}
