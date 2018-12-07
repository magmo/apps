import React from 'react';
import { storiesOf } from '@storybook/react';
// Once it exists import styling here
import '../index.css';
// import { Button } from '@storybook/react/demo';
import Board from '../components/board';
import Status from '../components/status';
import Outcome from '../components/outcome';
import Balances from '../components/balances';
import GameScreen from '../components/game-screen';
import { Marker, Result, Player } from '../core';


// BOILER PLATE TAKEN FROM RPS-POC WALLET

// const fakeStore = (state) => ({
//   dispatch: action => {
//     alert(`Action ${action.type} triggered`);
//     return action;
//   },
//   getState: () => ({ wallet: state }), 
//   subscribe: () => (() => {/* empty */ }),
//   replaceReducer: () => { /* empty */ },
// });

// const testState = (state) => (
//   () => (
//     <Provider store={fakeStore(state)}>
//       <Wallet children={<div/>} />
//     </Provider>
//   )
// );

// const noughts = 0;
// const crosses = 0;
storiesOf('Board', module)
  .add('Empty', () => <Board stateType="blah" noughts={0} crosses={0} />)
  .add('Draw', () => <Board stateType="blah" noughts={0b010011100} crosses={0b101100011}/>)
  .add('O win', () => <Board stateType="blah" noughts={0b111000000} crosses={0b000011000}/>)
  .add('X win', () => <Board stateType="blah" noughts={0b100010000} crosses={0b001001001}/>);

storiesOf('Status', module)
  .add('Noughts',() => <Status stateType="blah" you={Marker.noughts} />)
  .add('Crosses',() => <Status stateType="blah" you={Marker.crosses} />);

storiesOf('Outcome', module)
  .add('You Win',() => <Outcome stateType="blah" result={Result.YouWin} />)
  .add('You Lose',() => <Outcome stateType="blah" result={Result.YouLose} />)
  .add('Tie',() => <Outcome stateType="blah" result={Result.Tie} />);

storiesOf('Balances', module)
  .add('You Winning',() => <Balances stateType="blah" balances={["6","4"]} player={Player.PlayerA}/>)
  .add('You Losing',() => <Balances stateType="blah" balances={["9","4"]} player={Player.PlayerB}/>);

storiesOf('Game Screen', module)
  .add('Not Yet Concluded', () => <GameScreen 
  stateType="blah"
  noughts={0b100100000} 
  crosses={0b000001001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={null} 
  balances={["5","5"]}
  />)
  .add('X win', () => <GameScreen 
  stateType="blah"
  noughts={0b100100000} 
  crosses={0b001001001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.YouWin} 
  balances={["6","4"]}
  />)
  .add('O win', () => <GameScreen 
  stateType="blah"
  noughts={0b100100100} 
  crosses={0b000011001} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.YouLose} 
  balances={["4","6"]}
  />)
  .add('Tie', () => <GameScreen 
  stateType="blah"
  noughts={0b101100010} 
  crosses={0b010011101} 
  you={Marker.crosses} 
  player={Player.PlayerA} 
  result={Result.Tie} 
  balances={["5","5"]}
  />);
