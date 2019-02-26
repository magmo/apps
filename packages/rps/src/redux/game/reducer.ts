import { Reducer } from 'redux';
import BN from 'bn.js';

import * as actions from './actions';
import * as states from './state';
import { randomHex } from '../../utils/randomHex';
import { calculateResult, balancesAfterResult, calculateAbsoluteResult, Player } from '../../core';

import { MessageState, sendMessage } from '../message-service/state';
import { LoginSuccess, LOGIN_SUCCESS, InitializeWalletSuccess, INITIALIZE_WALLET_SUCCESS } from '../login/actions';
import * as rpsCommitmentHelper from '../../core/rps-commitment-helper';
import hexToBN from '../../utils/hexToBN';
import bnToHex from '../../utils/bnToHex';
import { PositionType } from '../../core/rps-commitment';
import { Channel, CommitmentType } from 'fmg-core';
import { bigNumberify } from 'ethers/utils';

export interface JointState {
  gameState: states.GameState;
  messageState: MessageState;
}

const emptyJointState: JointState = {
  messageState: {},
  gameState: states.noName({ myAddress: "", libraryAddress: "" }),
};

export const gameReducer: Reducer<JointState> = (state = emptyJointState,
  action: actions.GameAction | LoginSuccess | InitializeWalletSuccess) => {
  // Filter out any actions except for game actions, and specific login/wallet actions
  // TODO: We should find a better way of handling this
  if (!action.type.startsWith('GAME') &&
    action.type !== actions.UPDATE_PROFILE &&
    action.type !== LOGIN_SUCCESS &&
    action.type !== INITIALIZE_WALLET_SUCCESS) {
    return state;
  }
  if (action.type === actions.EXIT_TO_LOBBY && state.gameState.name !== states.StateName.NoName) {
    const myAddress = ('myAddress' in state.gameState) ? state.gameState.myAddress : "";
    const myName = ('myName' in state.gameState) ? state.gameState.myName : "";
    const libraryAddress = ('channel' in state.gameState) ? state.gameState.channel.channelType : "";
    const newGameState = states.lobby({ ...state.gameState, libraryAddress, myAddress, myName });
    return { gameState: newGameState, messageState: {} };
  }

  if (action.type === actions.MESSAGE_SENT) {

    const { messageState, gameState } = state;
    const { actionToRetry } = messageState;
    return { gameState, messageState: { actionToRetry } };
  }
  if (action.type === LOGIN_SUCCESS) {
    const { messageState, gameState } = state;
    const { libraryAddress } = action;
    return { gameState: { ...gameState, libraryAddress }, messageState };
  }
  if (action.type === INITIALIZE_WALLET_SUCCESS) {
    const { messageState, gameState } = state;
    const { address: myAddress } = action;
    return { gameState: { ...gameState, myAddress }, messageState };
  }
  if (action.type === actions.CHALLENGE_RESPONSE_REQUESTED) {
    if (state.gameState.name === states.StateName.PickMove) {
      const { messageState, gameState } = state;
      return {
        gameState: states.pickChallengeMove(gameState),
        messageState,
      };
    } else if (state.gameState.name === states.StateName.PlayAgain) {
      const { messageState, gameState } = state;
      return {
        gameState: states.challengePlayAgain(gameState),
        messageState,
      };
    } else {
      return state;
    }
  }

  // apply the current action to the state
  state = singleActionReducer(state, action);
  // if we have saved an action previously, see if that will apply now
  state = attemptRetry(state);
  return state;
};

function attemptRetry(state: JointState): JointState {
  const { gameState } = state;
  let { messageState } = state;

  const actionToRetry = messageState.actionToRetry;
  if (actionToRetry) {

    messageState = { ...messageState, actionToRetry: undefined };
    state = singleActionReducer({ messageState, gameState }, actionToRetry);
  }
  return state;
}

function singleActionReducer(state: JointState, action: actions.GameAction) {
  const { messageState, gameState } = state;
  switch (gameState.name) {
    case states.StateName.NoName:
      return noNameReducer(gameState, messageState, action);
    case states.StateName.Lobby:
      return lobbyReducer(gameState, messageState, action);
    case states.StateName.CreatingOpenGame:
      return creatingOpenGameReducer(gameState, messageState, action);
    case states.StateName.WaitingRoom:
      return waitingRoomReducer(gameState, messageState, action);
    case states.StateName.WaitForGameConfirmationA:
      return waitForGameConfirmationAReducer(gameState, messageState, action);
    case states.StateName.WaitForGameConfirmationA:
      return waitForGameConfirmationAReducer(gameState, messageState, action);
    case states.StateName.ConfirmGameB:
      return confirmGameBReducer(gameState, messageState, action);
    case states.StateName.WaitForFunding:
      return waitForFundingReducer(gameState, messageState, action);
    case states.StateName.PickMove:
      return pickMoveReducer(gameState, messageState, action);
    case states.StateName.WaitForOpponentToPickMoveA:
      return waitForOpponentToPickMoveAReducer(gameState, messageState, action);
    case states.StateName.WaitForOpponentToPickMoveB:
      return waitForOpponentToPickMoveBReducer(gameState, messageState, action);
    case states.StateName.WaitForRevealB:
      return waitForRevealBReducer(gameState, messageState, action);
    case states.StateName.PlayAgain:
      return playAgainReducer(gameState, messageState, action);
    case states.StateName.WaitForRestingA:
      return waitForRestingAReducer(gameState, messageState, action);
    case states.StateName.GameOver:
      return gameOverReducer(gameState, messageState, action);
    case states.StateName.WaitForWithdrawal:
      return waitForWithdrawalReducer(gameState, messageState, action);
    case states.StateName.PickChallengeMove:
      return pickChallengeMoveReducer(gameState, messageState, action);
    case states.StateName.ChallengePlayAgain:
      return challengePlayAgainReducer(gameState, messageState, action);
    default:
      throw new Error("Unreachable code");
  }
}

function noNameReducer(
  gameState: states.NoName,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  switch (action.type) {
    case actions.UPDATE_PROFILE:
      const { name, twitterHandle } = action;
      const { myAddress, libraryAddress } = gameState;

      const lobby = states.lobby({
        ...action,
        myName: name,
        myAddress,
        libraryAddress,
        twitterHandle,
      });
      return { gameState: lobby, messageState };
    default:
      return { gameState, messageState };
  }
}

function lobbyReducer(
  gameState: states.Lobby,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  switch (action.type) {
    case actions.NEW_OPEN_GAME:
      const newGameState = states.creatingOpenGame({ ...gameState });
      return { gameState: newGameState, messageState };
    case actions.JOIN_OPEN_GAME:
      const { roundBuyIn, opponentAddress, channelNonce, opponentName } = action;
      const { myName, myAddress, libraryAddress, twitterHandle } = gameState;
      const allocation = [bigNumberify(roundBuyIn).mul(5).toHexString(), bigNumberify(roundBuyIn).mul(5).toHexString()] as [string, string];

      const participants: [string, string] = [myAddress, opponentAddress];
      const turnNum = 0;
      const commitmentCount = 1;
      const channel: Channel = { channelType: libraryAddress, participants, channelNonce };
      const waitForConfirmationState = states.waitForGameConfirmationA({
        channel, roundBuyIn, opponentName, myName, allocation, destination: participants, turnNum, commitmentCount, libraryAddress, twitterHandle, myAddress,
      });
      messageState = sendMessage(
        rpsCommitmentHelper.preFundSetupA(waitForConfirmationState),
        opponentAddress,
        messageState
      );
      return { gameState: waitForConfirmationState, messageState };
    default:
      return { gameState, messageState };
  }
}

function creatingOpenGameReducer(
  gameState: states.CreatingOpenGame,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  switch (action.type) {
    case actions.CREATE_OPEN_GAME:
      const newGameState = states.waitingRoom({
        ...gameState,
        roundBuyIn: action.roundBuyIn,
      });
      return { gameState: newGameState, messageState };
    case actions.CANCEL_OPEN_GAME:
      const newGameState1 = states.lobby(gameState);
      return { gameState: newGameState1, messageState };
    default:
      return { gameState, messageState };
  }
}

function waitingRoomReducer(
  gameState: states.WaitingRoom,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  switch (action.type) {
    case actions.INITIAL_POSITION_RECEIVED:
      const { position, opponentName } = action;
      const { myName, twitterHandle, myAddress } = gameState;

      if (position.commitmentType !== CommitmentType.PreFundSetup ||
        position.commitmentCount !== 0) {
        return { gameState, messageState };
      }

      const newGameState = states.confirmGameB({ ...position, roundBuyIn: position.stake, myName, opponentName, twitterHandle, myAddress });
      return { gameState: newGameState, messageState };
    case actions.CANCEL_OPEN_GAME:
      const newGameState1 = states.lobby(gameState);
      return { gameState: newGameState1, messageState };
    default:
      return { gameState, messageState };
  }
}

function itsMyTurn(gameState: states.PlayingState) {
  const nextTurnNum = gameState.turnNum + 1;
  return nextTurnNum % 2 === gameState.player;
}

function resignationReducer(
  gameState: states.PlayingState,
  messageState: MessageState
): JointState {
  if (itsMyTurn(gameState)) {
    messageState = {
      ...messageState,
      walletOutbox: { type: "CONCLUDE_REQUESTED" },
    };
  }

  return { gameState, messageState };
}

function challengeReducer(gameState: states.PlayingState, messageState: MessageState): JointState {

  messageState = { ...messageState, walletOutbox: { type: 'CHALLENGE_REQUESTED' } };

  return { gameState, messageState };
}

function waitForGameConfirmationAReducer(gameState: states.WaitForGameConfirmationA, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  // only action we need to handle in this state is to receiving a PreFundSetupB
  if (action.type !== actions.POSITION_RECEIVED) {
    return { gameState, messageState };
  }
  if (action.position.commitmentType !== CommitmentType.PreFundSetup ||
    action.position.commitmentCount !== 1) {
    return { gameState, messageState };
  }

  // request funding
  messageState = {
    ...messageState,
    walletOutbox: { type: "FUNDING_REQUESTED" },
  };

  // transition to Wait for Funding
  const newGameState = states.waitForFunding({
    ...gameState,
    turnNum: gameState.turnNum + 1,
  });

  return { messageState, gameState: newGameState };
}

function confirmGameBReducer(gameState: states.ConfirmGameB, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type !== actions.CONFIRM_GAME && action.type !== actions.DECLINE_GAME) { return { gameState, messageState }; }

  if (action.type === actions.CONFIRM_GAME) {
    const { turnNum } = gameState;

    const newGameState = states.waitForFunding({
      ...gameState,
      turnNum: turnNum + 1,
    });
    const newPosition = rpsCommitmentHelper.preFundSetupB(newGameState);

    const opponentAddress = states.getOpponentAddress(gameState);
    messageState = sendMessage(newPosition, opponentAddress, messageState);
    messageState = {
      ...messageState,
      walletOutbox: { type: "FUNDING_REQUESTED" },
    };

    return { gameState: newGameState, messageState };
  } else {
    const {
      myName,
      destination: participants,
      channel,
      player,
      twitterHandle,
    } = gameState;
    // TODO: Probably should return to the waiting room instead of getting kicked back to the lobby
    const newGameState = states.lobby({
      myName,
      myAddress: participants[player],
      libraryAddress: channel.channelType,
      twitterHandle,
    });
    // TODO: Send a message to the other player that the game has been declined
    return { gameState: newGameState, messageState };
  }
}

function waitForFundingReducer(
  gameState: states.WaitForFunding,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  if (action.type === actions.FUNDING_FAILURE) {
    const { destination: participants, player } = gameState;
    const lobbyGameState = states.lobby({
      ...gameState,
      myAddress: participants[player],
      libraryAddress: gameState.channel.channelType,
    });
    return { gameState: lobbyGameState, messageState: {} };
  }

  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type === actions.FUNDING_SUCCESS) {
    if (action.position.commitmentType !== CommitmentType.PostFundSetup ||
      action.position.commitmentCount !== 1) {
      throw new Error(
        "Game reducer expected PostFundSetupB on FUNDING_SUCCESS"
      );
    }
    const postFundPositionB = action.position;
    const turnNum = postFundPositionB.turnNum;
    const allocation = postFundPositionB.allocation;
    const commitmentCount = postFundPositionB.commitmentCount;
    const newGameState = states.pickMove({
      ...gameState,
      turnNum,
      allocation,
      commitmentCount,
    });
    return { gameState: newGameState, messageState };
  }
  if (action.type === actions.POSITION_RECEIVED) {
    messageState = { ...messageState, actionToRetry: action };
  }

  return { gameState, messageState };
}

function pickChallengeMoveReducer(
  gameState: states.PickChallengeMove,
  messageState: MessageState,
  action: actions.GameAction
): JointState {
  const turnNum = gameState.turnNum;
  if (action.type !== actions.CHOOSE_MOVE) {
    return { gameState, messageState };
  }
  if (gameState.player === Player.PlayerA) {
    const salt = randomHex(64);
    const asMove = action.move;

    const propose = rpsCommitmentHelper.proposeFromSalt({
      ...gameState,
      aPlay: asMove,
      salt,
      turnNum: turnNum + 1,
    });

    const newGameStateA = states.waitForOpponentToPickMoveA({
      ...gameState,
      ...propose,
      salt,
      myMove: asMove,
    });

    return {
      gameState: newGameStateA,
      messageState: {
        walletOutbox: { type: "RESPOND_TO_CHALLENGE", data: propose },
      },
    };
  } else {
    // We received a challenge so we need to take the position that the opponent sent us
    // This will be on the actionToRetry that we haven't handled yet
    if (messageState.actionToRetry) {
      const opponentPosition = messageState.actionToRetry.position;

      if (opponentPosition.positionType !== PositionType.Proposed) { return { gameState, messageState }; }
      const { preCommit } = opponentPosition;
      const { allocation: balances, roundBuyIn } = gameState;
      const aBal = bnToHex(hexToBN(balances[0]).sub(hexToBN(roundBuyIn)));
      const bBal = bnToHex(hexToBN(balances[1]).add(hexToBN(roundBuyIn)));
      const newBalances = [aBal, bBal] as [string, string];


      const newGameStateB = states.waitForRevealB({ ...gameState, preCommit, myMove: action.move, player: Player.PlayerB });
      const challengePosition = rpsCommitmentHelper.accept({
        ...gameState,
        preCommit,
        allocation: newBalances,
        bPlay: newGameStateB.myMove,
        turnNum: turnNum + 2,
      });


      return { gameState: newGameStateB, messageState: { walletOutbox: { type: "RESPOND_TO_CHALLENGE", data: challengePosition } } };


    }
  }

  return { gameState, messageState };
}
function pickMoveReducer(gameState: states.PickMove, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  const turnNum = gameState.turnNum;

  if (gameState.player === Player.PlayerA) {
    if (action.type !== actions.CHOOSE_MOVE) {
      return { gameState, messageState };
    }
    const salt = randomHex(64);
    const asMove = action.move;

    const propose = rpsCommitmentHelper.proposeFromSalt({
      ...gameState,
      aPlay: asMove,
      salt,
      turnNum: turnNum + 1,
    });
    const newGameStateA = states.waitForOpponentToPickMoveA({
      ...gameState,
      ...propose,
      salt,
      myMove: asMove,
    });

    const opponentAddress = states.getOpponentAddress(gameState);
    messageState = sendMessage(
      propose,
      opponentAddress,
      messageState
    );

    return { gameState: newGameStateA, messageState };
  } else {
    if (
      action.type === actions.POSITION_RECEIVED &&
      action.position.positionType === PositionType.Proposed
    ) {
      messageState = { ...messageState, actionToRetry: action };
      return { gameState, messageState };
    } else if (action.type === actions.CHOOSE_MOVE) {
      const newGameStateB = states.waitForOpponentToPickMoveB({
        ...gameState,
        myMove: action.move,
      });

      return { gameState: newGameStateB, messageState };
    }
  }

  return { gameState, messageState };
}

function insufficientFunds(
  balances: string[],
  roundBuyIn: string
): boolean {
  const aBal = hexToBN(balances[0]);
  const bBal = hexToBN(balances[1]);
  const buyIn = hexToBN(roundBuyIn);

  return aBal.lt(buyIn) || bBal.lt(buyIn);
}

function waitForOpponentToPickMoveAReducer(gameState: states.WaitForOpponentToPickMoveA, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type !== actions.POSITION_RECEIVED) { return { gameState, messageState }; }

  const { roundBuyIn, myMove, salt } = gameState;
  const { position: theirPosition } = action;

  if (theirPosition.positionType !== PositionType.Accepted) {
    return { gameState, messageState };
  }

  const { bPlay: theirMove, allocation, turnNum } = theirPosition;
  const result = calculateResult(myMove, theirMove);
  const absoluteResult = calculateAbsoluteResult(myMove, theirMove);
  const bnRoundBuyIn = hexToBN(roundBuyIn);
  const bnBalances = allocation.map(hexToBN) as [BN, BN];
  const newBalances = balancesAfterResult(
    absoluteResult,
    bnRoundBuyIn,
    bnBalances
  ).map(bnToHex) as [string, string];

  const newProperties = {
    myMove,
    theirMove,
    result,
    allocation: newBalances,
    turnNum: turnNum + 1,
  };

  let newGameState;
  if (insufficientFunds(newBalances, roundBuyIn)) {
    newGameState = states.gameOver({ ...gameState, ...newProperties, messageState: { walletOutbox: {} } });

  } else {
    newGameState = states.playAgain({ ...gameState, ...newProperties });
  }

  const reveal = rpsCommitmentHelper.reveal({
    ...newGameState,
    aPlay: myMove,
    bPlay: theirMove,
    salt,
  });
  const opponentAddress = states.getOpponentAddress(gameState);
  messageState = sendMessage(reveal, opponentAddress, messageState);

  return { gameState: newGameState, messageState };
}

function waitForOpponentToPickMoveBReducer(gameState: states.WaitForOpponentToPickMoveB, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type !== actions.POSITION_RECEIVED) { return { gameState, messageState }; }

  const position = action.position;
  if (position.positionType !== PositionType.Proposed) {
    return { gameState, messageState };
  }

  const preCommit = position.preCommit;
  const { allocation: balances, turnNum, roundBuyIn } = gameState;
  const aBal = bnToHex(hexToBN(balances[0]).sub(hexToBN(roundBuyIn)));
  const bBal = bnToHex(hexToBN(balances[1]).add(hexToBN(roundBuyIn)));
  const newBalances = [aBal, bBal] as [string, string];

  const newGameState = states.waitForRevealB({
    ...gameState,
    allocation: newBalances,
    preCommit,
    turnNum: turnNum + 2,
  });

  const newPosition = rpsCommitmentHelper.accept({
    ...newGameState,
    bPlay: newGameState.myMove,
  });

  const opponentAddress = states.getOpponentAddress(gameState);
  messageState = sendMessage(newPosition, opponentAddress, messageState);

  return { gameState: newGameState, messageState };
}

function waitForRevealBReducer(gameState: states.WaitForRevealB, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type !== actions.POSITION_RECEIVED) { return { gameState, messageState }; }

  if (action.position.positionType !== PositionType.Reveal) {
    return { gameState, messageState };
  }
  const position = action.position;
  const theirMove = position.aPlay;
  const balances = position.allocation; // wallet will catch if they updated wrong
  const turnNum = position.turnNum;

  const myMove = gameState.myMove;
  const roundBuyIn = gameState.roundBuyIn;

  const result = calculateResult(myMove, theirMove);
  const newProperties = { theirMove, result, balances, turnNum };
  if (insufficientFunds(balances, roundBuyIn)) {
    const newGameState1 = states.gameOver({
      ...gameState,
      ...newProperties,
      turnNum,
    });

    return { gameState: newGameState1, messageState };
  } else {
    const newGameState2 = states.playAgain({ ...gameState, ...newProperties });

    return { gameState: newGameState2, messageState };
  }
}

function challengePlayAgainReducer(gameState: states.ChallengePlayAgain, messageState: MessageState, action: actions.GameAction): JointState {
  switch (action.type) {
    // case actions.RESIGN: // handled globally
    // case actions.OPPONENT_RESIGNED: // handled globally
    case actions.PLAY_AGAIN:
      if (gameState.player === Player.PlayerA) {
        // transition to WaitForResting
        const newGameState = states.waitForRestingA(gameState);

        return { gameState: newGameState, messageState };
      } else {
        // transition to PickMove
        const { turnNum } = gameState;
        const newGameState1 = states.pickMove({
          ...gameState,
          turnNum: turnNum + 1,
        });

        const resting = rpsCommitmentHelper.resting(newGameState1);

        messageState = { walletOutbox: { type: "RESPOND_TO_CHALLENGE", data: resting } };

        return { gameState: newGameState1, messageState };
      }
  }
  return { gameState, messageState };
}

function playAgainReducer(gameState: states.PlayAgain, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }

  switch (action.type) {
    // case actions.RESIGN: // handled globally
    // case actions.OPPONENT_RESIGNED: // handled globally
    case actions.PLAY_AGAIN:
      if (gameState.player === Player.PlayerA) {
        // transition to WaitForResting
        const newGameState = states.waitForRestingA(gameState);

        return { gameState: newGameState, messageState };
      } else {
        // transition to PickMove
        const { turnNum } = gameState;
        const newGameState1 = states.pickMove({
          ...gameState,
          turnNum: turnNum + 1,
        });

        const resting = rpsCommitmentHelper.resting(newGameState1);

        // send Resting
        const opponentAddress = states.getOpponentAddress(gameState);
        messageState = sendMessage(resting, opponentAddress, messageState);

        return { gameState: newGameState1, messageState };
      }

    case actions.POSITION_RECEIVED:
      const position = action.position;
      if (position.positionType !== PositionType.Resting) {
        return { gameState, messageState };
      }

      messageState = { ...messageState, actionToRetry: action };
      return { gameState, messageState };

    default:
      return { gameState, messageState };
  }
}

function waitForRestingAReducer(gameState: states.WaitForRestingA, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type === actions.RESIGN) { return resignationReducer(gameState, messageState); }
  if (action.type === actions.CREATE_CHALLENGE) { return challengeReducer(gameState, messageState); }
  if (action.type !== actions.POSITION_RECEIVED) { return { gameState, messageState }; }

  const position = action.position;
  if (position.positionType !== PositionType.Resting) {
    return { gameState, messageState };
  }

  const { turnNum } = gameState;

  const newGameState = states.pickMove({ ...gameState, turnNum: turnNum + 1 });

  return { gameState: newGameState, messageState };
}


function gameOverReducer(gameState: states.GameOver, messageState: MessageState, action: actions.GameAction): JointState {
  if (action.type !== actions.RESIGN) { return { gameState, messageState }; }

  const newGameState = states.waitForWithdrawal(gameState);
  messageState = { ...messageState, walletOutbox: { type: 'CONCLUDE_REQUESTED' } };

  return { gameState: newGameState, messageState };
}

function waitForWithdrawalReducer(gameState: states.WaitForWithdrawal, messageState: MessageState, action: actions.GameAction) {
  if (action.type !== actions.RESIGN) {
    return { gameState, messageState };
  }
  const { myName, channel, twitterHandle } = gameState;
  const myAddress = gameState.destination[gameState.player];
  const newGameState = states.lobby({
    myName,
    myAddress,
    libraryAddress: channel.channelType,
    twitterHandle,
  });
  return { gameState: newGameState, messageState: {} };
}
