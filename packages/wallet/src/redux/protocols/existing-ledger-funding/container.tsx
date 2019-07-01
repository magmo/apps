import * as states from './states';
import { PureComponent } from 'react';
import React from 'react';

import { connect } from 'react-redux';
import { unreachable } from 'src/utils/reducer-utils';

interface Props {
  state: states.ExistingLedgerFundingState;
}

class ExistingLedgerFundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'ExistingLedgerFunding.WaitForLedgerTopUp':
      case 'ExistingLedgerFunding.WaitForLedgerUpdate':
      case 'ExistingLedgerFunding.WaitForPostFundSetup':
      case 'ExistingLedgerFunding.Success':
      case 'ExistingLedgerFunding.Failure':
        return <div>{state.type}</div>;
      default:
        return unreachable(state);
    }
  }
}

export const ExistingLedgerFunding = connect(() => ({}))(ExistingLedgerFundingContainer);
