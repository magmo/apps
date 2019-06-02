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
import * as actions from './actions';

interface Props {
  state: states.IndirectDefundingState;
  challengeChosen: typeof actions.challengeChosen;
  updateConfirmed: typeof actions.updateConfirmed;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state, challengeChosen, updateConfirmed } = this.props;
    switch (state.type) {
      case 'IndirectDefunding.WaitForLedgerUpdate':
        return (
          <WaitForLedgerUpdate
            ledgerId={state.ledgerId}
            isConclude={state.commitmentType === CommitmentType.Conclude}
            challenge={() => challengeChosen({ processId: state.processId })}
          />
        );
      case 'IndirectDefunding.Failure':
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case 'IndirectDefunding.ConfirmLedgerUpdate':
        return (
          <ConfirmLedgerUpdate
            ledgerId={state.ledgerId}
            isConclude={state.commitmentType === CommitmentType.Conclude}
            confirm={() =>
              updateConfirmed({
                processId: state.processId,
                commitmentType: state.commitmentType,
              })
            }
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

const mapDispatchToProps = {
  updateConfirmed: actions.updateConfirmed,
  challengeChosen: actions.challengeChosen,
};

export const IndirectDefunding = connect(
  () => ({}),
  mapDispatchToProps,
)(IndirectDefundingContainer);
