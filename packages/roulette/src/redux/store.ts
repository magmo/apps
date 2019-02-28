import { applyMiddleware, compose, createStore } from 'redux';

import createSagaMiddleware from 'redux-saga';
const sagaMiddleware = createSagaMiddleware();


const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const enhancers = composeEnhancers(
  applyMiddleware(sagaMiddleware),
);

const store = createStore(enhancers);
// function* rootSaga() { }
// sagaMiddleware.run(rootSaga);
export default store;
