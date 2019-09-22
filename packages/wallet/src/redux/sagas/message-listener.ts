import { take, put, select } from 'redux-saga/effects';
import * as incoming from 'magmo-wallet-client/lib/wallet-instructions';

import * as actions from '../actions';
import { eventChannel, buffers } from 'redux-saga';
import * as application from '../protocols/application/reducer';
import { isRelayableAction } from '../../communication';
import { responseProvided } from '../protocols/dispute/responder/actions';
import { concluded, challengeRequested } from '../protocols/application/actions';

import { TwoPartyPlayerIndex } from '../types';
import { signState } from 'nitro-protocol/lib/src/signatures';
import { getPrivateKey } from '../state';
import { signatureSuccess } from 'magmo-wallet-client';
import { messageSender } from './message-sender';

export function* messageListener() {
  const postMessageEventChannel = eventChannel(emitter => {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data && event.data.type && event.data.type.indexOf('WALLET') > -1) {
        emitter(event);
      }
    });
    return () => {
      /* End channel here*/
    };
  }, buffers.fixed(100));
  while (true) {
    const messageEvent = yield take(postMessageEventChannel);
    const action: incoming.WalletInstruction = messageEvent.data;
    switch (action.type) {
      // Events that need a new process
      case incoming.CONCLUDE_CHANNEL_REQUEST:
        yield put(actions.protocol.concludeRequested({ channelId: action.channelId }));
        break;
      case incoming.CREATE_CHALLENGE_REQUEST:
        yield put(
          challengeRequested({
            processId: application.APPLICATION_PROCESS_ID, // TODO allow for multiple application Ids
            channelId: action.channelId,
          }),
        );
        break;
      case incoming.FUNDING_REQUEST:
        yield put(
          actions.protocol.fundingRequested({
            channelId: action.channelId,
            playerIndex: action.playerIndex === 0 ? TwoPartyPlayerIndex.A : TwoPartyPlayerIndex.B,
          }),
        );
        break;

      // Events that do not need a new process
      case incoming.INITIALIZE_REQUEST:
        yield put(actions.loggedIn({ uid: action.userId }));
        break;
      case 'WALLET.SIGNATURE.REQUEST':
        // TODO: This should probably be handling by some other module instead of being inlined
        const privateKey = yield select(getPrivateKey);
        const signedState = yield signState(action.state, privateKey);
        const message = signatureSuccess(signedState);
        yield messageSender(message);
        break;
      case 'WALLET.STORE.REQUEST':
        yield put(
          actions.application.statesReceived({
            processId: application.APPLICATION_PROCESS_ID,
            signedStates: [signedState],
          }),
        );
        break;
      case incoming.RESPOND_TO_CHALLENGE:
        // TODO: This probably should be in a function
        const processId = application.APPLICATION_PROCESS_ID;
        yield put(responseProvided({ processId, signedState: action.signedState }));
        break;
      case incoming.RECEIVE_MESSAGE:
        const messageAction = handleIncomingMessage(action);
        if (messageAction.type === 'WALLET.COMMON.STATES_RECEIVED') {
          yield put(messageAction);
        }

        yield put(messageAction);
        if (messageAction.type === 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED') {
          yield put(concluded({ processId: application.APPLICATION_PROCESS_ID }));
        }
        break;
      default:
    }
  }
}

function handleIncomingMessage(action: incoming.ReceiveMessage) {
  const data = action.messagePayload;

  if ('type' in data && isRelayableAction(data)) {
    return data;
  } else {
    throw new Error('Invalid action');
  }
}
