import React from 'react';
// import walletIcon from '../../images/wallet_icon.svg';
import SidebarLayout from './SidebarLayout';
import YesOrNo from './YesOrNo';

interface Props {
  yesMessage: string;
  noMessage: string;
  title: string;
  approvalAction: () => void;
  rejectionAction: () => void;
  description: string;
}

export default class ApproveX extends React.PureComponent<Props> {

  render() {
    const { yesMessage, noMessage, approvalAction, rejectionAction, title, description } = this.props;
    return (
      <SidebarLayout>
        <h1 className='wallet'>{title}</h1>
        <p className='wallet'>{description}</p>

        <YesOrNo yesAction={approvalAction} noAction={rejectionAction} yesMessage={yesMessage} noMessage={noMessage} />
      </SidebarLayout>
    );
  }
}
