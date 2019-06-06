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
import Acknowledge from '../shared-components/acknowledge';
import { createChallengeRequested } from '../actions';

interface Props {
  state: states.IndirectDefundingState;
  challengeChosen: typeof createChallengeRequested;
  updateConfirmed: typeof actions.updateConfirmed;
  acknowledged: typeof actions.acknowledged;
}

class IndirectDefundingContainer extends PureComponent<Props> {
  render() {
    const { state, challengeChosen, updateConfirmed, acknowledged } = this.props;
    switch (state.type) {
      case 'IndirectDefunding.WaitForLedgerUpdate':
        return (
          <WaitForLedgerUpdate
            ledgerId={state.ledgerId}
            isConclude={state.commitmentType === CommitmentType.Conclude}
            challenge={() =>
              challengeChosen({
                channelId: state.ledgerId,
                embeddedProtocolAction: actions.challengeChosen({ processId: state.processId }),
              })
            }
          />
        );
      case 'IndirectDefunding.Failure':
        return <Failure name="indirect-de-funding" reason={state.reason} />;
      case 'IndirectDefunding.ConfirmLedgerUpdate':
        if (state.isRespondingToChallenge) {
          return (
            <ConfirmLedgerUpdate
              ledgerId={state.ledgerId}
              isConclude={state.commitmentType === CommitmentType.Conclude}
              respond={() =>
                updateConfirmed({
                  processId: state.processId,
                  commitmentType: state.commitmentType,
                })
              }
            />
          );
        } else {
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
        }
      case 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain':
        return (
          <Acknowledge
            title="Concluding Succesful"
            description="Your channel was closed and defunded (off chain)."
            acknowledge={() => acknowledged({ processId: state.processId })}
          />
        );
      case 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain':
        return (
          <Acknowledge
            title="Concluding Succesful"
            description="Your channel was closed and defunded (on chain)."
            acknowledge={() => acknowledged({ processId: state.processId })}
          />
        );
      case 'IndirectDefunding.FinalizedOnChain':
      case 'IndirectDefunding.FinalizedOffChain':
        return <Success name="indirect-de-funding" />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  updateConfirmed: actions.updateConfirmed,
  challengeChosen: createChallengeRequested,
  acknowledged: actions.acknowledged,
};

export const IndirectDefunding = connect(
  () => ({}),
  mapDispatchToProps,
)(IndirectDefundingContainer);
