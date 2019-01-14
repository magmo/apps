import React from 'react';
import { storiesOf } from '@storybook/react';
import SiteContainer from '../containers/SiteContainer';
import { Provider } from 'react-redux';
import { OpenGameEntry } from '../components/OpenGameCard';
import *  as states from '../redux/game/state';
import { Marker, Player, Imperative } from '../core';
import BN from "bn.js";
import bnToHex from "../utils/bnToHex";
import { OpenGame } from "../redux/open-games/state";
import '../index.scss';
import '../index.css';
import { scenarios } from '../core';
import { SiteState } from '../redux/reducer';
import { WAIT_FOR_LOGIN, INITIALIZING } from '../wallet/states';

const finneySixFour = [new BN(6000000000000000), new BN(4000000000000000)].map(bnToHex) as [string, string];

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
      <SiteContainer />
    </Provider>
  )
);

const shared = { ...scenarios.shared };

const initialState: SiteState = {
  login: {
    loading: false,
    loggedIn: true,
    user: null,
  },
  wallet: {
    type: WAIT_FOR_LOGIN,
    stage: INITIALIZING,
  },
  metamask: {
    loading: false,
    error: null,
    success: true,
  },
  openGames:[],
  rules: {
    visible: false,
  },
  game: {
    messageState: {},
    gameState: states.xsPickMove({
      ...shared,
      noughts: 0b000100000,
      crosses: 0b000001001,
      you: Marker.crosses,
      player: Player.PlayerA,
      result: Imperative.Wait,
      onScreenBalances: finneySixFour,
      turnNum: 5,
      balances: finneySixFour,
      stateCount: 1,
      twitterHandle: 'twtr',
      roundBuyIn: '1',
      myName: 'George',
      opponentName: 'Mike',
    }),
  },
};


const joinOpenGame = () => alert("join open game");

const openGame: OpenGame = {
  address:"test address",
  name: "test player",
  stake: "10000000000000000",
  isPublic: true,
  createdAt: 0,
};


storiesOf('Lobby',module)
.add('Open Game Entry', () => <OpenGameEntry 
openGame={openGame} 
joinOpenGame={joinOpenGame}
/>);

storiesOf('Game Screens / Crosses', module)
  .add('Waiting', testState(initialState));


