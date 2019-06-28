import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { unreachable } from '../../../../utils/reducer-utils';
import { FundingStep } from './components/funding-step';
import { PlayerBState } from './states';

interface Props {
  state: PlayerBState;
}

class NewLedgerFundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'NewLedgerFunding.BWaitForPreFundSetup0':
      case 'NewLedgerFunding.BWaitForDirectFunding':
      case 'NewLedgerFunding.BWaitForPostFundSetup0':
      case 'NewLedgerFunding.BWaitForLedgerUpdate0':
        return <FundingStep newLedgerFundingStateB={state} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {};

export const NewLedgerFunding = connect(
  () => ({}),
  mapDispatchToProps,
)(NewLedgerFundingContainer);
