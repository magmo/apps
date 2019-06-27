import * as states from './states';
import { PureComponent } from 'react';
import React from 'react';
import { NewLedgerFunding as PlayerAIndirectFunding } from './player-a';
import { NewLedgerFunding as PlayerBIndirectFunding } from './player-b';
import { connect } from 'react-redux';

interface Props {
  state: states.PlayerAState | states.PlayerBState;
}

class NewLedgerFundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    if (states.isPlayerAState(state)) {
      return <PlayerAIndirectFunding state={state} />;
    } else {
      return <PlayerBIndirectFunding state={state} />;
    }
  }
}

export const IndirectFunding = connect(() => ({}))(NewLedgerFundingContainer);
