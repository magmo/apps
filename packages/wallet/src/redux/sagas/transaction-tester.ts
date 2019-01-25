import { call } from "redux-saga/effects";
import { ethers } from "ethers";
import { getProvider } from "../../utils/contract-utils";


export function* transactionTester(transaction) {
  // TODO: We'd put appropriate actions here 
  const provider: ethers.providers.JsonRpcProvider = yield call(getProvider);
  yield provider.call(transaction);


}