import React from 'react';
import { connect } from 'react-redux';

import { SiteState } from '../redux/reducer';

import { Marker, Imperative } from '../core';
import GameScreen from '../components/GameScreen';

import { Marks } from '../core';
import { GameState, StateName } from '../redux/game/state';
import * as actions from '../redux/game/actions';



interface GameProps {
  state: GameState;
  osMoveChosen: (noughts: Marks) => void;
  xsMoveChosen: (crosses: Marks) => void;
}

function GameContainer(props: GameProps) {
  const { state, osMoveChosen, xsMoveChosen } = props;
  switch (state.name) {
    case StateName.XsPickMove:
      return (
        <GameScreen
          stateType="blah"
          noughts={state.noughts}
          crosses={state.crosses}
          you={Marker.crosses} // fixed by StateName
          player={state.player}
          result={Imperative.Wait}
          balances={state.balances}
          osMoveChosen={osMoveChosen}
          xsMoveChosen={xsMoveChosen}
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
  osMoveChosen: actions.osMoveChosen,
  xsMoveChosen: actions.xsMoveChosen,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameContainer);
