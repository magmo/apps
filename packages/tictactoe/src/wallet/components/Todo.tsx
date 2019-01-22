import React from 'react';

interface Props {
  stateType: string;
}

export default class Todo extends React.PureComponent<Props> {
  render() {
    return (
      <div>
        <h1 className='wallet'>TODO: Screen not implemented!</h1>
        <p className='wallet'>
          Screen has not yet been built for the <strong>{this.props.stateType}</strong>!
        </p>
      </div>
    );
  }
}
