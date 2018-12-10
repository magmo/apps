import React from 'react';
// import { connect } from 'react-redux';

// import { SiteState } from '../redux/reducer';
import * as gameActions from '../redux/game/actions';
import { Marks, Marker, Player, Imperative } from '../core';

// import { Wallet, actions as walletActions } from '../wallet';
// import WaitingRoomPage from '../components/WaitingRoomPage';
// import ConfirmGamePage from '../components/ConfirmGamePage';
// import FundingConfirmedPage from '../components/FundingConfirmedPage'; // WaitForPostFundSetup
// import SelectMovePage from '../components/SelectMovePage';
// import WaitForOpponentToPickMove from '../components/WaitForOpponentToPickMove';
import GameScreen from '../components/GameScreen'
// import MoveSelectedPage from '../components/MoveSelectedPage'; // WaitForReveal, WaitForResting
// import PlayAgain from '../components/PlayAgain';
// import WaitForRestingA from '../components/WaitForRestingA';
// import InsufficientFunds from '../components/InsufficientFunds';
// import WaitToResign from '../components/WaitToResign';
// import WaitForResignationAcknowledgement from '../components/WaitForResignationAcknowledgement';
// import GameOverPage from '../components/GameOverPage'; // GameOver, OpponentResigned
// import GameProposedPage from '../components/GameProposedPage';
// import ProfileContainer from './ProfileContainer';

// import WaitForWallet from '../components/WaitForWallet'; // WaitForFunding, maybe others?

import { GameState, StateName } from '../redux/game/state';

interface GameProps {
  state: GameState;
  showWallet: boolean;
  showWalletHeader: boolean;
  noughts: (marks: Marks) => void;
  crosses: (marks: Marks) => void;
  you: (marker: Marker) => void;
  player: (player: Player) => void;
  playAgain: () => void;
  createBlockchainChallenge: () => void;
  confirmGame: () => void;
  declineGame: () => void;
  createOpenGame: (roundBuyIn: string) => void;
  cancelOpenGame: () => void;
  withdraw: () => void;
}

function GameContainer(props: GameProps) {
  // return <Wallet>{RenderGame(props)}</Wallet>;
  return <div>{RenderGame(props)}</div>;
}

function RenderGame(props: GameProps) {
  const { state, noughts, crosses, player, playAgain, createBlockchainChallenge, confirmGame, declineGame, withdraw } = props;
  switch (state.name) {
    case StateName.XsWaitForOpponentToPickMove:
      return (
        <GameScreen 
          stateType="blah"
          noughts={noughts} 
          crosses={crosses} 
          you={Marker.crosses} // fixed by StateName
          player={player} 
          result={result} 
          balances={balances}
          />
      );
    default:
      throw new Error(`View not created for ${state.name}`);
  }
}

const mapStateToProps = (state: SiteState) => ({
  state: state.game.gameState,
  showWallet: state.wallet.display.showWallet,
  showWalletHeader: state.wallet.display.showFooter,
});

const mapDispatchToProps = {
  chooseMove: gameActions.chooseMove,
  playAgain: gameActions.playAgain,
  createBlockchainChallenge: walletActions.createChallenge,
  confirmGame: gameActions.confirmGame,
  declineGame: gameActions.declineGame,
  createOpenGame: gameActions.createOpenGame,
  cancelOpenGame: gameActions.cancelOpenGame,
  withdraw: gameActions.withdrawalRequest,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameContainer);
