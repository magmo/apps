import React from 'react';
import { storiesOf } from '@storybook/react';
import { Provider }  from 'react-redux';
// Once it exists import styling here
import '../index.css';
// import { Button } from '@storybook/react/demo';
import Board from '../components/Board';
import { YourMarker, TheirMarker } from '../components/Marker';
import Outcome from '../components/Outcome';
import Balances from '../components/Balances';
import GameScreen from '../components/GameScreen';
import { Marker, Result, Player, Imperative, Marks } from '../core';

import { scenarios } from '../core/';

import { 
  xsPickMove,
  // xsWaitForOpponentToPickMove,
 } from '../redux/game/state';

import GameContainer from '../containers/GameContainer';


const {
  playing1,
} = scenarios.standard;

const shared = {...scenarios.shared, player: Player.PlayerA, stateCount: 1};

const initialState = {
  game: {
    messageState: {},
    gameState: xsPickMove({...playing1, ...shared})
  }
};

// BOILER PLATE TAKEN FROM RPS-POC WALLET 


const fakeMoveChosen = (x: Marks) => alert("move chosen");

// const noughts = 0;
// const crosses = 0;
storiesOf('Board', module)
  .add('Empty', () => <Board stateType="blah" noughts={0} crosses={0} osMoveChosen={fakeMoveChosen} xsMoveChosen={fakeMoveChosen}/>)
  .add('Draw', () => <Board stateType="blah" noughts={0b010011100} crosses={0b101100011} osMoveChosen={fakeMoveChosen} xsMoveChosen={fakeMoveChosen}/>)
  .add('O win', () => <Board stateType="blah" noughts={0b111000000} crosses={0b000011000} osMoveChosen={fakeMoveChosen} xsMoveChosen={fakeMoveChosen}/>)
  .add('X win', () => <Board stateType="blah" noughts={0b100010000} crosses={0b001001001} osMoveChosen={fakeMoveChosen} xsMoveChosen={fakeMoveChosen}/>);

storiesOf('Status', module)
  .add('Your Marker',() => <YourMarker stateType="blah" you={Marker.crosses} />)
  .add('Their Marker',() => <TheirMarker stateType="blah" you={Marker.crosses} />);

storiesOf('Outcome', module)
  .add('You Win',() => <Outcome stateType="blah" result={Result.YouWin} />)
  .add('You Lose',() => <Outcome stateType="blah" result={Result.YouLose} />)
  .add('Tie',() => <Outcome stateType="blah" result={Result.Tie} />)
  .add('Wait',() => <Outcome stateType="blah" result={Imperative.Wait}/>)
  .add('Choose',() => <Outcome stateType="blah" result={Imperative.Choose}/>);

storiesOf('Balances', module)
  .add('You Winning',() => <Balances stateType="blah" balances={["6","4"]} player={Player.PlayerA}/>)
  .add('You Losing',() => <Balances stateType="blah" balances={["9","4"]} player={Player.PlayerB}/>);


storiesOf('Game Screen', module)
  .add('Waiting', () => <GameScreen 
  stateType="blah"
  noughts={0b000100000} 
  crosses={0b000001001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Imperative.Wait} 
  balances={["6","4"]}
  osMoveChosen={fakeMoveChosen}
  xsMoveChosen={fakeMoveChosen}
  />)
  .add('Choosing', () => <GameScreen 
  stateType="blah"
  noughts={0b000100010} 
  crosses={0b000001001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Imperative.Choose} 
  balances={["4","6"]}
  osMoveChosen={fakeMoveChosen}
  xsMoveChosen={fakeMoveChosen}
  />)
  .add('X win', () => <GameScreen 
  stateType="blah"
  noughts={0b100100000} 
  crosses={0b001001001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.YouWin} 
  balances={["6","4"]}
  osMoveChosen={fakeMoveChosen}
  xsMoveChosen={fakeMoveChosen}
  />)
  .add('O win', () => <GameScreen 
  stateType="blah"
  noughts={0b100100100} 
  crosses={0b000011001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.YouLose} 
  balances={["4","6"]}
  osMoveChosen={fakeMoveChosen}
  xsMoveChosen={fakeMoveChosen}
  />)
  .add('Tie', () => <GameScreen 
  stateType="blah"
  noughts={0b101100010} 
  crosses={0b010011101} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.Tie} 
  balances={["5","5"]}
  osMoveChosen={fakeMoveChosen}
  xsMoveChosen={fakeMoveChosen}
  />);

const fakeStore = (state) => ({
  dispatch: action => {
    alert(`Action ${action.type} triggered`);
    return action;
  },
  getState: () => (state), 
  subscribe: () => (() => {/* empty */ }),
  replaceReducer: () => { /* empty */ },
});

const testState = (state) => (
  () => (
    <Provider store={fakeStore(state)}>
      <GameContainer/>
    </Provider>
  )
);


// const currentState = store.getState();

storiesOf('App (reading from the store)', module)
  .add('test initial state', testState(initialState));
