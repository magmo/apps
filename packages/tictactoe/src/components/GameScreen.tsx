import React from 'react';
import Board from './Board';
import NavigationBarContainer from "../containers/NavigationBarContainer";
import GameBarContainer from "../containers/GameBarContainer";
import GameFooterContainer from "../containers/GameFooterContainer";
import { Marks, Marker, Result, Player, Imperative } from '../core';
import MAGMO_LOGO from '../images/magmo_logo.svg';
import { Button } from 'reactstrap';

interface Props {
  you: Marker;
  noughts: Marks;
  crosses: Marks;
  onScreenBalances: [string, string];
  player: Player;
  result: Result | Imperative;
  // action goes here (.e.g. player picks a move)
  marksMade: (marks: Marks) => void;
  resign: () => void;
}

export default class GameScreen extends React.PureComponent<Props> {
  render() {
    const {you, noughts, crosses, marksMade, resign} = this.props;
    return (
    <div id="main-container">
      {/* <StatusAndBalances onScreenBalances={onScreenBalances} player={player} you = {you}/> */}
      <NavigationBarContainer />
      <GameBarContainer />
      <Board noughts={noughts} crosses={crosses} marksMade={marksMade} you = {you}/>
      <div id="magmo-logo"><img src={MAGMO_LOGO}/></div>
      <Button className="cog-button-small resignButton" outline={false} onClick={resign}>
            Resign
      </Button>
      <GameFooterContainer />
      {/* <Outcome result={result} /> */}
    </div>
    );
  }
}