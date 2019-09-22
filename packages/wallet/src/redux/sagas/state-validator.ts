import { ValidationRequest } from '../outbox/state';
import { validTransition } from 'nitro-protocol/lib/src/validation';
import * as channelActions from '../channel-store/actions';
import { put } from 'redux-saga/effects';

export function* stateValidator(validationRequest: ValidationRequest, provider) {
  const { previousState, statesToValidate } = validationRequest;
  if (
    (!previousState && statesToValidate.length < 2) ||
    (previousState && statesToValidate.length < 1)
  ) {
    throw new Error('Require at least 2 states to validate');
  }
  const signer = provider.getSigner();
  let valid: boolean = true;
  if (previousState) {
    valid = valid || (yield validTransition(signer, previousState, statesToValidate[0]));
  }
  for (let i = 1; i < statesToValidate.length; i++) {
    valid = valid || (yield validTransition(signer, statesToValidate[i], statesToValidate[i - 1]));
  }

  yield put(
    channelActions.validationComplete({
      signedStates: statesToValidate,
      valid,
    }),
  );
}
