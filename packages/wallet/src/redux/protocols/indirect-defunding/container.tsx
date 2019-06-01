import * as states from './states';
import { PureComponent } from 'react';
import React from 'react';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import { connect } from 'react-redux';
import WaitForLedgerUpdate from './components/wait-for-ledger-update';
import { unreachable } from '../../../utils/reducer-utils';
import WaitForLedgerConclude from './components/wait-for-ledger-conclude';
import { CommitmentType } from 'fmg-core';

interface Props {
  state: states.IndirectDefundingState;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'IndirectDefunding.WaitForLedgerUpdate':
        if (state.commitmentType === CommitmentType.App) {
          return <WaitForLedgerUpdate ledgerId={state.ledgerId} />;
        }
        if (state.commitmentType === CommitmentType.Conclude) {
          return <WaitForLedgerConclude ledgerId={state.ledgerId} />;
        }
        return unreachable(state.commitmentType);
      case 'IndirectDefunding.Failure':
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case 'IndirectDefunding.ConfirmLedgerUpdate':
      // todo
      case 'IndirectDefunding.WaitForDisputeChallenger':
      // todo
      case 'IndirectDefunding.WaitForDisputeResponder':
      // todo
      case 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain':
      // todo
      case 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain':
      // todo
      case 'IndirectDefunding.FinalizedOnChain':
      // todo
      case 'IndirectDefunding.FinalizedOffChain':
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
