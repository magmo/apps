import React from 'react';
import { connect } from 'react-redux';

import { SiteState } from '../redux/reducer';

import { Marker } from '../core';
import GameScreen from '../components/GameScreen';
import ProfileContainer from './ProfileContainer';

import { Marks } from '../core';
import { GameState, StateName } from '../redux/game/state';
import * as actions from '../redux/game/actions';



interface GameProps {
  state: GameState;
  marksMade: (marks: Marks) => void;
}

function GameContainer(props: GameProps) {
  const { state, marksMade } = props;
  switch (state.name) {
    case StateName.NoName:
      return <ProfileContainer />;
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
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameContainer);
