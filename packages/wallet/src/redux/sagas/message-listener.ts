import { take, put, select } from "redux-saga/effects";
import * as incoming from 'wallet-client/lib/messages-to-wallet';
import * as TransactionGenerator from '../../utils/transaction-generator';

import * as actions from "../actions";
import { eventChannel } from 'redux-saga';
import { WalletState } from '../../states';
import { transactionTester } from './transaction-tester';

export function* messageListener() {
  const postMessageEventChannel = eventChannel(emitter => {
    window.addEventListener('message', (event: Event) => {
      emitter(event);
    });
    return () => { /* End channel here*/ };
  });
  while (true) {
    const messageEvent = yield take(postMessageEventChannel);
    const action = messageEvent.data;
    const state: WalletState = yield select((walletState: WalletState) => walletState);
    switch (messageEvent.data.type) {
      case incoming.CREATE_CHALLENGE_REQUEST:
        yield put(actions.challengeRequested());
        break;
      case incoming.FUNDING_REQUEST:
        yield put(actions.fundingRequested());
        break;
      case incoming.INITIALIZE_REQUEST:
        yield put(actions.loggedIn(action.userId));
        break;
      case incoming.SIGNATURE_REQUEST:
      // TODO: This is just a POC, we'd probably want to bake this stuff into the reducers instead
        if (state.stage==="RUNNING"){
          const trans = TransactionGenerator.createValidTransitionTransaction(state.adjudicator, state.lastPosition.data, action.data);
          try{
          yield transactionTester(trans);
          }catch(err){
            // Invalid transaction handling here
            throw err;
          }
        }
    
        yield put(actions.ownPositionReceived(action.data));
        break;
      case incoming.VALIDATION_REQUEST:
        // TODO: This is just a POC, we'd probably want to bake this stuff into the reducers instead
        if (state.stage === "RUNNING") {
          const trans = TransactionGenerator.createValidTransitionTransaction(state.adjudicator, state.lastPosition.data, action.data);
          try {
            yield transactionTester(trans);
          } catch (err) {
            // Invalid transaction handling here
            throw err;
          }
        }
        yield put(actions.opponentPositionReceived(action.data, action.signature));
        break;
      case incoming.RECEIVE_MESSAGE:
        yield put(actions.messageReceived(action.data, action.signature));
        break;
      case incoming.RESPOND_TO_CHALLENGE:
        yield put(actions.challengePositionReceived(action.position));
        break;
      case incoming.CONCLUDE_CHANNEL_REQUEST:
        yield put(actions.concludeRequested());
        break;
      default:
    }

  }

}



