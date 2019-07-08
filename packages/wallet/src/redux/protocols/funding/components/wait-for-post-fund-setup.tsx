import React from 'react';
import { Checklist, MessagesForStep, messagesForStep } from '../../shared-components/checklist';

import { AdvanceChannelState } from '../../advance-channel';
// TODO: Update this properly for post fund setup exchange
interface Props {
  advanceChannelState: AdvanceChannelState;
}

export enum Step {
  WAITING_FOR_FUNDING_CONFIRMATION,
  CHANNEL_FUNDED,
  FUNDING_FAILED,
}

const fundingStepByState = (state: AdvanceChannelState): Step => {
  switch (state.type) {
    case 'AdvanceChannel.Success':
      return Step.CHANNEL_FUNDED;
    case 'AdvanceChannel.Failure':
      // todo: restrict this to non-terminal states
      return Step.FUNDING_FAILED;
    default:
      return Step.WAITING_FOR_FUNDING_CONFIRMATION;
  }
};

const messagesForStepList: MessagesForStep[] = [
  messagesForStep(
    'Not listening for fund confirmation',
    'Listening for fund confirmation',
    'Adjudicator funded',
  ),
  messagesForStep('Channel not yet funded', 'Channel is funded', 'UNUSED'),
];

export class WaitForPostFundSetup extends React.PureComponent<Props> {
  render() {
    const advanceChannelState = this.props.advanceChannelState;
    const currentStep = fundingStepByState(advanceChannelState);

    return (
      <Checklist
        step={currentStep}
        stepMessages={messagesForStepList}
        title="Directly funding a channel"
      />
    );
  }
}
