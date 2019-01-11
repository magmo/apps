import React from 'react';
import Board from './Board';
import { Marks, Marker, Result, Player, Imperative } from '../core';
import NavigationBarContainer from "../containers/NavigationBarContainer";
import GameBarContainer from "../containers/GameBarContainer";
import GameFooterContainer from "../containers/GameFooterContainer";

import { Button } from 'reactstrap';


interface Props {
  you: Marker;
  noughts: Marks;
  crosses: Marks;
  onScreenBalances: [string, string];
  player: Player;
  result: Result | Imperative;
  // action goes here (.e.g. player picks a move)
  playAgain: () => void;
  marksMade: (x: Marks) => void;
  resign: () => void;
}

export default class PlayAgainWait extends React.PureComponent<Props> {
  render() {
    const {you, noughts, crosses, marksMade, playAgain} = this.props;
    return (
      <div>
<div className="w-100">
        <NavigationBarContainer />
        <GameBarContainer />
  
        <div className="container centered-container w-100 game-container">
          <Board noughts={noughts} crosses={crosses} marksMade={marksMade} you = {you}/>
        </div>
        <Button className="cog-button homePage-loginButton" onClick={playAgain} >
        Waiting..
        </Button>  
        <GameFooterContainer />
      </div>
      </div>
    );
  }
}