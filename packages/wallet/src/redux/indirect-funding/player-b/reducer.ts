import * as states from './state';

import * as actions from '../../actions';

import { unreachable } from '../../../utils/reducer-utils';
import { channelID } from 'fmg-core/lib/channel';

import {
  appChannelIsWaitingForFunding,
  receiveOpponentLedgerCommitment,
  safeToSendLedgerUpdate,
  createAndSendUpdateCommitment,
  ledgerChannelFundsAppChannel,
  confirmFundingForChannel,
  receiveLedgerCommitment,
} from '../reducer-helpers';
import { ProtocolStateWithSharedData } from '../../protocols';

export function playerBReducer(
  state: ProtocolStateWithSharedData<states.PlayerBState>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> {
  switch (state.protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApproval(state as ProtocolStateWithSharedData<states.WaitForApproval>, action);
    case states.WAIT_FOR_PRE_FUND_SETUP_0:
      return waitForPreFundSetup0(
        state as ProtocolStateWithSharedData<states.WaitForPreFundSetup0>,
        action,
      );
    case states.WAIT_FOR_DIRECT_FUNDING:
      return state;
    case states.WAIT_FOR_POST_FUND_SETUP_0:
      return waitForPostFundSetup0(
        state as ProtocolStateWithSharedData<states.WaitForPostFundSetup0>,
        action,
      );
    case states.WAIT_FOR_LEDGER_UPDATE_0:
      return waitForLedgerUpdate0(
        state as ProtocolStateWithSharedData<states.WaitForLedgerUpdate0>,
        action,
      );
    case states.WAIT_FOR_CONSENSUS:
      return waitForConsensus(
        state as ProtocolStateWithSharedData<states.WaitForConsensus>,
        action,
      );
    default:
      return unreachable(state.protocolState);
  }
}

const waitForApproval = (
  state: ProtocolStateWithSharedData<states.WaitForApproval>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.indirectFunding.playerB.STRATEGY_PROPOSED:
      const { protocolState, sharedData } = state;
      return { protocolState: states.waitForPreFundSetup0(protocolState), sharedData };
    default:
      return state;
  }
};

const waitForPreFundSetup0 = (
  state: ProtocolStateWithSharedData<states.WaitForPreFundSetup0>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      const { protocolState, sharedData } = state;
      const newSharedData = receiveOpponentLedgerCommitment(sharedData, commitment, signature);
      const ledgerId = channelID(commitment.channel);
      if (appChannelIsWaitingForFunding(newSharedData, protocolState.channelId)) {
        // TODO: start direct funding
      }
      const newProtocolState = states.waitForDirectFunding({ ...protocolState, ledgerId });
      return { protocolState: newProtocolState, sharedData: newSharedData };
    default:
      return state;
  }
};

const waitForPostFundSetup0 = (
  state: ProtocolStateWithSharedData<states.WaitForPostFundSetup0>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { sharedData, protocolState } = state;
      // The ledger channel is in the `FUNDING` stage, so we have to use the
      // `receiveLedgerCommitment` helper and not the `receiveOpponentLedgerCommitment`
      // helper
      // Note that the channelStateReducer currently sends the post fund setup message
      const newSharedData = receiveLedgerCommitment(sharedData, action);
      const newProtocolState = states.waitForLedgerUpdate0(protocolState);
      return { protocolState: newProtocolState, sharedData: newSharedData };
    default:
      return state;
  }
};

const waitForLedgerUpdate0 = (
  state: ProtocolStateWithSharedData<states.WaitForLedgerUpdate0>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { sharedData, protocolState } = state;
      let newSharedData = receiveOpponentLedgerCommitment(
        sharedData,
        action.commitment,
        action.signature,
      );
      if (safeToSendLedgerUpdate(newSharedData, protocolState.ledgerId)) {
        newSharedData = createAndSendUpdateCommitment(
          newSharedData,
          protocolState.channelId,
          protocolState.ledgerId,
        );
        const newProtocolState = states.waitForConsensus(protocolState);
        return { protocolState: newProtocolState, sharedData: newSharedData };
      }
      return { protocolState, sharedData: newSharedData };
    default:
      return state;
  }
};
const waitForConsensus = (
  state: ProtocolStateWithSharedData<states.WaitForConsensus>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { sharedData, protocolState } = state;
      let newSharedData = receiveOpponentLedgerCommitment(
        sharedData,
        action.commitment,
        action.signature,
      );
      if (
        ledgerChannelFundsAppChannel(newSharedData, protocolState.channelId, protocolState.ledgerId)
      ) {
        newSharedData = confirmFundingForChannel(newSharedData, protocolState.channelId);
      }
      return { protocolState, sharedData: newSharedData };
    default:
      return state;
  }
};
