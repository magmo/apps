import { getAdjudicatorContract } from "../../utils/contract-utils";
import { call, take, put } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import * as actions from "../actions";
import { ethers } from "ethers";
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
  eventType: AdjudicatorEventType;
}
// event ChallengeCreated(
//   address channelId,
//   Commitment.CommitmentStruct commitment,
//   uint256 finalizedAt
// );
// event Concluded(address channelId);
// event Refuted(address channelId, Commitment.CommitmentStruct refutation);
// event RespondedWithMove(address channelId, Commitment.CommitmentStruct response);
// event RespondedWithAlternativeMove(Commitment.CommitmentStruct alternativeResponse);

function* createEventChannel(provider, channelId: string, participants: string[]) {
  console.log(provider);
  const simpleAdjudicator: ethers.Contract = yield call(getAdjudicatorContract, provider);

  return eventChannel((emitter) => {

    const challengeCreatedFilter = simpleAdjudicator.filters.ChallengeCreated();
    const gameConcludedFilter = simpleAdjudicator.filters.Concluded();
    const refutedFilter = simpleAdjudicator.filters.Refuted();
    const respondWithMoveFilter = simpleAdjudicator.filters.RespondedWithMove();
    const depositedFilter = simpleAdjudicator.filters.Deposited();

    simpleAdjudicator.on(challengeCreatedFilter, (cId, commitment, finalizedAt) => {
      if (channelId === cId) {
        emitter({ eventType: AdjudicatorEventType.ChallengeCreated, eventArgs: { channelId, commitment, finalizedAt } });
      }
    });
    simpleAdjudicator.on(gameConcludedFilter, (cId) => {
      if (channelId === cId) {
        emitter({ eventType: AdjudicatorEventType.Concluded, eventArgs: { channelId } });
      }
    });
    simpleAdjudicator.on(refutedFilter, (cId, refutation) => {
      if (channelId === cId) {
        emitter({ eventType: AdjudicatorEventType.Refuted, eventArgs: { channelId, refutation } });
      }
    });
    simpleAdjudicator.on(respondWithMoveFilter, (cId, response) => {
      if (channelId === cId) {
        emitter({ eventType: AdjudicatorEventType.RespondWithMove, eventArgs: { channelId, response } });
      }
    });
    simpleAdjudicator.on(depositedFilter, (destination, amountDeposited, destinationHoldings) => {
      if (participants.indexOf(destination) > -1) {
        emitter({ eventType: AdjudicatorEventType.Deposited, eventArgs: { destination, amountDeposited, destinationHoldings } });

      }
    });
    return () => {
      // This function is called when the channel gets closed
      simpleAdjudicator.removeAllListeners(challengeCreatedFilter);
      simpleAdjudicator.removeAllListeners(gameConcludedFilter);
      simpleAdjudicator.removeAllListeners(refutedFilter);
      simpleAdjudicator.removeAllListeners(respondWithMoveFilter);
    };
  });
}
export function* adjudicatorWatcher(channelId, participants, provider) {
  const channel = yield call(createEventChannel, provider, channelId, participants);
  while (true) {
    const event: AdjudicatorEvent = yield take(channel);
    switch (event.eventType) {
      case AdjudicatorEventType.ChallengeCreated:
        const { channelId: eventChannelId, commitment, finalizedAt, } = event.eventArgs;
        yield put(actions.challengeCreatedEvent(eventChannelId, fromParameters(commitment), finalizedAt));
        break;
      case AdjudicatorEventType.Concluded:

        yield put(actions.concludedEvent(event.eventArgs.channelId));
        break;
      case AdjudicatorEventType.Refuted:
        yield put(actions.refutedEvent(event.eventArgs.channelId, fromParameters(event.eventArgs.refutation)));
        break;
      case AdjudicatorEventType.RespondWithMove:
        yield put(actions.respondWithMoveEvent(event.eventArgs.channelId, fromParameters(event.eventArgs.response)));
        break;
      case AdjudicatorEventType.Deposited:
        yield put(actions.fundingReceivedEvent(event.eventArgs.destination, event.eventArgs.amountDeposited.toHexString(), event.eventArgs.destinationHoldings.toHexString()));
        break;
      default:
        unreachable(event.eventType);

    }

  }

}
