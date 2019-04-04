import * as states from './state';
import * as actions from '../actions';

import { StateWithSideEffects } from 'src/redux/utils';

export const directFundingStoreReducer = (
  state: states.DirectFundingStore,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingStore> => {
  if (action.type !== actions.internal.DIRECT_FUNDING_REQUESTED) {
    return { state };
  }

  return { state };
};
