import { getAdjudicatorContract } from '../../utils/contract-utils';
import { call, take, put, select } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import * as actions from '../actions';
import { ethers } from 'ethers';
import { getAdjudicatorWatcherSubscribersForChannel } from '../selectors';
import { ChannelSubscriber } from '../state';
import { ProtocolLocator } from '../../communication';
import { SignedState } from 'nitro-protocol';

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

function decodeState(encodedState: string): SignedState {
  throw new Error('Not implemented yet! Sorry!');
}

export function* adjudicatorWatcher(provider) {
  const adjudicatorEventChannel = yield call(createAdjudicatorEventChannel, provider);
  while (true) {
    const event: AdjudicatorEvent = yield take(adjudicatorEventChannel);

    const channelSubscribers: ChannelSubscriber[] = yield select(
      getAdjudicatorWatcherSubscribersForChannel,
      event.channelId,
    );

    yield dispatchEventAction(event);
    for (const subscriber of channelSubscribers) {
      yield dispatchProcessEventAction(event, subscriber.processId, subscriber.protocolLocator);
    }
  }
}

function* dispatchEventAction(event: AdjudicatorEvent) {
  // TODO: SignedStates were thrown on here to get things compiling
  // This still needs to be updated to the actual events the nitro protocol will generate
  switch (event.eventType) {
    case AdjudicatorEventType.ChallengeCreated:
      const { channelId } = event;
      const { signedState, finalizedAt } = event.eventArgs;
      const altFinalizedAt = finalizedAt * 1000;
      yield put(
        actions.challengeCreatedEvent({
          channelId,
          signedState: decodeState(signedState),
          finalizedAt: altFinalizedAt,
        }),
      );
      break;
  }
}

function* dispatchProcessEventAction(
  event: AdjudicatorEvent,
  processId: string,
  protocolLocator: ProtocolLocator,
) {
  const { channelId } = event;
  switch (event.eventType) {
    case AdjudicatorEventType.ChallengeCreated:
      const { finalizedAt } = event.eventArgs;
      yield put(
        actions.challengeExpirySetEvent({
          processId,
          protocolLocator,
          channelId,
          expiryTime: finalizedAt * 1000,
        }),
      );
      break;
    case AdjudicatorEventType.Concluded:
      yield put(actions.concludedEvent({ channelId }));
      break;
    case AdjudicatorEventType.Refuted:
      yield put(
        actions.refutedEvent({
          processId,
          protocolLocator,
          channelId,
          refuteState: decodeState(event.eventArgs.refuteState),
        }),
      );
      break;
    case AdjudicatorEventType.RespondWithMove:
      yield put(
        actions.respondWithMoveEvent({
          processId,
          protocolLocator,
          channelId,
          responseState: decodeState(event.eventArgs.responseState),
        }),
      );
      break;
    case AdjudicatorEventType.Deposited:
      yield put(
        actions.fundingReceivedEvent({
          processId,
          protocolLocator,
          channelId,
          amount: event.eventArgs.amountDeposited.toHexString(),
          totalForDestination: event.eventArgs.destinationHoldings.toHexString(),
        }),
      );
      break;
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
    adjudicator.on(respondWithMoveFilter, (channelId, response, v, r, s) => {
      emitter({
        eventType: AdjudicatorEventType.RespondWithMove,
        eventArgs: { response, v, r, s },
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
