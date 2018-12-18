import React from 'react';
import { Marks, Marker, Result, Player, Imperative } from '../core';
import GameScreen from './GameScreen';


interface Props {
  stateType: string;
  you: Marker;
  noughts: Marks;
  crosses: Marks;
  balances: [string, string];
  player: Player;
  result: Result | Imperative;
  // action goes here (.e.g. player picks a move)
  marksMade: (marks: Marks) => void;
}




export default class PlayAgain extends React.PureComponent<Props> {
  render() {
    const { noughts, crosses, you, player, result, balances, marksMade } = this.props;
    return (
      <GameScreen
      stateType="blah"
      noughts={noughts}
      crosses={crosses}
      you={you} // fixed by StateName
      player={player}
      result={result}
      balances={balances}
      marksMade={marksMade}
      />
    );
  }
}