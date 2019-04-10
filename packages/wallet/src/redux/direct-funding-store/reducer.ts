import * as directFundingStore from './state';
import * as states from '../direct-funding/state';
import * as actions from '../actions';

import { StateWithSideEffects } from 'src/redux/utils';
import { bigNumberify } from 'ethers/utils';
import { createDepositTransaction } from '../../utils/transaction-generator';
import { WalletProcedure } from '../types';

export const directFundingStoreReducer = (
  state: directFundingStore.DirectFundingStore,
  action: actions.WalletAction,
): StateWithSideEffects<directFundingStore.DirectFundingStore> => {
  if (action.type !== actions.internal.DIRECT_FUNDING_REQUESTED) {
    // The sole responsibility of this reducer is to start direct funding, when
    // requested.
    return { state };
  }

  const { channelId } = action;
  if (state[channelId]) {
    // The wallet has requested to start the funding for a channel that already has
    // a funding state
    return { state };
  }
  const { state: directFunding, sideEffects } = beginDirectFunding(action);

  return {
    state: {
      ...state,
      [channelId]: directFunding,
    },
    sideEffects,
  };
};

const beginDirectFunding = (action: actions.internal.DirectFundingRequested) => {
  const { safeToDepositLevel, totalFundingRequired, requiredDeposit, channelId, ourIndex } = action;

  const alreadySafeToDeposit = bigNumberify(safeToDepositLevel).eq('0x');
  const alreadyFunded = bigNumberify(totalFundingRequired).eq('0x');

  const channelFundingStatus = alreadyFunded
    ? states.CHANNEL_FUNDED
    : alreadySafeToDeposit
    ? states.SAFE_TO_DEPOSIT
    : states.NOT_SAFE_TO_DEPOSIT;

  const stateConstructor: any = alreadyFunded
    ? states.channelFunded
    : alreadySafeToDeposit
    ? states.depositing.waitForTransactionSent
    : states.notSafeToDeposit;

  const transactionOutbox = alreadySafeToDeposit
    ? {
        transactionRequest: createDepositTransaction(action.channelId, action.requiredDeposit),
        channelId,
        procedure: WalletProcedure.DirectFunding,
      }
    : undefined;

  return {
    state: stateConstructor({
      fundingType: states.DIRECT_FUNDING,
      channelFundingStatus,
      safeToDepositLevel,
      channelId,
      requestedTotalFunds: totalFundingRequired,
      requestedYourContribution: requiredDeposit,
      ourIndex,
    }),
    sideEffects: { transactionOutbox },
  };
};
