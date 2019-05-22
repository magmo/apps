import * as scenarios from './scenarios';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { itSendsThisMessage } from '../../../__tests__/helpers';
import { initialize, applicationReducer } from '../reducer';
import {
  VALIDATION_SUCCESS,
  SIGNATURE_SUCCESS,
  VALIDATION_FAILURE,
  SIGNATURE_FAILURE,
} from 'magmo-wallet-client';

function whenIn(state) {
  return `when in ${state}`;
}

describe('initializing the application', () => {
  const scenario = scenarios.initializingApplication;
  const result = initialize(scenario.initialize.sharedData);
  itTransitionsTo(result, 'Application.AddressKnown');
});

describe('starting the application', () => {
  const scenario = scenarios.startingApplication;

  describe(whenIn('Application.AddressKnown'), () => {
    const { state, sharedData, action } = scenario.addressKnown;

    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Ongoing');
    itSendsThisMessage(result, SIGNATURE_SUCCESS);
  });
});

describe('signing a commitment', () => {
  const scenario = scenarios.receivingOurCommitment;

  describe(whenIn('Application.Ongoing'), () => {
    const { state, sharedData, action } = scenario.ongoing;
    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Ongoing');
    itSendsThisMessage(result, SIGNATURE_SUCCESS);
  });
});

describe('signing an invalid commitment', () => {
  const scenario = scenarios.receivingOurInvalidCommitment;

  describe(whenIn('Application.Ongoing'), () => {
    const { state, sharedData, action } = scenario.ongoing;

    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Ongoing');
    itSendsThisMessage(result, SIGNATURE_FAILURE);
  });
});

describe('validating a commitment', () => {
  const scenario = scenarios.receivingTheirCommitment;

  describe(whenIn('Application.Ongoing'), () => {
    const { state, sharedData, action } = scenario.ongoing;

    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Ongoing');
    itSendsThisMessage(result, VALIDATION_SUCCESS);
  });
});

describe('validating an invalid commitment', () => {
  const scenario = scenarios.receivingTheirInvalidCommitment;

  describe(whenIn('Application.Ongoing'), () => {
    const { state, sharedData, action } = scenario.ongoing;

    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Ongoing');
    itSendsThisMessage(result, VALIDATION_FAILURE);
  });
});

describe('receiving a close request', () => {
  const scenario = scenarios.receivingACloseRequest;

  describe(whenIn('Application.Ongoing'), () => {
    const { state, sharedData, action } = scenario.ongoing;

    const result = applicationReducer(state, sharedData, action);

    itTransitionsTo(result, 'Application.Success');
  });
});

function itTransitionsTo(
  result: ProtocolStateWithSharedData<states.ApplicationState>,
  type: states.ApplicationStateType,
) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}
