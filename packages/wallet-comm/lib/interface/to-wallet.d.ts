import { State, Channel } from 'fmg-core';
export declare enum PlayerIndex {
    'A' = 0,
    'B' = 1
}
export declare const INITIALIZE_REQUEST = "WALLET.INITIALIZE_REQUEST";
export declare const initializeRequest: () => {
    type: "WALLET.INITIALIZE_REQUEST";
};
export declare type InitializeRequest = ReturnType<typeof initializeRequest>;
export declare const FUNDING_REQUEST = "WALLET.FUNDING.REQUEST";
export declare const fundingRequest: (channelId: string, myAddress: string, opponentAddress: string, myBalance: any, opponentBalance: any, playerIndex: PlayerIndex) => {
    type: "WALLET.FUNDING.REQUEST";
    channelId: string;
    myAddress: string;
    opponentAddress: string;
    myBalance: any;
    opponentBalance: any;
    playerIndex: PlayerIndex;
};
export declare type FundingRequest = ReturnType<typeof fundingRequest>;
export declare const OPEN_CHANNEL_REQUEST = "WALLET.CHANNEL.REQUEST.OPEN";
export declare const openChannelRequest: (channel: Channel) => {
    type: "WALLET.CHANNEL.REQUEST.OPEN";
    channel: Channel;
};
export declare type OpenChannelRequest = ReturnType<typeof openChannelRequest>;
export declare const CONCLUDE_CHANNEL_REQUEST = "WALLET.CHANNEL.REQUEST.CONCLUDE";
export declare const concludeChannelRequest: () => {
    type: "WALLET.CHANNEL.REQUEST.CONCLUDE";
};
export declare type ConcludeChannelRequest = ReturnType<typeof concludeChannelRequest>;
export declare const CLOSE_CHANNEL_REQUEST = "WALLET.CHANNEL.REQUEST.CLOSE";
export declare const closeChannelRequest: () => {
    type: "WALLET.CHANNEL.REQUEST.CLOSE";
};
export declare type CloseChannelRequest = ReturnType<typeof closeChannelRequest>;
export declare const VALIDATION_REQUEST = "WALLET.VALIDATION.REQUEST";
export declare const validationRequest: (requestId: string, data: any, signature: string) => {
    type: "WALLET.VALIDATION.REQUEST";
    requestId: string;
    data: any;
    signature: string;
};
export declare type ValidationRequest = ReturnType<typeof validationRequest>;
export declare const SIGNATURE_REQUEST = "WALLET.SIGNATURE.REQUEST";
export declare const signatureRequest: (requestId: string, data: any) => {
    type: "WALLET.SIGNATURE.REQUEST";
    requestId: string;
    data: any;
};
export declare type SignatureRequest = ReturnType<typeof signatureRequest>;
export declare const WITHDRAWAL_REQUEST = "WALLET.WITHDRAWAL.REQUEST";
export declare const withdrawalRequest: (position: State) => {
    type: "WALLET.WITHDRAWAL.REQUEST";
    position: State;
};
export declare type WithdrawalRequest = ReturnType<typeof withdrawalRequest>;
export declare const CREATE_CHALLENGE_REQUEST = "WALLET.CHALLENGE.CREATE";
export declare const createChallenge: () => {
    type: "WALLET.CHALLENGE.CREATE";
};
export declare type CreateChallengeRequest = ReturnType<typeof createChallenge>;
export declare const RESPOND_TO_CHALLENGE = "RESPOND_TO_CHALLENGE";
export declare const respondToChallenge: (position: string) => {
    position: string;
    type: "RESPOND_TO_CHALLENGE";
};
export declare type RespondToChallenge = ReturnType<typeof respondToChallenge>;
export declare const RECEIVE_MESSAGE = "WALLET.MESSAGING.RECEIVE";
export declare const receiveMessage: (data: string, signature?: string) => {
    type: string;
    data: string;
    signature: string;
};
export declare type ReceiveMessage = ReturnType<typeof receiveMessage>;
export declare const MESSAGE_SENT = "WALLET.MESSAGING.MESSAGE_SENT";
export declare const messageSent: (positionData: string, signature: string) => {
    type: "WALLET.MESSAGING.MESSAGE_SENT";
    positionData: string;
    signature: string;
};
export declare type MessageSent = ReturnType<typeof messageSent>;
export declare type RequestAction = OpenChannelRequest | CloseChannelRequest | FundingRequest | SignatureRequest | ValidationRequest | WithdrawalRequest | CreateChallengeRequest | ConcludeChannelRequest;
