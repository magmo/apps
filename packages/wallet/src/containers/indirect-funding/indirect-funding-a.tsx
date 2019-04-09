import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import ApproveFunding from '../../components/indirect-funding/approve-funding';
import { FundingStep, fundingStepByState } from '../../components/indirect-funding/funding-step';
import * as indirectFundingPlayerA from '../../redux/indirect-funding/player-a/state';
import { unreachable } from '../../utils/reducer-utils';
import * as actions from '../../redux/indirect-funding/player-a/actions';

interface Props {
  indirectFundingAState: indirectFundingPlayerA.PlayerAState;
  fundingApproved: (processId: string) => void;
  fundingRejected: (processId: string) => void;
}

class IndirectFundingAContainer extends PureComponent<Props> {
  render() {
    // TODO: where is the processId  stored?
    const processId = '123';
    const { indirectFundingAState, fundingApproved } = this.props;
    const step = fundingStepByState(indirectFundingAState);
    const processFundingApproved = () => fundingApproved(processId);
    const processFundingRejected = () => fundingApproved(processId);

    switch (indirectFundingAState.type) {
      case indirectFundingPlayerA.WAIT_FOR_APPROVAL:
        return (
          <ApproveFunding
            fundingApproved={processFundingApproved}
            fundingRejected={processFundingRejected}
            requestedTotalFunds={'1000000000000000'}
            requestedYourContribution={'500000000000000'}
          />
        );
      case indirectFundingPlayerA.WAIT_FOR_PRE_FUND_SETUP_1:
      case indirectFundingPlayerA.WAIT_FOR_POST_FUND_SETUP_1:
      case indirectFundingPlayerA.WAIT_FOR_LEDGER_UPDATE_1:
        return <FundingStep step={step} />;
      case indirectFundingPlayerA.WAIT_FOR_DIRECT_FUNDING:
        return <div />;
      // TODO: pass the relevant state to DirectFundingContainer
      // return <DirectFundingContainer />;
      default:
        return unreachable(indirectFundingAState);
    }
  }
}

const mapDispatchToProps = {
  fundingApproved: actions.fundingApproved,
  fundingRejected: actions.fundingApproved,
};

export default connect(
  () => ({}),
  mapDispatchToProps,
)(IndirectFundingAContainer);
