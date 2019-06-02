import * as states from './states';
import { PureComponent } from 'react';
import React from 'react';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import { connect } from 'react-redux';
import WaitForLedgerUpdate from './components/wait-for-ledger-update';
import { unreachable } from '../../../utils/reducer-utils';
import { CommitmentType } from 'fmg-core';
import ConfirmLedgerUpdate from './components/confirm-ledger-update';
// import { challengeChosen, updateConfirmed } from './actions';

interface Props {
  state: states.IndirectDefundingState;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'IndirectDefunding.WaitForLedgerUpdate':
        return (
          <WaitForLedgerUpdate
            ledgerId={state.ledgerId}
            isConclude={state.commitmentType === CommitmentType.Conclude}
            challenge={() => null}
            // challenge={() =>
            //   challengeChosen({ processId: state.processId, challengeCommitment: {} })
            // } // the challenge commitment should probably be crafted in the reducer
          />
        );
      case 'IndirectDefunding.Failure':
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case 'IndirectDefunding.ConfirmLedgerUpdate':
        return (
          <ConfirmLedgerUpdate
            ledgerId={state.ledgerId}
            isConclude={state.commitmentType === CommitmentType.Conclude}
            confirm={() => null}
            // confirm={
            //   () =>
            //     updateConfirmed({
            //       processId: state.processId,
            //       commitmentType: state.commitmentType,
            //     }) // the ledger update commitment should probably be crafted in the reducer
            // }
          />
        );
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
