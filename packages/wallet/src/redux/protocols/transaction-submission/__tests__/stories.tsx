import { storiesOf } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';

import * as scenarios from './scenarios';
import { TransactionSubmission } from '..';

const fakeStore = state => ({
  dispatch: action => {
    alert(`Action ${action.type} triggered`);
    return action;
  },
  getState: () => state,
  subscribe: () => () => {
    /* empty */
  },
  replaceReducer: () => {
    /* empty */
  },
});

const render = container => () => {
  return <Provider store={fakeStore({})}>{container}</Provider>;
};

storiesOf('Transaction submission', module).add(
  'test',
  render(<TransactionSubmission state={scenarios.happyPath.waitForSend} />),
);
