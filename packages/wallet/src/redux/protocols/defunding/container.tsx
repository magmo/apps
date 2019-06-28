import { PureComponent } from 'react';
import React from 'react';
import { connect } from 'react-redux';
import { IndirectDefunding } from '../indirect-defunding/container';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import { Withdrawal } from '../withdrawing/container';
import * as states from './states';

interface Props {
  state: states.DefundingState;
}

class DefundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'Defunding.WaitForWithdrawal':
        return <Withdrawal state={state.withdrawalState} />;
      case 'Defunding.WaitForIndirectDefunding':
        return <IndirectDefunding state={state.indirectDefundingState} />;
      case 'Defunding.Failure':
        return <Failure name="de-funding" reason={state.reason} />;
      case 'Defunding.Success':
        return <Success name="de-funding" />;
    }
  }
}
export const Defunding = connect(
  () => ({}),
  () => ({}),
)(DefundingContainer);
