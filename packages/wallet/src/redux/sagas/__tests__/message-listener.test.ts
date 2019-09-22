import { put } from 'redux-saga/effects';
import * as incoming from 'magmo-wallet-client/lib/wallet-instructions';

import { messageListener } from '../message-listener';
import * as actions from '../../actions';
import { channel } from 'redux-saga';

describe('message listener', () => {
  const saga = messageListener();

  // having to do this next part is a bit nasty
  const mockActionChannel = channel();
  saga.next(mockActionChannel);

  it('converts INITIALIZE_REQUEST into a WALLET.LOGGED_IN', () => {
    const output = saga.next({ data: incoming.initializeRequest('abc123') }).value;
    saga.next(); // the take

    expect(output).toEqual(put(actions.loggedIn({ uid: 'abc123' })));
  });
});
