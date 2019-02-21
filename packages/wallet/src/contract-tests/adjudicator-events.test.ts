import { adjudicatorWatcher } from "../redux/sagas/adjudicator-watcher";
import { ethers } from "ethers";
import SagaTester from 'redux-saga-tester';
import * as actions from "../redux/actions";
import { depositContract, createChallenge, concludeGame, refuteChallenge, respondWithMove, getChannelId } from './test-utils';
import { getAdjudicatorContractAddress } from '../utils/contract-utils';

jest.setTimeout(60000);

describe('adjudicator listener', () => {
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(`http://localhost:${process.env.DEV_GANACHE_PORT}`);

  const participantA = ethers.Wallet.createRandom();
  const participantB = ethers.Wallet.createRandom();
  let nonce = 5;
  function getNextNonce() {
    return ++nonce;
  }
  const participants = [participantA.address, participantB.address];

  it("should handle a funds received event", async () => {
    const channelId = await getChannelId(provider, getNextNonce(), participantA, participantB);
    const contractAddress = await getAdjudicatorContractAddress(provider);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, channelId, participants, provider);
    await depositContract(provider, contractAddress, participantA.address);
    await sagaTester.waitFor(actions.FUNDING_RECEIVED_EVENT);

    const action: actions.FundingReceivedEvent = sagaTester.getLatestCalledAction();
    expect(action.type).toEqual(actions.FUNDING_RECEIVED_EVENT);
    expect(action.destination).toEqual(participantA.address);
    expect(action.amount).toEqual('0x05');
    expect(action.totalForDestination).toEqual('0x05');

  });

  it("should handle a challengeCreated event", async () => {
    const startTimestamp = Date.now();
    const channelNonce = getNextNonce();
    const channelId = await getChannelId(provider, channelNonce, participantA, participantB);
    const contractAddress = await getAdjudicatorContractAddress(provider);
    await depositContract(provider, contractAddress, participantA.address);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, channelId, participants, provider);
    const challengeState = await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.CHALLENGE_CREATED_EVENT);
    const action: actions.ChallengeCreatedEvent = sagaTester.getLatestCalledAction();

    expect(action.finalizedAt * 1000).toBeGreaterThan(startTimestamp);
    expect(action.commitment).toEqual(challengeState);
  });

  it("should handle a concluded event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    const channelId = await getChannelId(provider, channelNonce, participantA, participantB);
    await depositContract(provider, contractAddress, participantA.address);
    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, channelId, participants, provider);
    await concludeGame(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.CONCLUDED_EVENT);
    const action: actions.concludedEvent = sagaTester.getLatestCalledAction();
    // TODO: We should check the channel ID
    expect(action.channelId).toBeDefined();
  });

  it("should handle a refute event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    const channelId = await getChannelId(provider, channelNonce, participantA, participantB);
    await depositContract(provider, contractAddress, participantA.address);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, channelId, participants, provider);
    const refuteCommitment = await refuteChallenge(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.REFUTED_EVENT);
    const action: actions.RefutedEvent = sagaTester.getLatestCalledAction();
    expect(action.type === actions.REFUTED_EVENT);
    expect(action.refuteCommitment).toEqual(refuteCommitment);
  });


  it("should handle a respondWithMove event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    const channelId = await getChannelId(provider, channelNonce, participantA, participantB);
    await depositContract(provider, contractAddress, participantA.address);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, channelId, participants, provider);
    const responseState = await respondWithMove(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.RESPOND_WITH_MOVE_EVENT);
    const action: actions.RespondWithMoveEvent = sagaTester.getLatestCalledAction();
    expect(action.type === actions.RESPOND_WITH_MOVE_EVENT);
    expect(action.responseCommitment).toEqual(responseState);
  });


});
