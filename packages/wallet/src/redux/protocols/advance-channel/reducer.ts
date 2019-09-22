import * as states from './states';
import { SharedData, registerChannelToMonitor } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { WalletAction } from '../../actions';
import * as selectors from '../../selectors';
import { StatesReceived } from '../../../communication';
import { isAdvanceChannelAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { Properties } from '../../utils';
import * as helpers from '../reducer-helpers';
import { Channel, getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { State } from 'nitro-protocol/lib/src/contract/state';
import { signState } from 'nitro-protocol/lib/src/signatures';
import { storeState, storeStates } from '../../channel-store/reducer';

export { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../../../communication/protocol-locator';

type ReturnVal = ProtocolStateWithSharedData<states.AdvanceChannelState>;
type Storage = SharedData;

export function initialize(
  sharedData: Storage,
  args: OngoingChannelArgs | NewChannelArgs,
): ReturnVal {
  const { stateType, processId } = args;
  if (stateType === states.StateType.PreFunding) {
    if (!isNewChannelArgs(args)) {
      throw new Error('Must receive NewChannelArgs');
    }
    return initializeWithNewChannel(processId, sharedData, args);
  } else {
    if (isNewChannelArgs(args)) {
      throw new Error('Must receive OngoingChannelArgs');
    }

    return initializeWithExistingChannel(processId, sharedData, args);
  }
}

export const reducer: ProtocolReducer<states.AdvanceChannelState> = (
  protocolState: states.NonTerminalAdvanceChannelState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isAdvanceChannelAction(action)) {
    console.error('Invalid action: expected WALLET.COMMON.STATES_RECEIVED');
    return { protocolState, sharedData };
  }

  switch (action.type) {
    case 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND':
      return clearedToSendReducer(protocolState, sharedData);
    case 'WALLET.COMMON.STATES_RECEIVED':
      switch (protocolState.type) {
        case 'AdvanceChannel.ChannelUnknown': {
          return channelUnknownReducer(protocolState, sharedData, action);
        }
        case 'AdvanceChannel.NotSafeToSend': {
          return notSafeToSendReducer(protocolState, sharedData, action);
        }
        case 'AdvanceChannel.CommitmentSent': {
          return commitmentSentReducer(protocolState, sharedData, action);
        }
        default:
          return unreachable(protocolState);
      }
    default:
      return unreachable(action);
  }
};

function clearedToSendReducer(protocolState: states.AdvanceChannelState, sharedData: SharedData) {
  if (protocolState.type === 'AdvanceChannel.NotSafeToSend') {
    protocolState = { ...protocolState, clearedToSend: true };
    if (protocolState.type === 'AdvanceChannel.NotSafeToSend') {
      return attemptToAdvanceChannel(sharedData, protocolState, protocolState.channelId);
    } else {
      return { sharedData, protocolState };
    }
  } else if (protocolState.type === 'AdvanceChannel.ChannelUnknown') {
    return {
      sharedData,
      protocolState: states.channelUnknown({ ...protocolState, clearedToSend: true }),
    };
  } else {
    return { protocolState, sharedData };
  }
}

type NewChannelArgs = Properties<states.ChannelUnknown>;
type OngoingChannelArgs = Properties<states.NotSafeToSend>;

function isNewChannelArgs(args: OngoingChannelArgs | NewChannelArgs): args is NewChannelArgs {
  if ('privateKey' in args) {
    return true;
  }
  return false;
}

function initializeWithNewChannel(
  processId,
  sharedData: Storage,
  initializeChannelArgs: NewChannelArgs,
) {
  const {
    outcome,
    appData,
    clearedToSend,
    protocolLocator,
    chainId,
    participants,
    appDefinition,
    challengeDuration,
  } = initializeChannelArgs;

  if (helpers.isSafeToSend({ sharedData, participants, clearedToSend })) {
    // Initialize the channel in the store
    const channelNonce = selectors.getNextNonce(sharedData, chainId);
    const channel: Channel = {
      channelNonce,
      participants,
      chainId,
    };
    const ourState: State = {
      channel,
      turnNum: 0,
      isFinal: false,
      appData,
      appDefinition,
      challengeDuration,
      outcome,
    };
    const { privateKey } = initializeChannelArgs;
    const signedState = signState(ourState, privateKey);

    sharedData = storeState(signedState, sharedData);

    // Register channel to monitor
    const channelId = getChannelId(channel);
    sharedData = registerChannelToMonitor(sharedData, processId, channelId, protocolLocator);

    // Send commitments to next participant
    sharedData = helpers.sendStates(sharedData, processId, channelId, protocolLocator);
    const protocolState = states.stateSent({
      ...initializeChannelArgs,
      processId,
      channelId,
    });
    return {
      protocolState,
      sharedData,
    };
  } else {
    const protocolState = states.channelUnknown({
      ...initializeChannelArgs,
      processId,
    });

    return { protocolState, sharedData };
  }
}

function initializeWithExistingChannel(
  processId,
  sharedData: Storage,
  initializeChannelArgs: OngoingChannelArgs,
) {
  const { channelId, clearedToSend, protocolLocator } = initializeChannelArgs;
  const channelState = selectors.getChannelState(sharedData, channelId);
  if (
    helpers.isSafeToSend({
      participants: channelState.channel.participants,
      sharedData,
      clearedToSend,
      channelId,
    })
  ) {
    const lastState = selectors.getLastStateForChannel(sharedData, channelId).state;

    const ourState = { ...lastState, turnNum: lastState.turnNum + 1 };
    const ourSignedState = signState(ourState, sharedData.privateKey);

    sharedData = storeState(ourSignedState, sharedData);
    sharedData = helpers.sendStates(sharedData, processId, channelId, protocolLocator);

    const protocolState = states.stateSent({
      ...initializeChannelArgs,
      processId,
      channelId,
    });
    return {
      protocolState,
      sharedData,
    };
  } else {
    return { protocolState: states.notSafeToSend(initializeChannelArgs), sharedData };
  }
}

function attemptToAdvanceChannel(
  sharedData: SharedData,
  protocolState: states.ChannelUnknown | states.NotSafeToSend,
  channelId: string,
): { sharedData: SharedData; protocolState: states.AdvanceChannelState } {
  const { clearedToSend, protocolLocator, processId } = protocolState;

  const latestState = selectors.getLastStateForChannel(sharedData, channelId).state;
  const { participants } = latestState.channel;
  if (helpers.isSafeToSend({ sharedData, channelId, participants, clearedToSend })) {
    // First, update the store with our response
    const ourState = { ...latestState, turnNum: latestState.turnNum + 1 };

    const ourSignedState = signState(ourState, sharedData.privateKey);
    sharedData = storeState(ourSignedState, sharedData);

    sharedData = helpers.sendStates(sharedData, processId, channelId, protocolLocator);

    if (channelAdvanced(channelId, sharedData)) {
      return { protocolState: states.success({ ...protocolState, channelId }), sharedData };
    } else {
      return { protocolState: states.stateSent({ ...protocolState, channelId }), sharedData };
    }
  } else {
    return { protocolState, sharedData };
  }
}

const channelUnknownReducer = (
  protocolState: states.ChannelUnknown,
  sharedData,
  action: StatesReceived,
) => {
  const channelId = getChannelId(action.signedStates[0].state.channel);

  sharedData = storeStates(action.signedStates, sharedData);

  const result = attemptToAdvanceChannel(sharedData, protocolState, channelId);
  sharedData = result.sharedData;
  const nextProtocolState = result.protocolState; // The type might have changed, so we can't overwrite protocolState
  if (
    nextProtocolState.type === 'AdvanceChannel.CommitmentSent' ||
    nextProtocolState.type === 'AdvanceChannel.Success'
  ) {
    sharedData = registerChannelToMonitor(
      sharedData,
      protocolState.processId,
      channelId,
      protocolState.protocolLocator,
    );
  }

  return { protocolState: nextProtocolState, sharedData };
};

const notSafeToSendReducer = (
  protocolState: states.NotSafeToSend,
  sharedData,
  action: StatesReceived,
) => {
  const { channelId } = protocolState;

  sharedData = storeStates(action.signedStates, sharedData);

  return attemptToAdvanceChannel(sharedData, protocolState, channelId);
};

const commitmentSentReducer = (
  protocolState: states.CommitmentSent,
  sharedData,
  action: StatesReceived,
) => {
  const { channelId } = protocolState;

  sharedData = storeStates(action.signedStates, sharedData);

  if (channelAdvanced(channelId, sharedData)) {
    return { protocolState: states.success(protocolState), sharedData };
  }

  return { protocolState, sharedData };
};

function channelAdvanced(channelId: string, sharedData: SharedData): boolean {
  const lastState = selectors.getLastStateForChannel(sharedData, channelId).state;
  const { participants } = lastState.channel;
  return lastState.turnNum > 0 && lastState.turnNum % participants.length === 0;
}
