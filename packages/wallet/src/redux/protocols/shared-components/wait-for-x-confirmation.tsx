import React from 'react';

interface Props {
  name: string;
  transactionID: string;
  networkId: string;
}

export default class WaitForXConfirmation extends React.PureComponent<Props> {
  buildEtherscanLink() {
    switch (parseInt(this.props.networkId, 16)) {
      case 1:
        return `https://etherscan.io/tx/${this.props.transactionID}`;
      case 4:
        return `https://rinkeby.etherscan.io/tx/${this.props.transactionID}`;
      case 3:
        return `https://ropsten.etherscan.io/tx/${this.props.transactionID}`;
      case 42:
        return `https://kovan.etherscan.io/tx/${this.props.transactionID}`;
      default:
        // We'll pretend we're on the main network just to verify the link works as expected
        return `https://etherscan.io/tx/${this.props.transactionID}`;
    }
  }
  render() {
    const { name } = this.props;
    return (
      <div>
        <h2>Waiting for your {name} to be mined!</h2>
        <p>
          Hold tight! Visit{' '}
          <a target="_blank" href={this.buildEtherscanLink()}>
            this link
          </a>{' '}
          to check on its status.
        </p>
      </div>
    );
  }
}
