import React from 'react';
import Board from './Board';
import NavigationBarContainer from "../containers/NavigationBarContainer";
// import GameBarContainer from "../containers/GameBarContainer";
import MAGMO_LOGO from '../images/magmo_logo.svg';
import GameFooterContainer from "../containers/GameFooterContainer";
import { Marks, Marker, Result, Player, Imperative } from '../core';

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
    const {you, noughts, crosses, marksMade} = this.props;
    return (
      <div className="w-100">
      <NavigationBarContainer />
      {/* <GameBarContainer /> */}

      <div className="container centered-container w-100 game-container">
        <Board noughts={noughts} crosses={crosses} marksMade={marksMade} you = {you}/>
      </div>

      <div className="footer-logo-container">
        <img src={MAGMO_LOGO} className="magmo-logo"/> <br/>
            <small className="text-white">
                Something not working? Email us at <a href="mailto:oops@magmo.com">oops@magmo.com</a>
            </small>
      </div>

      <GameFooterContainer />
    </div>
    );
  }
}