import React, { Fragment } from 'react';
import { connect } from 'react-redux';

import { SiteState } from '../redux/reducer';

import { Marker } from '../core';
import GameScreen from '../components/GameScreen';
import ProfileContainer from './ProfileContainer';
import WaitingRoomPage from '../components/WaitingRoomPage';

import { Marks } from '../core';
import { GameState, StateName } from '../redux/game/state';
import * as actions from '../redux/game/actions';

interface GameProps {
  state: GameState;
  marksMade: (marks: Marks) => void;
  cancelOpenGame: () => void;
}

function GameContainer(props: GameProps) {
  return (
    <Fragment>
      {RenderGame(props)}

      {/* <Wallet /> */}
    </Fragment>
  );
}

function RenderGame(props: GameProps) {
  const { state, marksMade } = props;
  switch (state.name) {
    case StateName.NoName:
      return <ProfileContainer />;
    case StateName.WaitingRoom:
      return (
        <WaitingRoomPage
          cancelOpenGame={props.cancelOpenGame} 
          roundBuyIn={state.roundBuyIn}
        />
      );
    case StateName.XsPickMove:
      return (
        <GameScreen
          stateType="blah"
          noughts={state.noughts}
          crosses={state.crosses}
          you={Marker.crosses} // fixed by StateName
          player={state.player}
          result={state.result}
          balances={state.balances}
          marksMade={marksMade}
        />
      );
      case StateName.XsWaitForOpponentToPickMove:
      return (
        <GameScreen
          stateType="blah"
          noughts={state.noughts}
          crosses={state.crosses}
          you={Marker.crosses} // fixed by StateName
          player={state.player}
          result={state.result}
          balances={state.balances}
          marksMade={marksMade}
        />
      );
    default:
      throw new Error(`View not created for ${state.name}`);
  }
}

const mapStateToProps = (state: SiteState) => ({
  state: state.game.gameState,
});

const mapDispatchToProps = {
  marksMade: actions.marksMade,
  cancelOpenGame: actions.cancelOpenGame,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameContainer);
