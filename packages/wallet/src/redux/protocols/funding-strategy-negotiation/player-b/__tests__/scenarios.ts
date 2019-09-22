import * as states from '../states';
import * as actions from '../actions';
import { TwoPartyPlayerIndex } from '../../../../types';

import { FundingStrategy } from '../../../../../communication';
import {
  channelId,
  asAddress,
  bsAddress,
  testEmptySharedData,
} from '../../../../../domain/commitments/__tests__';

// ---------
// Test data
// ---------
const processId = 'process-id.123';
const targetChannelId = channelId;
const opponentAddress = asAddress;
const ourAddress = bsAddress;
const strategy: FundingStrategy = 'IndirectFundingStrategy';
const props = {
  targetChannelId,
  processId,
  opponentAddress,
  strategy,
  ourAddress,
  protocolLocator: [],
};

// ------
// States
// ------
const waitForStrategyProposal = states.waitForStrategyProposal(props);

const waitForIndirectStrategyApproval = states.waitForStrategyApproval(props);
const waitForVirtualStrategyApproval = states.waitForStrategyApproval({
  ...props,
  strategy: 'VirtualFundingStrategy',
});
export const indirectSuccess = states.success({
  selectedFundingStrategy: 'IndirectFundingStrategy',
});
export const virtualSuccess = states.success({ selectedFundingStrategy: 'VirtualFundingStrategy' });
// ------
// Shared Data
// ------

// -------
// Actions
// -------
const indirectStrategyProposed = actions.strategyProposed({ processId, strategy });
const indirectStrategyApproved = actions.strategyApproved({ processId, strategy });
const virtualStrategyProposed = actions.strategyProposed({
  processId,
  strategy: 'VirtualFundingStrategy',
});
const virtualStrategyApproved = actions.strategyApproved({
  processId,
  strategy: 'VirtualFundingStrategy',
});

const strategyRejected = actions.strategyRejected({ processId });
const cancelledByB = actions.cancelled({ processId, by: TwoPartyPlayerIndex.B });
const cancelledByA = actions.cancelled({ processId, by: TwoPartyPlayerIndex.A });

// ---------
// Scenarios
// ---------
export const indirectStrategyChosen = {
  ...props,
  waitForStrategyProposal: {
    state: waitForStrategyProposal,
    sharedData: testEmptySharedData(),
    action: indirectStrategyProposed,
  },
  waitForStrategyApproval: {
    state: waitForIndirectStrategyApproval,
    sharedData: testEmptySharedData(),
    action: indirectStrategyApproved,
  },
};
export const virtualStrategyChosen = {
  ...props,
  strategy: 'VirtualFundingStrategy',
  waitForStrategyProposal: {
    state: waitForStrategyProposal,
    sharedData: testEmptySharedData(),
    action: virtualStrategyProposed,
  },
  waitForStrategyApproval: {
    state: waitForVirtualStrategyApproval,
    sharedData: testEmptySharedData(),
    action: virtualStrategyApproved,
  },
};

export const rejectedStrategy = {
  ...props,
  waitForStrategyApproval: {
    state: waitForIndirectStrategyApproval,
    sharedData: testEmptySharedData(),
    action: strategyRejected,
  },
};

export const cancelledByOpponent = {
  ...props,
  waitForStrategyApproval: {
    state: waitForIndirectStrategyApproval,
    sharedData: testEmptySharedData(),
    action: cancelledByA,
  },
  waitForStrategyProposal: {
    state: waitForStrategyProposal,
    sharedData: testEmptySharedData(),
    action: cancelledByA,
  },
};

export const cancelledByUser = {
  ...props,
  waitForStrategyApproval: {
    state: waitForIndirectStrategyApproval,
    sharedData: testEmptySharedData(),
    action: cancelledByB,
  },
  waitForStrategyProposal: {
    state: waitForStrategyProposal,
    sharedData: testEmptySharedData(),
    action: cancelledByB,
  },
};
