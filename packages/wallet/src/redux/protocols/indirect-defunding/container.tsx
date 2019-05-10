import * as states from './state';
import { PureComponent } from 'react';
import React from 'react';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import { connect } from 'react-redux';
import WaitForLedgerUpdate from './components/wait-for-ledger-update';

interface Props {
  state: states.IndirectDefundingState;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case states.WAIT_FOR_LEDGER_UPDATE:
        return <WaitForLedgerUpdate ledgerId="0xTODO" />;
      case states.FAILURE:
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case states.SUCCESS:
        return <Success name="indirect-de-funding" />;
      default:
        return null;
    }
  }
}
export const IndirectDefunding = connect(
  () => ({}),
  () => ({}),
)(IndirectDefundingContainer);
