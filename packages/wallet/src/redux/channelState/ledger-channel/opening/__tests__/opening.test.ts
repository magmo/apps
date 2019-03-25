import * as states from '../../state';
import * as actions from '../../../../actions';
import * as SigningUtil from '../../../../../utils/signing-utils';
import { itTransitionsToChannelStateType } from '../../../../__tests__/helpers';
import * as scenarios from '../../../../__tests__/test-scenarios';

import { openingReducer } from '../reducer';

const { bsAddress, bsPrivateKey, preFundCommitment1 } = scenarios;

const bDefaults = {
  address: bsAddress,
  privateKey: bsPrivateKey,
};

describe('when in WaitForInitialPreFundSetup', () => {
  const state = states.waitForInitialPreFundSetup(bDefaults);
  describe('when we send in a PreFundSetupA', () => {
    const action = actions.commitmentReceived(preFundCommitment1, 'fake-sig');
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const updatedState = openingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });
});
