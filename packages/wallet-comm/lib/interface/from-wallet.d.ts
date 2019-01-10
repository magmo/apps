export declare const FUNDING_SUCCESS = "WALLET.FUNDING.SUCCESS";
export declare const FUNDING_FAILURE = "WALLET.FUNDING.FAILURE";
export declare const fundingSuccess: (channelId: any, position: string) => {
    type: "WALLET.FUNDING.SUCCESS";
    channelId: any;
    position: string;
};
export declare const fundingFailure: (channelId: any, reason: any) => {
    type: "WALLET.FUNDING.FAILURE";
    channelId: any;
    reason: any;
};
export declare type FundingSuccess = ReturnType<typeof fundingSuccess>;
export declare type FundingFailure = ReturnType<typeof fundingFailure>;
export declare type FundingResponse = FundingSuccess | FundingFailure;
export declare const CHANNEL_OPENED = "WALLET.CHANNEL.OPENED";
export declare const CHANNEL_CLOSED = "WALLET.CHANNEL.CLOSED";
export declare const channelOpened: (channelId: string) => {
    type: "WALLET.CHANNEL.OPENED";
    channelId: string;
};
export declare const channelClosed: (walletId: string) => {
    type: "WALLET.CHANNEL.CLOSED";
    walletId: string;
};
export declare type ChannelOpened = ReturnType<typeof channelOpened>;
export declare type ChannelClosed = ReturnType<typeof channelClosed>;
export declare const enum ValidationFailureReasons {
    WalletBusy = "WalletBusy",
    InvalidSignature = "InvalidSignature",
    Other = "Other"
}
export declare const VALIDATION_SUCCESS = "WALLET.VALIDATION.SUCCESS";
export declare const VALIDATION_FAILURE = "WALLET.VALIDATION.FAILURE";
export declare const validationSuccess: () => {
    type: "WALLET.VALIDATION.SUCCESS";
};
export declare const validationFailure: (reason: ValidationFailureReasons, error?: string) => {
    type: "WALLET.VALIDATION.FAILURE";
    reason: ValidationFailureReasons;
    error: string;
};
export declare type ValidationSuccess = ReturnType<typeof validationSuccess>;
export declare type ValidationFailure = ReturnType<typeof validationFailure>;
export declare type ValidationResponse = ValidationSuccess | ValidationFailure;
export declare const enum SignatureFailureReasons {
    WalletBusy = "WalletBusy",
    Other = "Other"
}
export declare const SIGNATURE_SUCCESS = "WALLET.SIGNATURE.SUCCESS";
export declare const SIGNATURE_FAILURE = "WALLET.SIGNATURE.FAILURE";
export declare const signatureSuccess: (signature: string) => {
    type: "WALLET.SIGNATURE.SUCCESS";
    signature: string;
};
export declare const signatureFailure: (reason: SignatureFailureReasons, error?: string) => {
    type: "WALLET.SIGNATURE.FAILURE";
    reason: SignatureFailureReasons;
    error: string;
};
export declare type SignatureSuccess = ReturnType<typeof signatureSuccess>;
export declare type SignatureFailure = ReturnType<typeof signatureFailure>;
export declare type SignatureResponse = SignatureSuccess | SignatureFailure;
export declare const WITHDRAWAL_SUCCESS = "WALLET.WITHDRAWAL.SUCCESS";
export declare const WITHDRAWAL_FAILURE = "WALLET.WITHDRAWAL.FAILURE";
export declare const withdrawalSuccess: (transaction: any) => {
    type: "WALLET.WITHDRAWAL.SUCCESS";
    transaction: any;
};
export declare const withdrawalFailure: (reason: any) => {
    type: "WALLET.WITHDRAWAL.FAILURE";
    reason: any;
};
export declare type WithdrawalSuccess = ReturnType<typeof withdrawalSuccess>;
export declare type WithdrawalFailure = ReturnType<typeof withdrawalFailure>;
export declare type WithdrawalResponse = WithdrawalSuccess | WithdrawalFailure;
export declare const INITIALIZATION_SUCCESS = "WALLET.INITIALIZATION.SUCCESS";
export declare const INITIALIZATION_FAILURE = "WALLET.INITIALIZATION.FAILURE";
export declare const initializationSuccess: (address: any) => {
    type: "WALLET.INITIALIZATION.SUCCESS";
    address: any;
};
export declare const initializationFailure: (message: string) => {
    type: "WALLET.INITIALIZATION.FAILURE";
    message: string;
};
export declare type InitializationSuccess = ReturnType<typeof initializationSuccess>;
export declare const CONCLUDE_SUCCESS = "WALLET.CONCLUDE.SUCCESS";
export declare const CONCLUDE_FAILURE = "WALLET.CONCLUDE.FAILURE";
export declare const concludeSuccess: () => {
    type: "WALLET.CONCLUDE.SUCCESS";
};
export declare const concludeFailure: (message: string) => {
    type: "WALLET.CONCLUDE.FAILURE";
    message: string;
};
export declare type ConcludeSuccess = ReturnType<typeof concludeSuccess>;
export declare type ConcludeFailure = ReturnType<typeof concludeFailure>;
export declare const CLOSE_SUCCESS = "WALLET.CLOSE.SUCCESS";
export declare const closeSuccess: () => {
    type: "WALLET.CLOSE.SUCCESS";
};
export declare type CloseSuccess = ReturnType<typeof closeSuccess>;
export declare const SEND_MESSAGE = "WALLET.MESSAGING.SEND";
export declare const sendMessage: (to: string, data: string, signature: string) => {
    type: "WALLET.MESSAGING.SEND";
    to: string;
    data: string;
    signature: string;
};
export declare type SendMessage = ReturnType<typeof sendMessage>;
export declare const MESSAGE_RECEIVED = "WALLET.MESSAGING.MESSAGE_RECEIVED";
export declare const messageReceived: (positionData: string, signature: string) => {
    type: "WALLET.MESSAGING.MESSAGE_RECEIVED";
    positionData: string;
    signature: string;
};
export declare type MessageReceived = ReturnType<typeof messageReceived>;
export declare const CHALLENGE_POSITION_RECEIVED = "WALLET.MESSAGING.CHALLENGE_POSITION_RECEIVED";
export declare const challengePositionReceived: (positionData: string) => {
    type: "WALLET.MESSAGING.CHALLENGE_POSITION_RECEIVED";
    positionData: string;
};
export declare type ChallengePositionReceived = ReturnType<typeof challengePositionReceived>;
export declare const CHALLENGE_REJECTED = "WALLET.CHALLENGING.CHALLENGE_REJECTED";
export declare const challengeRejected: (reason: any) => {
    type: "WALLET.CHALLENGING.CHALLENGE_REJECTED";
    reason: any;
};
export declare type ChallengeRejected = ReturnType<typeof challengeRejected>;
export declare const CHALLENGE_RESPONSE_REQUESTED = "CHALLENGE_RESPONSE_REQUESTED";
export declare const challengeResponseRequested: () => {
    type: "CHALLENGE_RESPONSE_REQUESTED";
};
export declare type ChallengeResponseRequested = ReturnType<typeof challengeResponseRequested>;
export declare const CHALLENGE_COMPLETE = "CHALLENGE_COMPLETE";
export declare const challengeComplete: () => {
    type: "CHALLENGE_COMPLETE";
};
export declare type ChallengeComplete = ReturnType<typeof challengeComplete>;
export declare type ResponseAction = InitializationSuccess | ConcludeSuccess | CloseSuccess | ValidationSuccess | ValidationFailure | FundingSuccess | FundingFailure | SignatureSuccess | SignatureFailure | ChallengePositionReceived | ChallengeRejected | ChallengeResponseRequested | ChallengeComplete | SendMessage;
