import * as states from './state';
import { ProtocolStateWithSharedData } from '../';
import { SharedData, queueMessage } from '../../state';
import { ethers } from 'ethers';
import { channelInitializationSuccess } from 'magmo-wallet-client';

export function initialize(
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.AddressKnown> {
  const { address, privateKey } = ethers.Wallet.createRandom();
  const newSharedData = queueMessage(sharedData, channelInitializationSuccess(address));
  return {
    protocolState: states.addressKnown(address, privateKey),
    sharedData: newSharedData,
  };
}
