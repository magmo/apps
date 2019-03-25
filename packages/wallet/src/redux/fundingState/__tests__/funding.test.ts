import { fundingStateReducer } from '../reducer';

import * as states from '../state';
import * as actions from '../../actions';
import * as TransactionGenerator from '../../../utils/transaction-generator';

import * as scenarios from '../../__tests__/test-scenarios';
import {
  itChangesChannelFundingStatusTo,
  itSendsThisTransaction,
  itSendsNoTransaction,
} from '../../__tests__/helpers';
import { addHex } from '../../../utils/hex-utils';

const { channelId, twoThree, mockTransaction } = scenarios;

const YOUR_DEPOSIT_A = twoThree[0];
const YOUR_DEPOSIT_B = twoThree[1];
const TOTAL_REQUIRED = twoThree.reduce(addHex);

describe('incoming action: DIRECT_FUNDING_REQUESTED', () => {
  // player A scenario
  const createDepositTxMock = jest.fn(() => mockTransaction);
  Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
    value: createDepositTxMock,
  });
  const state = { ...states.EMPTY_FUNDING_STATE };
  const action = actions.internal.directFundingRequested(
    channelId,
    '0x',
    TOTAL_REQUIRED,
    YOUR_DEPOSIT_A,
    0,
  );
  const updatedState = fundingStateReducer(state, action);

  itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, {
    state: updatedState.state.directFunding[channelId],
  });
  itSendsThisTransaction(updatedState, mockTransaction);
});
describe('incoming action: DIRECT_FUNDING_REQUESTED', () => {
  // player B scenario
  const state = { ...states.EMPTY_FUNDING_STATE };
  const action = actions.internal.directFundingRequested(
    channelId,
    YOUR_DEPOSIT_A,
    TOTAL_REQUIRED,
    YOUR_DEPOSIT_B,
    1,
  );
  const updatedState = fundingStateReducer(state, action);

  itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, {
    state: updatedState.state.directFunding[channelId],
  });
  itSendsNoTransaction(updatedState);
});
