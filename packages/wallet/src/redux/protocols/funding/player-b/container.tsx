import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as actions from './actions';
import * as states from './states';

import { FundingStrategy } from '..';
import AcknowledgeX from '../../../../components/acknowledge-x';
import ApproveStrategy from '../../../../components/funding/approve-strategy';
import WaitForOtherPlayer from '../../../../components/wait-for-other-player';
import { unreachable } from '../../../../utils/reducer-utils';
import { TwoPartyPlayerIndex } from '../../../types';
import { ActionDispatcher } from '../../../utils';
import { ExistingLedgerFunding } from '../../existing-ledger-funding/container';
import { NewLedgerFunding } from '../../new-ledger-funding/container';
import { isNewLedgerFundingState } from '../../new-ledger-funding/states';
interface Props {
  state: states.OngoingFundingState;
  strategyApproved: ActionDispatcher<actions.StrategyApproved>;
  strategyRejected: ActionDispatcher<actions.StrategyRejected>;
  fundingSuccessAcknowledged: ActionDispatcher<actions.FundingSuccessAcknowledged>;
  cancelled: ActionDispatcher<actions.Cancelled>;
}

class FundingContainer extends PureComponent<Props> {
  render() {
    const { state, strategyApproved, cancelled, fundingSuccessAcknowledged } = this.props;
    const { processId } = state;

    switch (state.type) {
      case 'Funding.PlayerB.WaitForStrategyProposal':
        return <WaitForOtherPlayer name={'strategy choice'} />;
      case 'Funding.PlayerB.WaitForStrategyApproval':
        return (
          <ApproveStrategy
            strategyChosen={(strategy: FundingStrategy) =>
              strategyApproved({ processId, strategy })
            }
            cancelled={() => cancelled({ processId, by: TwoPartyPlayerIndex.B })}
          />
        );
      case 'Funding.PlayerB.WaitForFunding':
        if (isNewLedgerFundingState(state.fundingState)) {
          return <NewLedgerFunding state={state.fundingState} />;
        } else {
          return <ExistingLedgerFunding state={state.fundingState} />;
        }
      case 'Funding.PlayerB.WaitForSuccessConfirmation':
        return (
          <AcknowledgeX
            title="Channel funded!"
            action={() => fundingSuccessAcknowledged({ processId })}
            description="You have successfully funded your channel"
            actionTitle="Ok!"
          />
        );
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  strategyChosen: actions.strategyProposed,
  strategyApproved: actions.strategyApproved,
  strategyRejected: actions.strategyRejected,
  fundingSuccessAcknowledged: actions.fundingSuccessAcknowledged,
  cancelled: actions.cancelled,
};

export const Funding = connect(
  () => ({}),
  mapDispatchToProps,
)(FundingContainer);
