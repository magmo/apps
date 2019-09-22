import * as states from './states';
import { ProtocolStateWithSharedData, makeLocator, ProtocolReducer } from '..';
import { SharedData } from '../../state';
import { ProtocolLocator } from '../../../communication';
import { ConsensusUpdateState, initializeConsensusUpdate } from '../consensus-update';
import {
  CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
  consensusUpdateReducer,
} from '../consensus-update/reducer';
import { getChannelFundingState, getLastStateForChannel } from '../../selectors';
import {
  getTwoPlayerIndex,
  getFundingChannelId,
  addToEthAllocation,
  getEthAllocation,
} from '../reducer-helpers';

import { VirtualDefundingAction } from './actions';
import { routesToConsensusUpdate } from '../consensus-update/actions';
import { HUB_ADDRESS } from '../../../constants';
import { convertAddressToBytes32 } from '../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils';

export function initialize({
  processId,
  targetChannelId,
  protocolLocator,
  sharedData,
}: {
  processId: string;
  targetChannelId: string;
  protocolLocator: ProtocolLocator;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.NonTerminalVirtualDefundingState> {
  const fundingState = getChannelFundingState(sharedData, targetChannelId);
  if (!fundingState || !fundingState.fundingChannel) {
    throw new Error(`Attempting to virtually defund a directly funded channel ${targetChannelId}`);
  }
  const jointChannelId = fundingState.fundingChannel;
  const latestAppState = getLastStateForChannel(sharedData, targetChannelId).state;
  if (!latestAppState) {
    throw new Error(`No state found for ${targetChannelId}`);
  }
  const ourIndex = getTwoPlayerIndex(targetChannelId, sharedData);
  const hubAddress = HUB_ADDRESS;
  const allocation = getEthAllocation(latestAppState.outcome) || [];
  const total = allocation
    .map(a => a.amount)
    .reduce((a1, a2) => {
      return bigNumberify(a1)
        .add(a2)
        .toHexString();
    });
  const proposedOutcome = addToEthAllocation(
    { destination: convertAddressToBytes32(hubAddress), amount: total },
    latestAppState.outcome,
  );
  let jointChannel: ConsensusUpdateState;
  ({ protocolState: jointChannel, sharedData } = initializeConsensusUpdate({
    processId,
    protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
    clearedToSend: true,
    channelId: jointChannelId,
    proposedOutcome,
    sharedData,
  }));
  const ledgerChannelId = getFundingChannelId(targetChannelId, sharedData);
  return {
    protocolState: states.waitForJointChannelUpdate({
      processId,
      ourIndex,
      hubAddress,
      jointChannel,
      jointChannelId,
      targetChannelId,
      ledgerChannelId,
      protocolLocator,
    }),
    sharedData,
  };
}

export const reducer: ProtocolReducer<states.VirtualDefundingState> = (
  protocolState: states.NonTerminalVirtualDefundingState,
  sharedData: SharedData,
  action: VirtualDefundingAction,
) => {
  switch (protocolState.type) {
    case 'VirtualDefunding.WaitForJointChannelUpdate':
      return waitForJointChannelUpdateReducer(protocolState, sharedData, action);
    case 'VirtualDefunding.WaitForLedgerChannelUpdate':
      return waitForLedgerChannelUpdateReducer(protocolState, sharedData, action);
    default:
      return { protocolState, sharedData };
  }
};

function waitForJointChannelUpdateReducer(
  protocolState: states.WaitForJointChannelUpdate,
  sharedData: SharedData,
  action: VirtualDefundingAction,
): ProtocolStateWithSharedData<states.VirtualDefundingState> {
  if (routesToConsensusUpdate(action, protocolState.protocolLocator)) {
    let jointChannel: ConsensusUpdateState;
    ({ protocolState: jointChannel, sharedData } = consensusUpdateReducer(
      protocolState.jointChannel,
      sharedData,
      action,
    ));
    switch (jointChannel.type) {
      case 'ConsensusUpdate.Failure':
        return { protocolState: states.failure({}), sharedData };
      case 'ConsensusUpdate.Success':
        const {
          ledgerChannelId,
          targetChannelId: appChannelId,

          processId,
        } = protocolState;
        // TODO: We probably need to start this earlier to deal with commitments coming in early

        const latestState = getLastStateForChannel(sharedData, appChannelId);
        // TODO: Construct proposed outcome correctly
        const proposedOutcome = latestState.state.outcome;

        let ledgerChannel: ConsensusUpdateState;
        ({ protocolState: ledgerChannel, sharedData } = initializeConsensusUpdate({
          processId,
          protocolLocator: makeLocator(
            protocolState.protocolLocator,
            CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
          ),
          channelId: ledgerChannelId,
          proposedOutcome,
          clearedToSend: true,
          sharedData,
        }));

        return {
          protocolState: states.waitForLedgerChannelUpdate({ ...protocolState, ledgerChannel }),
          sharedData,
        };
      default:
        return {
          protocolState: { ...protocolState, jointChannel },
          sharedData,
        };
    }
  }
  return { protocolState, sharedData };
}

function waitForLedgerChannelUpdateReducer(
  protocolState: states.WaitForLedgerChannelUpdate,
  sharedData: SharedData,
  action: VirtualDefundingAction,
): ProtocolStateWithSharedData<states.VirtualDefundingState> {
  if (routesToConsensusUpdate(action, protocolState.protocolLocator)) {
    let ledgerChannel: ConsensusUpdateState;
    ({ protocolState: ledgerChannel, sharedData } = consensusUpdateReducer(
      protocolState.ledgerChannel,
      sharedData,
      action,
    ));
    switch (ledgerChannel.type) {
      case 'ConsensusUpdate.Failure':
        return { protocolState: states.failure({}), sharedData };
      case 'ConsensusUpdate.Success':
        return { protocolState: states.success({}), sharedData };
      default:
        return {
          protocolState: { ...protocolState, ledgerChannel },
          sharedData,
        };
    }
  }
  return { protocolState, sharedData };
}
