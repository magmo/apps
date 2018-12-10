import React from 'react';
import Board from './Board';
import Outcome from './Outcome';
import StatusAndBalances from './StatusAndBalances';
import { Marks, Marker, Result, Player, Imperative } from '../core';
import MAGMO_LOGO from '../images/magmo_logo.svg';


interface Props {
  stateType: string;
  you: Marker;
  noughts: Marks;
  crosses: Marks;
  balances: [string, string];
  player: Player;
  result: Result | Imperative;
  // action goes here (.e.g. player picks a move)
  osMoveChosen: (noughts: Marks) => void;
  xsMoveChosen: (crosses: Marks) => void;
}




export default class GameScreen extends React.PureComponent<Props> {
  render() {
    const {you, noughts, crosses, balances, player, result, osMoveChosen, xsMoveChosen} = this.props;
    return (
    <div id="main-container">
      <StatusAndBalances stateType="blah" balances={balances} player={player} you = {you}/>
      <Board stateType="blah" noughts={noughts} crosses={crosses} osMoveChosen={osMoveChosen} xsMoveChosen={xsMoveChosen}/>
      <div id="magmo-logo"><img src={MAGMO_LOGO}/></div>
      <Outcome stateType="blah" result={result} />
    </div>
    );
  }
}