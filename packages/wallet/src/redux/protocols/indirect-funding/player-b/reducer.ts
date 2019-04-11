import * as states from './state';

import * as actions from '../../../actions';

import { unreachable } from '../../../../utils/reducer-utils';
import { channelID } from 'fmg-core/lib/channel';

import {
  appChannelIsWaitingForFunding,
  receiveOpponentLedgerCommitment,
  safeToSendLedgerUpdate,
  createAndSendUpdateCommitment,
  ledgerChannelFundsAppChannel,
  confirmFundingForChannel,
  receiveLedgerCommitment,
  updateDirectFundingStatus,
  requestDirectFunding,
} from '../reducer-helpers';
import { ProtocolStateWithSharedData, SharedData } from '../../';
import { FundingAction, isfundingAction } from '../../direct-funding/actions';
import { CHANNEL_FUNDED } from '../../direct-funding/state';

export function playerBReducer(
  protocolState: states.PlayerBState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> {
  switch (protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApproval(protocolState, sharedData, action);
    case states.WAIT_FOR_PRE_FUND_SETUP_0:
      return waitForPreFundSetup0(protocolState, sharedData, action);
    case states.WAIT_FOR_DIRECT_FUNDING:
      return waitForDirectFunding(protocolState, sharedData, action);
    case states.WAIT_FOR_POST_FUND_SETUP_0:
      return waitForPostFundSetup0(protocolState, sharedData, action);
    case states.WAIT_FOR_LEDGER_UPDATE_0:
      return waitForLedgerUpdate0(protocolState, sharedData, action);
    case states.WAIT_FOR_CONSENSUS:
      return waitForConsensus(protocolState, sharedData, action);
    default:
      return unreachable(protocolState);
  }
}

const waitForApproval = (
  protocolState: states.WaitForApproval,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.indirectFunding.playerB.STRATEGY_PROPOSED:
      return { protocolState: states.waitForPreFundSetup0(protocolState), sharedData };
    default:
      return { protocolState, sharedData };
  }
};

const waitForPreFundSetup0 = (
  protocolState: states.WaitForPreFundSetup0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      const newSharedData = receiveOpponentLedgerCommitment(sharedData, commitment, signature);
      const ledgerId = channelID(commitment.channel);
      if (appChannelIsWaitingForFunding(newSharedData, protocolState.channelId)) {
        return startDirectFunding(protocolState, ledgerId, newSharedData);
      }

      return { protocolState, sharedData: newSharedData };
    default:
      return { protocolState, sharedData };
  }
};

const waitForDirectFunding = (
  protocolState: states.WaitForDirectFunding,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  if (!isfundingAction(action)) {
    return { sharedData, protocolState };
  } else {
    const updatedStateAndSharedData = updateStateWithDirectFundingAction(
      action,
      protocolState,
      sharedData,
    );

    let newSharedData = updatedStateAndSharedData.sharedData;
    let newProtocolState: states.PlayerBState = updatedStateAndSharedData.protocolState;

    if (directFundingIsComplete(protocolState)) {
      newSharedData = confirmFundingForChannel(sharedData, protocolState.ledgerId);
      newProtocolState = states.waitForPostFundSetup0(updatedStateAndSharedData.protocolState);
      return { protocolState: newProtocolState, sharedData: newSharedData };
    } else {
      return { sharedData, protocolState: newProtocolState };
    }
  }
};

const waitForPostFundSetup0 = (
  protocolState: states.WaitForPostFundSetup0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      // The ledger channel is in the `FUNDING` stage, so we have to use the
      // `receiveLedgerCommitment` helper and not the `receiveOpponentLedgerCommitment`
      // helper
      // Note that the channelStateReducer currently sends the post fund setup message
      const newSharedData = receiveLedgerCommitment(sharedData, action);
      const newProtocolState = states.waitForLedgerUpdate0(protocolState);
      return { protocolState: newProtocolState, sharedData: newSharedData };
    default:
      return { protocolState, sharedData };
  }
};

const waitForLedgerUpdate0 = (
  protocolState: states.WaitForLedgerUpdate0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
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
      return { protocolState, sharedData };
  }
};
const waitForConsensus = (
  protocolState: states.WaitForConsensus,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerBState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
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
      return { protocolState, sharedData };
  }
};

const updateStateWithDirectFundingAction = (
  action: FundingAction,
  protocolState: states.WaitForDirectFunding,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.WaitForDirectFunding> => {
  const directFundingResult = updateDirectFundingStatus(
    protocolState.directFundingState,
    sharedData,
    action,
  );
  const newSharedData = directFundingResult.sharedData;
  const newProtocolState: states.PlayerBState = states.waitForDirectFunding({
    ...protocolState,
    directFundingState: directFundingResult.protocolState,
  });
  return { protocolState: newProtocolState, sharedData: newSharedData };
};

const startDirectFunding = (
  protocolState: states.WaitForPreFundSetup0,
  ledgerId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.WaitForDirectFunding> => {
  const {
    protocolState: directFundingProtocolState,
    sharedData: updatedSharedData,
  } = requestDirectFunding(sharedData, ledgerId);
  const newProtocolState = states.waitForDirectFunding({
    ...protocolState,
    ledgerId,
    directFundingState: directFundingProtocolState,
  });
  return { protocolState: newProtocolState, sharedData: updatedSharedData };
};

const directFundingIsComplete = (protocolState: states.WaitForDirectFunding): boolean => {
  return protocolState.directFundingState.channelFundingStatus === CHANNEL_FUNDED;
};
