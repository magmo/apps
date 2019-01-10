import React from 'react';
import SidebarLayout from './SidebarLayout';

interface Props {
  name: string;
}

export default class WaitForXConfirmation extends React.PureComponent<Props> {
  render() {
    const { name } = this.props;
    return (
      <SidebarLayout>
        <h1 className='wallet'>Confirming your {name}</h1>
        <p className='wallet'>
          Hold tight! Visit <a>this link [TODO]</a> to check on its status.
        </p>
      </SidebarLayout>
    );
  }
}
