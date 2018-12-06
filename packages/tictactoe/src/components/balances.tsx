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
      return <span>{balances[0]}</span>;
    }
    if (player == Player.PlayerB){
      return <span>{balances[1]}</span>;
    } else return;
  }
  renderTheirBalance(balances: [String, String], player: Player) {
    if (player == Player.PlayerA){
      return <span>{balances[1]}</span>;
    }
    if (player == Player.PlayerB){
      return <span>{balances[0]}</span>;
    } else return;
  }

  render() {
    const { balances, player } = this.props;
    return (<p>You:&nbsp;
      <span>
        {this.renderYourBalance(balances, player)}
      </span>&nbsp;| 
      <span>
      &nbsp;{this.renderTheirBalance(balances, player)}
      </span>
      &nbsp;:&nbsp;Them
      </p>

    );
  }
}