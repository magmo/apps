import { applyMiddleware, compose, createStore } from 'redux';
import { fork } from 'redux-saga/effects';
import createSagaMiddleware from 'redux-saga';
import * as storage from 'redux-storage';
const sagaMiddleware = createSagaMiddleware();

import { walletReducer } from './reducer';
import { sagaManager } from './sagas/saga-manager';
import filter from 'redux-storage-decorator-filter';
import createEngine from 'redux-storage-engine-indexed-db';

const storageEngine = filter(createEngine('magmo-wallet'), [
  'whitelisted-key',
  ['address'],
  ['privateKey'],
  ['channelStore'],
]);
const storageMiddleware = storage.createMiddleware(storageEngine);
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const enhancers = composeEnhancers(applyMiddleware(sagaMiddleware, storageMiddleware));
const reducerWithStorage = storage.reducer(walletReducer);

const store = createStore(reducerWithStorage, enhancers);
const load = storage.createLoader(storageEngine);

// Load from the store
load(store);

function* rootSaga() {
  yield fork(sagaManager);
}

sagaMiddleware.run(rootSaga);

export default store;
export const getWalletState = (storeObj: any) => storeObj.getState();
export const getFundingState = (storeObj: any) => storeObj.getState().fundingState;
