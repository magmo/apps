import {
  InstigatorConcludingState as CState,
  InstigatorNonTerminalState as NonTerminalCState,
  instigatorApproveConcluding,
  instigatorWaitForOpponentConclude,
  instigatorWaitForDefund,
  instigatorAcknowledgeSuccess,
  instigatorAcknowledgeFailure,
  instigatorAcknowledgeConcludeReceived,
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
import { ourTurn } from '../../../channel-store';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';
import { isConcludingAction } from './actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
type Storage = SharedData;
import { isSuccess, isFailure } from '../../defunding/states';
import * as channelStoreReducer from '../../../channel-store/reducer';
import * as selectors from '../../../selectors';
import { showWallet, hideWallet } from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { theirAddress } from '../../../channel-store';
import {
  sendConcludeInstigated,
  COMMITMENT_RECEIVED,
  CommitmentReceived,
} from '../../../../communication';
import { failure, success } from '../state';
import { getChannelId } from '../../../../domain';

export interface ReturnVal {
  state: CState;
  storage: Storage;
}

export function instigatorConcludingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ProtocolAction,
): ReturnVal {
  // TODO: Since a commitment received could be a defundingAction OR
  // a concludingAction we need to check if its the action we're interested in
  // This is a bit awkward, probably a better way of handling this?
  if (action.type === COMMITMENT_RECEIVED) {
    const channelId = getChannelId(action.signedCommitment.commitment);
    if (channelId === state.channelId) {
      return concludeReceived(action, state, storage);
    }
  }
  if (isDefundingAction(action)) {
    return handleDefundingAction(state, storage, action);
  }

  if (!isConcludingAction(action)) {
    return { state, storage };
  }

  switch (action.type) {
    case 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED':
      return concludingCancelled(state, storage);
    case 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED':
      return concludeApproved(state, storage);
    case 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN':
      return defundChosen(state, storage);
    case 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED':
      return acknowledged(state, storage);
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  const channelState = getChannel(storage, channelId);
  if (!channelState) {
    return {
      state: instigatorAcknowledgeFailure({ processId, channelId, reason: 'ChannelDoesntExist' }),
      storage,
    };
  }
  if (ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return {
      state: instigatorApproveConcluding({ channelId, processId }),
      storage: showWallet(storage),
    };
  } else {
    return {
      state: instigatorAcknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }),
      storage,
    };
  }
}

function handleDefundingAction(
  state: NonTerminalCState,
  storage: Storage,
  action: DefundingAction,
): ReturnVal {
  if (state.type !== 'InstigatorWaitForDefund') {
    return { state, storage };
  }
  const defundingState1 = state.defundingState;

  const protocolStateWithSharedData = defundingReducer(defundingState1, storage, action);
  const updatedDefundingState = protocolStateWithSharedData.protocolState;
  storage = protocolStateWithSharedData.sharedData;
  if (isSuccess(updatedDefundingState)) {
    state = instigatorAcknowledgeSuccess(state);
  } else if (isFailure(updatedDefundingState)) {
    state = instigatorAcknowledgeFailure({ ...state, reason: 'DefundFailed' });
  } else {
    state = { ...state, defundingState: updatedDefundingState };
  }
  return { state, storage };
}

function concludingCancelled(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorApproveConcluding') {
    return { state, storage };
  }
  return { state: failure({ reason: 'ConcludeCancelled' }), storage };
}

function concludeApproved(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorApproveConcluding') {
    return { state, storage };
  }

  const channelState = getChannel(storage, state.channelId);

  if (channelState) {
    const sharedDataWithOwnCommitment = createAndSendConcludeCommitment(storage, state.channelId);

    return {
      state: instigatorWaitForOpponentConclude({ ...state }),
      storage: sharedDataWithOwnCommitment,
    };
  } else {
    return { state, storage };
  }
}

function concludeReceived(
  action: CommitmentReceived,
  state: NonTerminalCState,
  storage: Storage,
): ReturnVal {
  if (state.type !== 'InstigatorWaitForOpponentConclude') {
    return { state, storage };
  }
  const { signedCommitment } = action;
  const checkResult = checkAndStore(storage, signedCommitment);
  if (!checkResult.isSuccess) {
    throw new Error('Concluding instigator protocol, unable to validate or store commitment');
  }
  const updatedStorage = checkResult.store;

  return { state: instigatorAcknowledgeConcludeReceived(state), storage: updatedStorage };
}

function defundChosen(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorAcknowledgeConcludeReceived') {
    return { state, storage };
  }
  // initialize defunding state machine

  const protocolStateWithSharedData = initializeDefunding(
    state.processId,
    state.channelId,
    storage,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  storage = protocolStateWithSharedData.sharedData;
  return { state: instigatorWaitForDefund({ ...state, defundingState }), storage };
}

function acknowledged(state: CState, storage: Storage): ReturnVal {
  switch (state.type) {
    case 'InstigatorAcknowledgeSuccess':
      return { state: success(), storage: hideWallet(storage) };
    case 'InstigatorAcknowledgeFailure':
      return { state: failure({ reason: state.reason }), storage: hideWallet(storage) };
    default:
      return { state, storage };
  }
}

// Helpers

const createAndSendConcludeCommitment = (sharedData: SharedData, channelId: string): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const commitment = composeConcludeCommitment(channelState);

  const signResult = channelStoreReducer.signAndStore(sharedData.channelStore, commitment);
  if (signResult.isSuccess) {
    const sharedDataWithOwnCommitment = setChannelStore(sharedData, signResult.store);
    const messageRelay = sendConcludeInstigated(
      theirAddress(channelState),
      channelId,
      signResult.signedCommitment,
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
