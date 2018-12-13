import React from 'react';
import { storiesOf } from '@storybook/react';
import { Provider } from 'react-redux';
// Once it exists import styling here
import '../index.css';
// import { Button } from '@storybook/react/demo';
import HomePage from '../components/HomePage';
import { OpenGame } from "../redux/open-games/state";
import { OpenGameEntry } from '../components/OpenGameCard';
import Button from '../components/Button';
import Board from '../components/Board';
import { YourMarker, TheirMarker } from '../components/Marker';
import Outcome from '../components/Outcome';
import StatusAndBalances from '../components/StatusAndBalances';
import GameScreen from '../components/GameScreen';
import { Marker, Result, Player, Imperative, Marks } from '../core';
import BN from "bn.js";
import bnToHex from '../utils/bnToHex';
import { scenarios } from '../core/';
import * as loginActions from '../redux/login/actions';

import * as states from '../redux/game/state';

import GameContainer from '../containers/GameContainer';

import '../index.css';
import '../index.scss';

const fiveFive = [new BN(5), new BN(5)].map(bnToHex) as [string, string];

const shared = { ...scenarios.shared };

const initialState = {
  game: {
    messageState: {},
    gameState: states.xsPickMove({
      ...shared,
      stateCount: 1,
      noughts: 0,
      crosses: 0,
      balances: fiveFive,
      turnNum: 4,
      result: Imperative.Choose,
      player: Player.PlayerA,
    }),
  },
};


const marksMade = (x: Marks) => alert("marks made");
const joinOpenGame = () => alert("join open game");
// const newOpenGame = () => alert("new open game");

storiesOf('HomePage', module).add('Home', () => <HomePage login={loginActions.loginRequest}/>);

const openGame: OpenGame = {
  address:"test address",
  name: "test player",
  stake: "10000000000000000",
  isPublic: true,
  createdAt: 0,
};
storiesOf('LobbyPage', module)
  .add('Open Game Entry', () => <OpenGameEntry 
  openGame={openGame} 
  joinOpenGame={joinOpenGame}
  />)
  .add('Button', () => <Button
  children={"Click Me"}
  onClick={() => alert("button clicked")}
  />);

storiesOf('Board', module)
  .add('Empty', () => <Board stateType="blah" noughts={0} crosses={0} marksMade={marksMade} />)
  .add('Draw', () => <Board stateType="blah" noughts={0b010011100} crosses={0b101100011} marksMade={marksMade} />)
  .add('O win', () => <Board stateType="blah" noughts={0b111000000} crosses={0b000011000} marksMade={marksMade} />)
  .add('X win', () => <Board stateType="blah" noughts={0b100010000} crosses={0b001001001} marksMade={marksMade} />);

storiesOf('Status', module)
  .add('Your Marker', () => <YourMarker stateType="blah" you={Marker.crosses} />)
  .add('Their Marker', () => <TheirMarker stateType="blah" you={Marker.crosses} />);

storiesOf('Outcome', module)
  .add('You Win', () => <Outcome stateType="blah" result={Result.YouWin} />)
  .add('You Lose', () => <Outcome stateType="blah" result={Result.YouLose} />)
  .add('Tie', () => <Outcome stateType="blah" result={Result.Tie} />)
  .add('Wait', () => <Outcome stateType="blah" result={Imperative.Wait} />)
  .add('Choose', () => <Outcome stateType="blah" result={Imperative.Choose} />);

storiesOf('Status and Balances', module)
  .add('You Winning', () => <StatusAndBalances stateType="blah" balances={["6", "4"]} player={Player.PlayerA} you={Marker.crosses} />)
  .add('You Losing', () => <StatusAndBalances stateType="blah" balances={["9", "4"]} player={Player.PlayerB} you={Marker.crosses} />);


storiesOf('Game Screen', module)
  .add('Waiting', () => <GameScreen
    stateType="blah"
    noughts={0b000100000}
    crosses={0b000001001}
    you={Marker.crosses}
    player={Player.PlayerA}
    result={Imperative.Wait}
    balances={["6", "4"]}
    marksMade={marksMade}
  />)
  .add('Choosing', () => <GameScreen
    stateType="blah"
    noughts={0b000100010}
    crosses={0b000001001}
    you={Marker.crosses}
    player={Player.PlayerA}
    result={Imperative.Choose}
    balances={["4", "6"]}
    marksMade={marksMade}
  />)
  .add('X win', () => <GameScreen
    stateType="blah"
    noughts={0b100100000}
    crosses={0b001001001}
    you={Marker.crosses}
    player={Player.PlayerA}
    result={Result.YouWin}
    balances={["6", "4"]}
    marksMade={marksMade}
  />)
  .add('O win', () => <GameScreen
    stateType="blah"
    noughts={0b100100100}
    crosses={0b000011001}
    you={Marker.crosses}
    player={Player.PlayerA}
    result={Result.YouLose}
    balances={["4", "6"]}
    marksMade={marksMade}
  />)
  .add('Tie', () => <GameScreen
    stateType="blah"
    noughts={0b101100010}
    crosses={0b010011101}
    you={Marker.crosses}
    player={Player.PlayerA}
    result={Result.Tie}
    balances={["5", "5"]}
    marksMade={marksMade}
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
      <GameContainer />
    </Provider>
  )
);

storiesOf('App (reading from the fake store)', module)
  .add('test initial state', testState(initialState));
