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
  onScreenBalances: [string, string];
  player: Player;
  result: Result | Imperative;
  // action goes here (.e.g. player picks a move)
  marksMade: (marks: Marks) => void;
}




export default class GameScreen extends React.PureComponent<Props> {
  render() {
    const {you, noughts, crosses, onScreenBalances, player, result, marksMade} = this.props;
    return (
    <div id="main-container">
      <StatusAndBalances stateType="blah" onScreenBalances={onScreenBalances} player={player} you = {you}/>
      <Board stateType="blah" noughts={noughts} crosses={crosses} marksMade={marksMade}/>
      <div id="magmo-logo"><img src={MAGMO_LOGO}/></div>
      <Outcome stateType="blah" result={result} />
    </div>
    );
  }
}