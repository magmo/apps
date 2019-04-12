import { call, put } from 'redux-saga/effects';
import * as actions from '../actions';
import { ethers } from 'ethers';
import { getProvider, getAdjudicatorContractAddress } from '../../utils/contract-utils';
import { TransactionResponse } from 'ethers/providers';
import { QueuedTransaction } from '../outbox';

export function* transactionSender(transaction: QueuedTransaction) {
  const provider: ethers.providers.JsonRpcProvider = yield call(getProvider);
  const signer = provider.getSigner();
  const { processId, requestId, transactionRequest } = transaction;
  yield put(actions.transactionSentToMetamask(processId, requestId));
  let transactionResult: TransactionResponse;
  try {
    const contractAddress = yield call(getAdjudicatorContractAddress, provider);
    transactionResult = yield call([signer, signer.sendTransaction], {
      ...transactionRequest,
      to: contractAddress,
    });
  } catch (err) {
    yield put(actions.transactionSubmissionFailed(processId, requestId, err));
    return;
  }
  yield put(
    actions.transactionSubmitted(
      processId,
      requestId,
      transactionResult.hash ? transactionResult.hash : '',
    ),
  );
  const confirmedTransaction = yield call([transactionResult, transactionResult.wait]);
  yield put(
    actions.transactionConfirmed(processId, requestId, confirmedTransaction.contractAddress),
  );
  // TODO: Figure out how to wait for a transaction to be X blocks deep
  // yield call(transactionResult.wait, 5);
  yield put(actions.transactionFinalized(processId, requestId));
}
