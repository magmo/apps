import { SharedData } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import * as actions from './actions';
export function initialize(
  sharedData: SharedData,
  channelId: string,
  ledgerId: string,
  processId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
): ProtocolStateWithSharedData<states.LedgerTopUpState> {
  return {
    protocolState: states.success({}),
    sharedData,
  };
}

export const ledgerTopUpReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.LedgerTopUpState,
  sharedData: SharedData,
  action: actions.LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  return { protocolState, sharedData };
};
