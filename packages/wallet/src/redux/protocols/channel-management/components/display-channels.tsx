import React, { Fragment } from 'react';
import { DisplayChannel } from '../states';
import ReactTable from 'react-table';
import Button from 'reactstrap/lib/Button';

export interface Props {
  channels: DisplayChannel[];
  closeAction: () => void;
}

export default class DisplayChannels extends React.Component<Props> {
  render() {
    const { channels, closeAction } = this.props;
    const columns = [
      {
        Header: 'Channel Id',
        accessor: 'channelId',
      },
      { Header: 'OpponentAddress', access: 'opponentAddress' },
      {
        Header: 'Your Amount',
        accessor: 'ourAmount',
      },
      {
        Header: 'Opponent Amount',
        accessor: 'opponentAmount',
      },
      {
        Header: 'In use?',
        accessor: 'inUse',
      },
    ];
    const table = <ReactTable data={channels} columns={columns} />;
    return (
      <Fragment>
        <div>{table}</div>
        <Button onClick={closeAction}>Close</Button>
      </Fragment>
    );
  }
}
