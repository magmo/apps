import React from 'react';
import Board from './board';
import Outcome from './outcome';
import StatusAndBalances from './statusAndBalances';
import { Marks, Marker, Result, Player } from '../core';
import MAGMO_LOGO from '../images/magmo_logo.svg';

interface Props {
  stateType: string;
  you: Marker;
  noughts: Marks;
  crosses: Marks;
  balances: [string, string];
  player: Player;
  result: Result | null;
}

export default class GameScreen extends React.PureComponent<Props> {
  render() {
    const {you, noughts, crosses, balances, player, result} = this.props;
    return (
    <div>
    <StatusAndBalances stateType="blah" balances={balances} player={player} you = {you}/>
    <Board stateType="blah" noughts={noughts} crosses={crosses}/>
    <div id="magmo-logo"><img src={MAGMO_LOGO}/></div>
    <Outcome stateType="blah" result={result} />
    </div>
    );
  }
}