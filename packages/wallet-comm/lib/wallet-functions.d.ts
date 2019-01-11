import { Channel } from 'fmg-core';
import BN from 'bn.js';
export declare function initializeWallet(iFrameId: string, userId: string): Promise<string>;
export declare function openChannel(iFrameId: string, channel: Channel): Promise<string>;
export declare function validateSignature(iFrameId: string, data: any, signature: string): Promise<boolean>;
export declare function signData(iFrameId: string, data: any): Promise<string>;
export declare function requestFunding(iFrameId: string, channelId: string, myAddress: string, opponentAddress: string, myBalance: BN, opponentBalance: BN, playerIndex: number): Promise<{
    channelId: any;
    position: any;
}>;
