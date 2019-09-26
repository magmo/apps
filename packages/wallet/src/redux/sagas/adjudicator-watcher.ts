import { getNitroAdjudicatorContract } from '../../utils/contract-utils';
import { call, take, put, select } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import * as actions from '../actions';
import { ethers } from 'ethers';
import { fromParameters } from 'fmg-core/lib/commitment';
import { getAdjudicatorWatcherSubscribersForChannel } from '../selectors';
import { ChannelSubscriber } from '../state';
import { ProtocolLocator } from '../../communication';
import { BigNumber } from 'ethers/utils';
import { Address } from 'fmg-core';

enum AdjudicatorEventType {
  ChallengeRegistered,
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

export interface FixedPart {
  chainId: BigNumber;
  participants: Address[];
  channelNonce: BigNumber;
  appDefinition: Address;
  challengeDuration: BigNumber;
}

export interface VariablePart {
  outcome: string;
  appData: string;
}

interface ChallengeRegisteredArgs {
  channelId: string;
  largestTurnNum: number;
  finalizesAt: BigNumber;
  challenger: Address;
  isFinalCount: boolean;
  fixedPart: FixedPart;
  variablePart: VariablePart;
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
  switch (event.eventType) {
    case AdjudicatorEventType.ChallengeRegistered:
      const { channelId } = event;
      const args: ChallengeRegisteredArgs = event.eventArgs;
      const altFinalizedAt = args.finalizesAt.mul(1000);
      yield put(
        actions.challengeRegisteredEvent({
          channelId,
          finalizesAt: altFinalizedAt,
          challenger: args.challenger,
          isFinalCount: args.isFinalCount,
          fixedPart: args.fixedPart,
          variableParts: args.variablePart,
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
    case AdjudicatorEventType.ChallengeRegistered:
      const { finalizedAt } = event.eventArgs;
      yield put(
        actions.challengeExpirySetEvent({
          processId,
          protocolLocator,
          channelId,
          expiryTime: finalizedAt.mul(1000),
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
          refuteCommitment: fromParameters(event.eventArgs.refutation),
        }),
      );
      break;
    case AdjudicatorEventType.RespondWithMove:
      const { v, r, s } = event.eventArgs;
      const signature = ethers.utils.joinSignature({
        v,
        r,
        s,
      });

      yield put(
        actions.respondWithMoveEvent({
          processId,
          protocolLocator,
          channelId,
          responseCommitment: fromParameters(event.eventArgs.response),
          responseSignature: signature,
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
  const adjudicator: ethers.Contract = yield call(getNitroAdjudicatorContract, provider);

  return eventChannel(emitter => {
    const challengeRegisteredFilter = adjudicator.filters.ChallengeRegistered();
    const gameConcludedFilter = adjudicator.filters.Concluded();
    const refutedFilter = adjudicator.filters.Refuted();
    const respondWithMoveFilter = adjudicator.filters.RespondedWithMove();
    const depositedFilter = adjudicator.filters.Deposited();

    adjudicator.on(
      challengeRegisteredFilter,
      (
        channelId,
        largestTurnNum,
        challengeDuration,
        challenger,
        isFinalCount,
        fixedPart,
        variablePart,
      ) => {
        emitter({
          eventType: AdjudicatorEventType.ChallengeRegistered,
          channelId,
          eventArgs: {
            largestTurnNum,
            challengeDuration,
            challenger,
            isFinalCount,
            fixedPart,
            variablePart,
          },
        });
      },
    );
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
      adjudicator.removeAllListeners(challengeRegisteredFilter);
      adjudicator.removeAllListeners(gameConcludedFilter);
      adjudicator.removeAllListeners(refutedFilter);
      adjudicator.removeAllListeners(respondWithMoveFilter);
    };
  });
}
