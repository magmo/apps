import * as states from '../state';
import { initialize, indirectDefundingReducer } from '../reducer';
import * as scenarios from './scenarios';
import { Commitment } from 'magmo-wallet-client/node_modules/fmg-core';
import { ProtocolStateWithSharedData } from '../..';
import { expectThisCommitmentSent } from '../../../__tests__/helpers';

const itTransitionsTo = (
  result: { protocolState: states.IndirectDefundingState },
  type: string,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

const itTransitionsToFailure = (
  result: { protocolState: states.IndirectDefundingState },
  failure: states.Failure,
) => {
  it(`transitions to failure with reason ${failure.reason}`, () => {
    expect(result.protocolState).toMatchObject(failure);
  });
};

export const itSendsThisCommitment = (
  state: ProtocolStateWithSharedData<states.IndirectDefundingState>,
  commitment: Partial<Commitment>,
) => {
  it('sends the correct commitment', () => {
    expectThisCommitmentSent(state.sharedData, commitment);
  });
};
describe('player A happy path', () => {
  const scenario = scenarios.playerAHappyPath;
  const { processId, channelId, sharedData } = scenario;

  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, states.WAIT_FOR_LEDGER_UPDATE);
    itSendsThisCommitment(result, scenario.firstUpdateCommitment);
  });

  describe(`when in ${states.WAIT_FOR_LEDGER_UPDATE}`, () => {
    const state = scenario.states.waitForLedgerUpdate;
    const action = scenario.actions.commitmentReceived;
    const result = indirectDefundingReducer(state, sharedData, action);

    itSendsThisCommitment(result, scenario.secondUpdateCommitment);
    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('player B happy path', () => {
  const scenario = scenarios.playerBHappyPath;
  const { processId, channelId, sharedData } = scenario;

  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, states.WAIT_FOR_LEDGER_UPDATE);
    itSendsThisCommitment(result, scenario.updateCommitment);
  });

  describe(`when in ${states.WAIT_FOR_LEDGER_UPDATE}`, () => {
    const state = scenario.states.waitForLedgerUpdate;
    const action = scenario.actions.firstCommitmentReceived;
    const result = indirectDefundingReducer(state, sharedData, action);

    itSendsThisCommitment(result, scenario.updateCommitment);
    itTransitionsTo(result, states.WAIT_FOR_FINAL_LEDGER_UPDATE);
  });

  describe(`when in ${states.WAIT_FOR_FINAL_LEDGER_UPDATE}`, () => {
    const state = scenario.states.waitForFinalLedgerUpdate;
    const action = scenario.actions.finalCommitmentReceived;
    const result = indirectDefundingReducer(state, sharedData, action);

    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('not defundable', () => {
  const scenario = scenarios.notDefundable;
  const { processId, channelId, sharedData } = scenario;

  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData);
    itTransitionsToFailure(result, scenario.states.failure);
  });
});
