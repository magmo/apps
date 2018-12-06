import React from 'react';
import { Player } from '../core';

interface Props {
  stateType: string;
  balances: [String, String];
  player: Player;
}

export default class Balances extends React.PureComponent<Props> {
  renderYourBalance(balances: [String, String], player: Player) {
    if (player == Player.PlayerA){
      return <p>{balances[0]}</p>;
    }
    if (player == Player.PlayerB){
      return <p>{balances[1]}</p>;
    } else return;
  }
  renderTheirBalance(balances: [String, String], player: Player) {
    if (player == Player.PlayerA){
      return <p>{balances[1]}</p>;
    }
    if (player == Player.PlayerB){
      return <p>{balances[0]}</p>;
    } else return;
  }

  render() {
    const { balances, player } = this.props;
    return (<p> You: 
      <span>
        {this.renderYourBalance(balances, player)}
      </span> Them: 
      <span>
        {this.renderTheirBalance(balances, player)}
      </span>

      </p>

    );
  }
}