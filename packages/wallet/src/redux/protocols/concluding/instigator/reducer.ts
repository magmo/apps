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
import { SharedData, getChannel, setChannelStore, queueMessage } from '../../../state';
import { composeConcludeCommitment } from '../../../../utils/commitment-utils';
import { ourTurn } from '../../../channel-store';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';
import { isConcludingAction } from './actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
type Storage = SharedData;
import { isSuccess, isFailure } from '../../defunding/states';
import * as channelStoreReducer from '../../../channel-store/reducer';
import * as selectors from '../../../selectors';
import { showWallet } from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { theirAddress } from '../../../channel-store';
import { sendConcludeInstigated } from '../../../../communication';
import { failure, success } from '../state';

export interface ReturnVal {
  state: CState;
  storage: Storage;
}

export function instigatorConcludingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (isDefundingAction(action)) {
    return handleDefundingAction(state, storage, action);
  }

  if (!isConcludingAction(action)) {
    return { state, storage };
  }

  switch (action.type) {
    case 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED':
      return concludingCancelled(state, storage);
    case 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_SENT':
      return concludeSent(state, storage);
    case 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_RECEIVED':
      return concludeReceived(state, storage);
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
  const defundingState2 = protocolStateWithSharedData.protocolState;

  if (isSuccess(defundingState2)) {
    state = instigatorAcknowledgeSuccess(state);
  } else if (isFailure(defundingState2)) {
    state = instigatorAcknowledgeFailure({ ...state, reason: 'DefundFailed' });
  }
  return { state, storage };
}

function concludingCancelled(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorApproveConcluding') {
    return { state, storage };
  }
  return { state: failure({ reason: 'ConcludeCancelled' }), storage };
}

function concludeSent(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorApproveConcluding') {
    return { state, storage };
  }

  const channelState = getChannel(storage, state.channelId);

  if (channelState) {
    const sharedDataWithOwnCommitment = createAndSendConcludeCommitment(
      storage,
      state.processId,
      state.channelId,
    );

    return {
      state: instigatorWaitForOpponentConclude({ ...state }),
      storage: sharedDataWithOwnCommitment,
    };
  } else {
    return { state, storage };
  }
}

function concludeReceived(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'InstigatorWaitForOpponentConclude') {
    return { state, storage };
  }
  return { state: instigatorAcknowledgeConcludeReceived(state), storage };
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
  return { state: instigatorWaitForDefund({ ...state, defundingState }), storage };
}

function acknowledged(state: CState, storage: Storage): ReturnVal {
  switch (state.type) {
    case 'InstigatorAcknowledgeSuccess':
      return { state: success(), storage };
    case 'InstigatorAcknowledgeFailure':
      return { state: failure({ reason: state.reason }), storage };
    default:
      return { state, storage };
  }
}

// Helpers

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
    const messageRelay = sendConcludeInstigated(
      theirAddress(channelState),
      processId,
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
