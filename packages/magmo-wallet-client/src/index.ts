/**
 * @module
 * The wallet client.
 */

export * from './wallet-types';
export * from './wallet-events';
export * from './wallet-functions';
export * from './wallet-instructions';

import * as walletEvents from './wallet-events';
import * as walletFunctions from './wallet-functions';
import * as walletInstructions from './wallet-instructions';
import { WalletEventListener } from './wallet-event-listener';
export { walletEvents, walletFunctions, walletInstructions, WalletEventListener };
