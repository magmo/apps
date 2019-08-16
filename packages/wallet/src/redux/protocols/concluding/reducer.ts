import { ConcludingState } from '../concluding/states';
import { SharedData } from '../../state';
import { ProtocolAction } from '../../actions';
import { ProtocolStateWithSharedData, makeLocator, EMPTY_LOCATOR } from '..';
import { sendConcludeInstigated, getTwoPlayerIndex } from '../reducer-helpers';
import {
  initializeAdvanceChannel,
  AdvanceChannelState,
  advanceChannelReducer,
} from '../advance-channel';
import { EmbeddedProtocol } from '../../../communication';
import { CommitmentType } from '../../../domain';
import * as states from './states';
import { routesToAdvanceChannel } from '../advance-channel/actions';
import { DefundingState, initializeDefunding, defundingReducer } from '../defunding';
import { routesToDefunding } from '../defunding/actions';
import { unreachable } from '../../../utils/reducer-utils';

export function concludingReducer(
  protocolState: states.NonTerminalConcludingState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ConcludingState> {
  switch (protocolState.type) {
    case 'Concluding.WaitForConclude':
      return waitForConcludeReducer(protocolState, sharedData, action);
    case 'Concluding.WaitForDefund':
      return waitForDefundReducer(protocolState, sharedData, action);
    default:
      return unreachable(protocolState);
  }
}

function waitForDefundReducer(
  protocolState: states.WaitForDefund,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ConcludingState> {
  if (!routesToDefunding(action, EMPTY_LOCATOR)) {
    console.warn(`Expected defunding, received ${action.type} instead`);
    return { protocolState, sharedData };
  }

  let defunding: DefundingState;
  ({ protocolState: defunding, sharedData } = defundingReducer(
    protocolState.defunding,
    sharedData,
    action,
  ));

  switch (defunding.type) {
    case 'Defunding.Failure':
      return { protocolState: states.failure({ reason: 'Defunding failure' }), sharedData };
    case 'Defunding.Success':
      return { protocolState: states.success({}), sharedData };

    default:
      return {
        protocolState: states.waitForDefund({ ...protocolState, defunding }),
        sharedData,
      };
  }
}

function waitForConcludeReducer(
  protocolState: states.WaitForConclude,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ConcludingState> {
  if (!routesToAdvanceChannel(action, EMPTY_LOCATOR)) {
    console.warn(`Expected Advance channel action, received ${action.type} instead`);
    return { protocolState, sharedData };
  }
  let concluding: AdvanceChannelState;
  ({ protocolState: concluding, sharedData } = advanceChannelReducer(
    protocolState.concluding,
    sharedData,
    action,
  ));
  switch (concluding.type) {
    case 'AdvanceChannel.Failure':
      return { protocolState: states.failure({ reason: 'AdvanceChannelAction' }), sharedData };
    case 'AdvanceChannel.Success':
      let defunding: DefundingState;
      const { processId, channelId } = protocolState;
      ({ protocolState: defunding, sharedData } = initializeDefunding(
        processId,
        makeLocator(EmbeddedProtocol.AdvanceChannel),
        channelId,
        sharedData,
      ));
      return {
        protocolState: states.waitForDefund({ defunding, processId, channelId }),
        sharedData,
      };
    default:
      return {
        protocolState: states.waitForConclude({ ...protocolState, concluding }),
        sharedData,
      };
  }
}

export function initialize({
  channelId,
  processId,
  opponentInstigatedConclude,
  sharedData,
}: {
  channelId: string;
  processId: string;
  opponentInstigatedConclude: boolean;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<ConcludingState> {
  // If the current player is instigating a conclude we send a message to the opponent
  // so they can start their process
  if (!opponentInstigatedConclude) {
    sharedData = sendConcludeInstigated(sharedData, channelId);
  }

  let concluding: AdvanceChannelState;
  ({ protocolState: concluding, sharedData } = initializeAdvanceChannel(sharedData, {
    channelId,
    clearedToSend: true,
    processId,
    ourIndex: getTwoPlayerIndex(channelId, sharedData),
    protocolLocator: makeLocator(EMPTY_LOCATOR, EmbeddedProtocol.AdvanceChannel),
    commitmentType: CommitmentType.Conclude,
  }));
  return {
    protocolState: states.waitForConclude({ channelId, processId, concluding }),
    sharedData,
  };
}
