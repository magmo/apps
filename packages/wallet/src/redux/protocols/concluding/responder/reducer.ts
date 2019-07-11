import * as states from './states';
import {
  ResponderConcludingState as CState,
  ResponderNonTerminalState as NonTerminalCState,
  approveConcluding,
  acknowledgeFailure,
  decideDefund,
} from './states';
import { unreachable } from '../../../../utils/reducer-utils';
import {
  SharedData,
  getChannel,
  setChannelStore,
  queueMessage,
  checkAndStore,
} from '../../../state';
import { composeConcludeCommitment } from '../../../../utils/commitment-utils';
import { ourTurn, getLastCommitment } from '../../../channel-store';
import * as selectors from '../../../selectors';
import * as channelStoreReducer from '../../../channel-store/reducer';
import { theirAddress } from '../../../channel-store';
import { sendCommitmentReceived, sendKeepLedgerChannelApproved } from '../../../../communication';
import {
  showWallet,
  hideWallet,
  sendConcludeFailure,
  sendOpponentConcluded,
} from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { isConcludingResponderAction } from './actions';
import { getChannelId, SignedCommitment } from '../../../../domain';
import { failure, success } from '../states';
import { ProtocolStateWithSharedData } from '../..';
import * as helpers from '../../reducer-helpers';
import { initializeConsensusUpdate, consensusUpdateReducer } from '../../consensus-update/';
import { ConsensusUpdateAction, isConsensusUpdateAction } from '../../consensus-update/actions';
export type ReturnVal = ProtocolStateWithSharedData<states.ResponderConcludingState>;
export type Storage = SharedData;

export function responderConcludingReducer(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (isConsensusUpdateAction(action)) {
    return handleLedgerUpdateAction(protocolState, sharedData, action);
  }
  if (!isConcludingResponderAction(action)) {
    return { protocolState, sharedData };
  }

  switch (action.type) {
    case 'WALLET.CONCLUDING.KEEP_LEDGER_CHANNEL_APPROVED':
      return keepLedgerChannelApproved(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_APPROVED':
      return concludeApproved(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN':
      return defundChosen(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED':
      return acknowledged(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.KEEP_OPEN_CHOSEN':
      return keepOpenChosen(protocolState, sharedData);
    default:
      return unreachable(action);
  }
}

export function initialize(
  signedCommitment: SignedCommitment,
  processId: string,
  sharedData: Storage,
): ReturnVal {
  const channelId = getChannelId(signedCommitment.commitment);
  let channelState = getChannel(sharedData, channelId);
  if (!channelState) {
    return {
      protocolState: acknowledgeFailure({
        processId,
        channelId,
        reason: 'ChannelDoesntExist',
      }),
      sharedData: showWallet(sharedData),
    };
  }

  const checkResult = checkAndStore(sharedData, signedCommitment);
  if (!checkResult.isSuccess) {
    throw new Error('Concluding responding protocol, unable to validate or store commitment');
  }
  const updatedStorage = checkResult.store;
  channelState = getChannel(updatedStorage, channelId);
  if (channelState && ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return {
      protocolState: approveConcluding({ channelId, processId }),
      sharedData: showWallet(sendOpponentConcluded(updatedStorage)),
    };
  } else {
    return {
      protocolState: acknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }),
      sharedData: showWallet(sharedData),
    };
  }
}

function handleLedgerUpdateAction(
  protocolState: NonTerminalCState,
  sharedData: Storage,
  action: ConsensusUpdateAction,
): ReturnVal {
  if (protocolState.type !== 'ConcludingResponder.WaitForLedgerUpdate') {
    return { protocolState, sharedData };
  }
  const { protocolState: consensusUpdateState, sharedData: newSharedData } = consensusUpdateReducer(
    protocolState.consensusUpdateState,
    sharedData,
    action,
  );
  if (consensusUpdateState.type === 'ConsensusUpdate.Success') {
    return {
      protocolState: states.acknowledgeSuccess(protocolState),
      sharedData: newSharedData,
    };
  } else if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.acknowledgeFailure({
        ...protocolState,
        reason: 'LedgerUpdateFailed',
      }),
      sharedData: newSharedData,
    };
  } else {
    return {
      protocolState: states.waitForLedgerUpdate({
        ...protocolState,
        consensusUpdateState,
      }),
      sharedData: newSharedData,
    };
  }
}

function concludeApproved(protocolState: NonTerminalCState, sharedData: Storage): ReturnVal {
  if (protocolState.type !== 'ConcludingResponder.ApproveConcluding') {
    return { protocolState, sharedData };
  }

  const channelState = getChannel(sharedData, protocolState.channelId);

  if (channelState) {
    const sharedDataWithOwnCommitment = createAndSendConcludeCommitment(
      sharedData,
      protocolState.processId,
      protocolState.channelId,
    );
    return {
      protocolState: decideDefund({ ...protocolState, opponentHasSelected: false }),
      sharedData: sharedDataWithOwnCommitment,
    };
  } else {
    return { protocolState, sharedData };
  }
}

function keepOpenChosen(protocolState: NonTerminalCState, sharedData: Storage): ReturnVal {
  if (protocolState.type !== 'ConcludingResponder.DecideDefund') {
    return { protocolState, sharedData };
  }
  const ledgerId = helpers.getFundingChannelId(protocolState.channelId, sharedData);
  const appChannel = getChannel(sharedData, protocolState.channelId);
  if (!appChannel) {
    throw new Error(`Could not find channel ${protocolState.channelId}`);
  }
  sharedData = queueMessage(
    sharedData,
    sendKeepLedgerChannelApproved(theirAddress(appChannel), protocolState.processId),
  );

  if (protocolState.opponentHasSelected) {
    const latestCommitment = getLastCommitment(appChannel);
    const {
      protocolState: consensusUpdateState,
      sharedData: newSharedData,
    } = initializeConsensusUpdate(
      protocolState.processId,
      ledgerId,
      true, // TODO: Use cleared to send in concluding protocol
      latestCommitment.allocation,
      latestCommitment.destination,
      sharedData,
    );
    return {
      protocolState: states.waitForLedgerUpdate({ ...protocolState, consensusUpdateState }),
      sharedData: newSharedData,
    };
  } else {
    return {
      protocolState: states.waitForOpponentSelection(protocolState),
      sharedData,
    };
  }
}

function defundChosen(protocolState: NonTerminalCState, sharedData: Storage): ReturnVal {
  if (protocolState.type !== 'ConcludingResponder.DecideDefund') {
    return { protocolState, sharedData };
  }

  return {
    protocolState: success({}),
    sharedData,
  };
}

function acknowledged(protocolState: CState, sharedData: Storage): ReturnVal {
  switch (protocolState.type) {
    case 'ConcludingResponder.AcknowledgeSuccess':
      return {
        protocolState: success({}),
        sharedData: hideWallet(sharedData),
      };
    case 'ConcludingResponder.AcknowledgeFailure':
      return {
        protocolState: failure({ reason: protocolState.reason }),
        sharedData: sendConcludeFailure(hideWallet(sharedData), 'Other'),
      };
    default:
      return { protocolState, sharedData };
  }
}
function keepLedgerChannelApproved(protocolState: CState, sharedData: Storage) {
  switch (protocolState.type) {
    case 'ConcludingResponder.DecideDefund':
      return {
        protocolState: { ...protocolState, opponentSelectedKeepLedgerChannel: true },
        sharedData,
      };
    case 'ConcludingResponder.WaitForOpponentSelection':
      const ledgerId = helpers.getFundingChannelId(protocolState.channelId, sharedData);
      const appChannel = getChannel(sharedData, protocolState.channelId);
      if (!appChannel) {
        throw new Error(`Could not find channel ${protocolState.channelId}`);
      }
      const latestCommitment = getLastCommitment(appChannel);
      const {
        protocolState: consensusUpdateState,
        sharedData: newSharedData,
      } = initializeConsensusUpdate(
        protocolState.processId,
        ledgerId,
        true, // TODO: Use cleared to send in concluding protocol
        latestCommitment.allocation,
        latestCommitment.destination,
        sharedData,
      );
      return {
        protocolState: states.waitForLedgerUpdate({ ...protocolState, consensusUpdateState }),
        sharedData: newSharedData,
      };
  }
  return { protocolState, sharedData };
}

//  Helpers
const createAndSendConcludeCommitment = (
  sharedData: SharedData,
  processId: string,
  channelId: string,
): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const commitment = composeConcludeCommitment(channelState);

  const signResult = channelStoreReducer.signAndStore(sharedData.channelStore, commitment);
  if (signResult.isSuccess) {
    const sharedDataWithOwnCommitment = setChannelStore(sharedData, signResult.store);
    const messageRelay = sendCommitmentReceived(
      theirAddress(channelState),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    return queueMessage(sharedDataWithOwnCommitment, messageRelay);
  } else {
    throw new Error(
      `Direct funding protocol, createAndSendPostFundCommitment, unable to sign commitment: ${
        signResult.reason
      }`,
    );
  }
};
