import React from 'react';
import SidebarLayout from './SidebarLayout';

interface Props {
  name: string;
}

export default class SubmitX extends React.PureComponent<Props> {
  render() {
    const { name } = this.props;
    return (
      <SidebarLayout>
        <h1 className='wallet'>Sending your {name}</h1>
        <p className='wallet'>
          Please confirm the transaction in MetaMask.
        </p>
      </SidebarLayout>
    );
  }
}
