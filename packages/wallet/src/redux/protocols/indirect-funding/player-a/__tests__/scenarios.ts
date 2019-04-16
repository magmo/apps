import * as states from '../state';
import * as actions from '../actions';
import { channelId, ledgerDirectFundingStates } from '../../../../__tests__/test-scenarios';

const ledgerId = '0xLedger';
const consensusLibrary = '0x0';

const stateProps = { channelId, ledgerId, directFundingState: ledgerDirectFundingStates.playerA };
const actionProps = { channelId, consensusLibrary };

// Happy path states
const waitForApproval = states.waitForApproval(stateProps);
const waitForPreFundSetup1 = states.waitForPreFundSetup1(stateProps);
const waitForDirectFunding = states.waitForDirectFunding(stateProps);
const waitForPostFundSetup1 = states.waitForPostFundSetup1(stateProps);
const waitForLedgerUpdate1 = states.waitForLedgerUpdate1(stateProps);

// Happy path actions
const strategyApproved = actions.strategyApproved(
  actionProps.channelId,
  actionProps.consensusLibrary,
);

export const happyPath = {
  states: {
    waitForApproval,
    waitForPreFundSetup1,
    waitForDirectFunding,
    waitForPostFundSetup1,
    waitForLedgerUpdate1,
  },
  actions: {
    strategyApproved,
  },
};
