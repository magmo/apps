import React from 'react';
import { Player } from '../core';
// import hexToBN from '../utils/hexToBN';

interface Props {
  stateType: string;
  balances: [string, string];
  player: Player;
}

export default class Balances extends React.PureComponent<Props> {
  renderYourBalance(balances: [string, string], player: Player) {
    if (player == Player.PlayerA){
      return <span>?</span>;
    }
    if (player == Player.PlayerB){
      return <span>?</span>;
    } else return;
  }
  renderTheirBalance(balances: [string, string], player: Player) {
    if (player == Player.PlayerA){
      return <span>{balances[1]}</span>;
    }
    if (player == Player.PlayerB){
      return <span>{balances[0]}</span>;
    } else return;
  }

  render() {
    const { balances, player } = this.props;
    return (<h1 className="full-width-bar" >[You]&nbsp;
      <span>
        {this.renderYourBalance(balances, player)}
      </span>&nbsp;| 
      <span>
      &nbsp;{this.renderTheirBalance(balances, player)}
      </span>
      &nbsp;[Them]
      </h1>

    );
  }
}