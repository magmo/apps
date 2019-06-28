import React from 'react';
import { FundingStrategy } from '../../redux/protocols/funding';
import ApproveX from '../approve-x';

interface Props {
  strategyChosen: (strategy: FundingStrategy) => void;
  cancelled: () => void;
}

export default class ApproveStrategy extends React.PureComponent<Props> {
  render() {
    const { strategyChosen, cancelled } = this.props;
    return (
      <ApproveX
        title="Funding channel"
        description="Do you want to fund this state channel with a re-usable ledger channel?"
        yesMessage="Fund Channel"
        noMessage="Cancel"
        approvalAction={() => strategyChosen('NewLedgerFundingStrategy')}
        rejectionAction={cancelled}
      >
        <React.Fragment>This site wants you to fund a new state channel.</React.Fragment>
      </ApproveX>
    );
  }
}
