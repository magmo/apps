import { getAdjudicatorContract } from '../../utils/contract-utils';
import { call, take, put, fork, cancel, actionChannel } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import * as actions from '../actions';
import { ethers } from 'ethers';
import { unreachable } from '../../utils/reducer-utils';
import { fromParameters } from 'fmg-core/lib/commitment';

enum AdjudicatorEventType {
  ChallengeCreated,
  Concluded,
  Refuted,
  RespondWithMove,
  Deposited,
}

interface AdjudicatorEvent {
  eventArgs: any;
  channelId: string;
  eventType: AdjudicatorEventType;
}

export function* adjudicatorWatcher(provider) {
  const registerActionChannel = yield actionChannel([
    actions.REGISTER_FOR_ADJUDICATOR_EVENTS,
    actions.UNREGISTER_FOR_ADJUDICATOR_EVENTS,
  ]);
  const adjudicatorWatchers = {};
  const adjudicatorEventChannel = yield call(createAdjudicatorEventChannel, provider);

  while (true) {
    const registerAction: actions.AdjudicatorRegisterAction = yield take(registerActionChannel);
    switch (registerAction.type) {
      case actions.REGISTER_FOR_ADJUDICATOR_EVENTS:
        // We cancel the existing listener and register the new one
        if (adjudicatorWatchers[registerAction.processId]) {
          yield cancel(adjudicatorWatchers[registerAction.processId]);
        }
        adjudicatorWatchers[registerAction.processId] = yield fork(
          adjudicatorWatcherForProcess,
          registerAction.processId,
          registerAction.channelIds,
          adjudicatorEventChannel,
        );
        break;
      case actions.UNREGISTER_FOR_ADJUDICATOR_EVENTS:
        if (adjudicatorWatchers[registerAction.processId]) {
          yield cancel(adjudicatorWatchers[registerAction.processId]);
        } else {
          throw new Error(
            `There is no adjudicator watcher registered for process ${registerAction.processId}`,
          );
        }
        break;
    }
  }
}

function* adjudicatorWatcherForProcess(
  processId: string,
  channelIdsToListenFor: string[],
  adjudicatorEventChannel,
) {
  while (true) {
    const event: AdjudicatorEvent = yield take(adjudicatorEventChannel);
    const { channelId } = event;
    // If it is not a channel we've been registered for we ignore the event
    if (channelIdsToListenFor.indexOf(channelId) === -1) {
      continue;
    }
    switch (event.eventType) {
      case AdjudicatorEventType.ChallengeCreated:
        const { commitment, finalizedAt } = event.eventArgs;
        yield put(
          actions.challengeCreatedEvent(
            processId,
            channelId,
            fromParameters(commitment),
            finalizedAt,
          ),
        );
        break;
      case AdjudicatorEventType.Concluded:
        yield put(actions.concludedEvent(processId, channelId));
        break;
      case AdjudicatorEventType.Refuted:
        yield put(
          actions.refutedEvent(processId, channelId, fromParameters(event.eventArgs.refutation)),
        );
        break;
      case AdjudicatorEventType.RespondWithMove:
        yield put(
          actions.respondWithMoveEvent(
            processId,
            channelId,
            fromParameters(event.eventArgs.response),
          ),
        );
        break;
      case AdjudicatorEventType.Deposited:
        yield put(
          actions.fundingReceivedEvent(
            processId,
            channelId,
            event.eventArgs.amountDeposited.toHexString(),
            event.eventArgs.destinationHoldings.toHexString(),
          ),
        );
        break;
      default:
        unreachable(event.eventType);
    }
  }
}

function* createAdjudicatorEventChannel(provider) {
  const adjudicator: ethers.Contract = yield call(getAdjudicatorContract, provider);

  return eventChannel(emitter => {
    const challengeCreatedFilter = adjudicator.filters.ChallengeCreated();
    const gameConcludedFilter = adjudicator.filters.Concluded();
    const refutedFilter = adjudicator.filters.Refuted();
    const respondWithMoveFilter = adjudicator.filters.RespondedWithMove();
    const depositedFilter = adjudicator.filters.Deposited();

    adjudicator.on(challengeCreatedFilter, (channelId, commitment, finalizedAt) => {
      emitter({
        eventType: AdjudicatorEventType.ChallengeCreated,
        channelId,
        eventArgs: { commitment, finalizedAt },
      });
    });
    adjudicator.on(gameConcludedFilter, channelId => {
      emitter({ eventType: AdjudicatorEventType.Concluded, channelId });
    });
    adjudicator.on(refutedFilter, (channelId, refutation) => {
      emitter({ eventType: AdjudicatorEventType.Refuted, eventArgs: { refutation }, channelId });
    });
    adjudicator.on(respondWithMoveFilter, (channelId, response) => {
      emitter({
        eventType: AdjudicatorEventType.RespondWithMove,
        eventArgs: { response },
        channelId,
      });
    });
    adjudicator.on(depositedFilter, (channelId, amountDeposited, destinationHoldings) => {
      emitter({
        eventType: AdjudicatorEventType.Deposited,
        eventArgs: { amountDeposited, destinationHoldings },
        channelId,
      });
    });
    return () => {
      // This function is called when the channel gets closed
      adjudicator.removeAllListeners(challengeCreatedFilter);
      adjudicator.removeAllListeners(gameConcludedFilter);
      adjudicator.removeAllListeners(refutedFilter);
      adjudicator.removeAllListeners(respondWithMoveFilter);
    };
  });
}
