import { PureComponent } from 'react';
import React from 'react';
import { connect } from 'react-redux';
import { unreachable } from '../../../utils/reducer-utils';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import WaitForLedgerConclude from './components/wait-for-ledger-conclude';
import WaitForLedgerUpdate from './components/wait-for-ledger-update';
import * as states from './states';

interface Props {
  state: states.IndirectDefundingState;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'IndirectDefunding.WaitForLedgerUpdate':
        return <WaitForLedgerUpdate ledgerId={state.ledgerId} />;
      case 'IndirectDefunding.WaitForConclude':
        return <WaitForLedgerConclude ledgerId={state.ledgerId} />;
      case 'IndirectDefunding.Failure':
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case 'IndirectDefunding.Success':
        return <Success name="indirect-de-funding" />;
      default:
        return unreachable(state);
    }
  }
}
export const IndirectDefunding = connect(
  () => ({}),
  () => ({}),
)(IndirectDefundingContainer);
