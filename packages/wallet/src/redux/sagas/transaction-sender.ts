import { ethers } from 'ethers';
import { TransactionResponse } from 'ethers/providers';
import { call, put } from 'redux-saga/effects';
import { ADJUDICATOR_ADDRESS } from '../../constants';
import { getProvider } from '../../utils/contract-utils';
import * as actions from '../actions';
import { QueuedTransaction } from '../outbox';

export function* transactionSender(transaction: QueuedTransaction) {
  const provider: ethers.providers.JsonRpcProvider = yield call(getProvider);
  const signer = provider.getSigner();
  const { processId } = transaction;
  yield put(actions.transactionSent({ processId }));
  let transactionResult: TransactionResponse;
  try {
    transactionResult = yield call([signer, signer.sendTransaction], {
      ...transaction.transactionRequest,
      to: ADJUDICATOR_ADDRESS,
    });
  } catch (error) {
    yield put(actions.transactionSubmissionFailed({ processId, error }));
    return;
  }
  const transactionHash = transactionResult.hash ? transactionResult.hash : '';
  yield put(actions.transactionSubmitted({ processId, transactionHash }));
  const confirmedTransaction = yield call([transactionResult, transactionResult.wait]);
  yield put(
    actions.transactionConfirmed({
      processId,
      contractAddress: confirmedTransaction.contractAddress,
    }),
  );
}
