import React from 'react';
import ApproveX from '../ApproveX';

interface Props {
  fundingApproved: () => void;
  fundingRejected: () => void;
}

export default class ApproveFunding extends React.PureComponent<Props> {
  render() {
    const { fundingApproved, fundingRejected } = this.props;
    return (
      <ApproveX
        title="Opening Channel"
        description="Do you want to open this state channel?"
        yesMessage="Open Channel"
        noMessage="Cancel"
        approvalAction={fundingApproved}
        rejectionAction={fundingRejected}
      >
        <React.Fragment>
          This site wants you to open a new state channel.
          <br />
          <br />
          <div className='row'>
            <div className='col-sm-6'>
              <h3>0.1 ETH</h3>
              <div>Total</div>
            </div>
            <div className='col-sm-6'>
              <h3>0.05 ETH</h3>
              <div>Your deposit</div>
            </div>
          </div>
          <br />
          
        </React.Fragment>
      </ApproveX>
    );
  }
}

