import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PureComponent } from 'react';
import React from 'react';
import { connect } from 'react-redux';
import { Concluding as ConcludingInstigator } from './instigator/container';
import * as concludingInstigatorStates from './instigator/states';
import { Concluding as ConcludingResponder } from './responder/container';
import * as concludingResponderStates from './responder/states';
import * as states from './states';

interface Props {
  state: states.ConcludingState;
}

class ConcludingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    if (
      concludingInstigatorStates.isConcludingInstigatorState(state) &&
      !states.isTerminal(state)
    ) {
      return <ConcludingInstigator state={state} />;
    }

    if (concludingResponderStates.isConcludingResponderState(state) && !states.isTerminal(state)) {
      return <ConcludingResponder state={state} />;
    }
    // TODO: We need a placeholder screen here when transitioning back to the app from a success state
    return (
      <div>
        <FontAwesomeIcon icon={faSpinner} pulse={true} size="lg" />
      </div>
    );
  }
}

export const Concluding = connect(() => ({}))(ConcludingContainer);
