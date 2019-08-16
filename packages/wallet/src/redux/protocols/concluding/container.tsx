import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NonTerminalConcludingState } from '.';
import WaitForOtherPlayer from '../shared-components/wait-for-other-player';
import { unreachable } from '../../../utils/reducer-utils';

interface Props {
  state: NonTerminalConcludingState;
}

class ConcludingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'Concluding.WaitForConclude':
        return <WaitForOtherPlayer actionDescriptor={'conclude'} channelId={state.channelId} />;
      case 'Concluding.WaitForDefund':
        return <WaitForOtherPlayer actionDescriptor={'defund'} channelId={state.channelId} />;
      default:
        return unreachable(state);
    }
  }
}

export const Concluding = connect(
  () => ({}),
  () => ({}),
)(ConcludingContainer);
