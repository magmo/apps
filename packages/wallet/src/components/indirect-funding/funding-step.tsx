import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import * as indirectFundingPlayerA from '../../redux/indirect-funding/player-a/state';
import * as indirectFundingPlayerB from '../../redux/indirect-funding/player-b/state';
import * as indirectFunding from '../../redux/indirect-funding/state';
import StatusBarLayout from '../status-bar-layout';

interface Props {
  step: Step;
}

const completeIcon = (
  <span className="fa-li">
    <FontAwesomeIcon icon={faCheckCircle} color="green" size="lg" />
  </span>
);
const inProgressIcon = (
  <span className="fa-li">
    <FontAwesomeIcon icon={faSpinner} pulse={true} size="lg" />
  </span>
);
const todoIcon = (
  <span className="fa-li">
    <FontAwesomeIcon icon={faCircle} size="lg" />
  </span>
);

const icon = (iconStep: number, currentStep: number) => {
  if (currentStep < iconStep) {
    return todoIcon;
  } else if (currentStep === iconStep) {
    return inProgressIcon;
  } else {
    return completeIcon;
  }
};

export const fundingStepByState = (state: indirectFunding.IndirectFundingState): Step => {
  if (
    indirectFundingPlayerA.WAIT_FOR_PRE_FUND_SETUP_1 === state.type ||
    indirectFundingPlayerB.WAIT_FOR_PRE_FUND_SETUP_0 === state.type
  ) {
    return Step.WAIT_FOR_PRE_FUND_SETUP;
  } else if (
    indirectFundingPlayerA.WAIT_FOR_POST_FUND_SETUP_1 === state.type ||
    indirectFundingPlayerB.WAIT_FOR_POST_FUND_SETUP_0 === state.type
  ) {
    return Step.WAIT_FOR_POST_FUND_SETUP;
  } else {
    return Step.WAIT_FOR_LEDGER_UPDATE;
  }
};

export enum Step {
  WAIT_FOR_PRE_FUND_SETUP,
  WAIT_FOR_DIRECT_FUNDING,
  WAIT_FOR_POST_FUND_SETUP,
  WAIT_FOR_LEDGER_UPDATE,
}

const message = (iconStep: Step, currentStep: Step) => {
  switch (iconStep) {
    case Step.WAIT_FOR_PRE_FUND_SETUP:
      if (currentStep < iconStep) {
        return 'Not ready for prefund setup';
      } else if (currentStep === iconStep) {
        return 'Waiting for opponent prefund setup';
      } else {
        return 'Received opponent prefund setup';
      }
    case Step.WAIT_FOR_DIRECT_FUNDING:
      if (currentStep < iconStep) {
        return 'Not ready for ledger direct funding';
      } else if (currentStep === iconStep) {
        return 'Waiting for ledger direct funding';
      } else {
        return 'Ledger channel directly funded';
      }
    case Step.WAIT_FOR_POST_FUND_SETUP:
      if (currentStep < iconStep) {
        return 'Not ready for postfund setup';
      } else if (currentStep === iconStep) {
        return 'Waiting for opponent postfund setup';
      } else {
        return 'Received opponent postfund setup';
      }
  }
  return '';
};

export class FundingStep extends React.PureComponent<Props> {
  render() {
    const currentStep = this.props.step;
    const children = this.props.children;

    return (
      <StatusBarLayout>
        <h2 className="bp-2">Opening ledger channel</h2>
        <ul className="fa-ul">
          <li style={{ padding: '0.7em 1em' }}>
            {icon(Step.WAIT_FOR_PRE_FUND_SETUP, currentStep)}
            {message(Step.WAIT_FOR_PRE_FUND_SETUP, currentStep)}
          </li>
        </ul>
        <ul className="fa-ul">
          <li style={{ padding: '0.7em 1em' }}>
            {icon(Step.WAIT_FOR_DIRECT_FUNDING, currentStep)}
            {message(Step.WAIT_FOR_DIRECT_FUNDING, currentStep)}
          </li>
        </ul>
        <ul className="fa-ul">
          <li style={{ padding: '0.7em 1em' }}>
            {icon(Step.WAIT_FOR_POST_FUND_SETUP, currentStep)}
            {message(Step.WAIT_FOR_POST_FUND_SETUP, currentStep)}
          </li>
        </ul>
        <div className="pb-2">{children}</div>
      </StatusBarLayout>
    );
  }
}
