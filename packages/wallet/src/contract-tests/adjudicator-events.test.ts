import { adjudicatorWatcher } from "../redux/sagas/adjudicator-watcher";
import { ethers } from "ethers";
import SagaTester from 'redux-saga-tester';
import * as actions from "../redux/actions";
import { depositContract, createChallenge, concludeGame, refuteChallenge, respondWithMove } from './test-utils';
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


  it("should handle a challengeCreated event", async () => {
    const startTimestamp = Date.now();
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    await depositContract(provider, contractAddress, participantA.address);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, provider);
    const challengeState = await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.CHALLENGE_CREATED_EVENT);
    const action: actions.ChallengeCreatedEvent = sagaTester.getLatestCalledAction();

    expect(action.finalizedAt * 1000).toBeGreaterThan(startTimestamp);
    expect(action.commitment).toEqual(challengeState);
  });

  it("should handle a concluded event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    await depositContract(provider, contractAddress, participantA.address);
    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, provider);
    await concludeGame(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.CONCLUDED_EVENT);
    const action: actions.concludedEvent = sagaTester.getLatestCalledAction();
    // TODO: We should check the channel ID
    expect(action.channelId).toBeDefined();
  });

  it("should handle a refute event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    await depositContract(provider, contractAddress, participantA.address);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, contractAddress, provider);
    const refuteCommitment = await refuteChallenge(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.REFUTED_EVENT);
    const action = sagaTester.getLatestCalledAction();
    expect(action.type === actions.REFUTED_EVENT);
    expect(action.refuteCommitment).toEqual(refuteCommitment);
  });


  it("should handle a respondWithMove event", async () => {
    const channelNonce = getNextNonce();
    const contractAddress = await getAdjudicatorContractAddress(provider);
    await depositContract(provider, contractAddress, participantA.address);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);

    const sagaTester = new SagaTester({});
    sagaTester.start(adjudicatorWatcher, provider);
    const responseState = await respondWithMove(provider, contractAddress, channelNonce, participantA, participantB);
    await sagaTester.waitFor(actions.RESPOND_WITH_MOVE_EVENT);
    const action: actions.RespondWithMoveEvent = sagaTester.getLatestCalledAction();
    expect(action.type === actions.RESPOND_WITH_MOVE_EVENT);
    expect(action.responseCommitment).toEqual(responseState);
  });


});
