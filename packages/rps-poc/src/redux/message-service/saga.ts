import { fork, take, call, put, select, actionChannel } from 'redux-saga/effects';
import { buffers, eventChannel } from 'redux-saga';

import { reduxSagaFirebase } from '../../gateways/firebase';

import { encode, decode, Player, positions } from '../../core';
import * as gameActions from '../game/actions';
import { MessageState, WalletMessage } from './state';
import * as gameStates from '../game/state';
import { Channel, State } from 'fmg-core';
import { getMessageState, getGameState } from '../store';
import * as Wallet from 'wallet-comm';
import { openChannel, startFunding, signData, validateSignature, MessageRequest, messageWallet, MESSAGE_REQUEST, FUNDING_SUCCESS } from 'wallet-comm';
import hexToBN from '../../utils/hexToBN';
// TODO: use actual wallet interface (what will that look like?)
const toWalletActions: any = {};
const fromWalletActions: any = {};
export enum Queue {
  WALLET = 'WALLET',
  GAME_ENGINE = 'GAME_ENGINE',
}

// export const getWalletAddress = (storeObj: any) => storeObj.wallet.address;

export default function* messageSaga() {
  yield fork(sendMessagesSaga);
  yield fork(waitForWalletThenReceiveFromFirebaseSaga);

}


export function* sendMessageToOpponentWallet(messageRequest: MessageRequest) {
  const queue = Queue.WALLET;
  const { data, to, signature } = messageRequest;
  const message = { data, queue, signature };
  yield call(reduxSagaFirebase.database.create, `/messages/${to.toLowerCase()}`, message);
}


export function* sendMessagesSaga() {
  // We need to use an actionChannel to queue up actions that
  // might be put from this saga
  const channel = yield actionChannel([
    gameActions.CHOOSE_MOVE,
    gameActions.CONFIRM_GAME,
    gameActions.CREATE_OPEN_GAME,
    gameActions.INITIAL_POSITION_RECEIVED,
    gameActions.PLAY_AGAIN,
    gameActions.POSITION_RECEIVED,
    gameActions.FUNDING_SUCCESS,
    gameActions.WITHDRAWAL_REQUEST,
    gameActions.WITHDRAWAL_SUCCESS,
    gameActions.JOIN_OPEN_GAME,
    gameActions.RESIGN,
  ]);
  while (true) {
    // We take any action that might trigger the outbox to be updated
    yield take(channel);
    const messageState: MessageState = yield select(getMessageState);
    const gameState: gameStates.GameState = yield select(getGameState);
    if (messageState.opponentOutbox) {
      const queue = Queue.GAME_ENGINE;
      const data = encode(messageState.opponentOutbox.position);
      const signature = yield signMessage(data);
      const userName = gameState.name !== gameStates.StateName.NoName ? gameState.myName : "";
      const message = { data, queue, signature, userName };
      const { opponentAddress } = messageState.opponentOutbox;

      yield call(reduxSagaFirebase.database.create, `/messages/${opponentAddress.toLowerCase()}`, message);
      yield put(gameActions.messageSent());
    }
    if (messageState.walletOutbox) {
      if (
        gameState.name !== gameStates.StateName.Lobby &&
        gameState.name !== gameStates.StateName.WaitingRoom &&
        gameState.name !== gameStates.StateName.CreatingOpenGame &&
        gameState.name !== gameStates.StateName.NoName
      ) {
        yield handleWalletMessage(messageState.walletOutbox, gameState);
      }
    }

  }
}

function* waitForWalletThenReceiveFromFirebaseSaga() {
  while (true) {
    yield take('*');

    const gameState: gameStates.GameState = yield select(getGameState);
    const address = gameState.myAddress;

    if (address) {
      // this will never return
      yield receiveFromFirebaseSaga(address);
    }
  }
}

function* receiveFromFirebaseSaga(address) {
  address = address.toLowerCase();

  const channel = yield call(
    reduxSagaFirebase.database.channel,
    `/messages/${address}`,
    'child_added',
    buffers.fixed(10),
  );

  while (true) {
    const message = yield take(channel);

    const key = message.snapshot.key;
    const { data, queue, userName } = message.value;

    if (queue === Queue.GAME_ENGINE) {
      const { signature } = message.value;
      const validMessage = yield validateMessage(data, signature);
      if (!validMessage) {
        // TODO: Handle this
      }
      const position = decode(data);
      if (position.name === positions.PRE_FUND_SETUP_A) {
        yield put(gameActions.initialPositionReceived(position, userName ? userName : 'Opponent'));
      } else {
        yield put(gameActions.positionReceived(position));
      }
    } else {
      const { signature } = message.value;
      // TODO: Should be stored in a single place
      const walletFrameId = 'walletId';
      messageWallet(walletFrameId, data, signature);

    }
    yield call(reduxSagaFirebase.database.delete, `/messages/${address}/${key}`);
  }
}

// TODO: Type this properly
function createWalletEventChannel(walletListener: Wallet.WalletEventListener) {
  return eventChannel(emit => {
    walletListener.subscribe((event) => {
      emit(event);
    });

    return () => {
      walletListener.unSubscribe();
    };
  });
}

function* handleWalletMessage(walletMessage: WalletMessage, state: gameStates.PlayingState) {

  const { libraryAddress, channelNonce, player, balances, participants } = state;
  const channel = new Channel(libraryAddress, channelNonce, participants);
  const channelId = channel.id;

  switch (walletMessage.type) {
    case "RESPOND_TO_CHALLENGE":
      if (state.name === gameStates.StateName.WaitForOpponentToPickMoveA || state.name === gameStates.StateName.WaitForOpponentToPickMoveB) {
        yield put(toWalletActions.respondToChallenge(encode(walletMessage.data)));
      }
      break;
    case "FUNDING_REQUESTED":
      // TODO: We need to close the channel at some point
      openChannel("walletId", channel);
      const myIndex = player === Player.PlayerA ? 0 : 1;

      const opponentAddress = participants[1 - myIndex];
      const myAddress = participants[myIndex];
      const myBalance = hexToBN(balances[myIndex]);
      const opponentBalance = hexToBN(balances[1 - myIndex]);

      // TODO: Should be stored in a single place
      const walletFrameId = 'walletId';
      const walletListener = startFunding(walletFrameId, channelId, myAddress, opponentAddress, myBalance, opponentBalance, myIndex);
      const fundingChannel = createWalletEventChannel(walletListener);


      let fundingOver = false;
      let fundingResponse;
      while (!fundingOver) {
        // TODO: FUNDING_FAILURE
        fundingResponse = yield take(fundingChannel);
        switch (fundingResponse.type) {
          case MESSAGE_REQUEST:
            yield sendMessageToOpponentWallet(fundingResponse);
            break;
          case FUNDING_SUCCESS:
            fundingOver = true;
            break;
        }
      }

      yield put(gameActions.messageSent());
      const position = decode(fundingResponse.position);
      yield put(gameActions.fundingSuccess(position));

      break;
    case "WITHDRAWAL_REQUESTED":
      const { turnNum } = positions.conclude(state);
      const channelState = new State({
        channel,
        stateType: State.StateType.Conclude,
        turnNum,
        resolution: balances.map(hexToBN),
        stateCount: 0,
      });
      yield put(toWalletActions.withdrawalRequest(channelState));
      yield take(fromWalletActions.WITHDRAWAL_SUCCESS);
      yield put(gameActions.messageSent());
      yield put(gameActions.withdrawalSuccess());
      yield put(toWalletActions.closeChannelRequest());
    case "CONCLUDE_REQUESTED":
      yield put(toWalletActions.concludeChannelRequest());
      yield take([fromWalletActions.CONCLUDE_SUCCESS, fromWalletActions.CONCLUDE_FAILURE]);
      yield put(gameActions.messageSent());
  }
}


// function* receiveFromWalletSaga() {
//   while (true) {
//     const { positionData } = yield take(fromWalletActions.CHALLENGE_POSITION_RECEIVED);
//     const position = decode(positionData);
//     yield put(gameActions.positionReceived(position));
//   }
// }


function* validateMessage(data, signature) {
  // TODO: Handle wallet busy and failure

  return yield validateSignature('walletId', data, signature);
}

function* signMessage(data) {
  // TODO: Handle wallet busy / error
  return yield signData('walletId', data);

}
