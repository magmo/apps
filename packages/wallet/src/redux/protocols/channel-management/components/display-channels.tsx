import React, { Fragment } from 'react';
import { DisplayChannel } from '../states';
import DataTable from 'react-data-table-component';
import Button from 'reactstrap/lib/Button';
import { formatEther, bigNumberify } from 'ethers/utils';

export interface Props {
  ledgerChannels: DisplayChannel[];
  applicationChannels: DisplayChannel[];
  closeAction: () => void;
}

export default class DisplayChannels extends React.Component<Props> {
  render() {
    const { ledgerChannels, applicationChannels, closeAction } = this.props;
    const columns = [
      {
        name: 'Channel Id',
        selector: 'channelId',
      },
      { name: 'OpponentAddress', selector: 'opponentAddress' },
      {
        name: 'Your Amount',
        selector: 'ourAmount',
        cell: row => <div>{formatEther(bigNumberify(row.ourAmount || '0x0'))}</div>,
      },
      {
        name: 'Opponent Amount',
        selector: 'opponentAmount',
        cell: row => <div>{formatEther(bigNumberify(row.opponentAmount || '0x0'))}</div>,
      },
      {
        name: 'Channel Total',
        selector: 'channelAmount',
        cell: row => <div>{formatEther(bigNumberify(row.channelAmount || '0x0'))}</div>,
      },
      {
        name: 'Funding Channel',
        selector: 'fundingChannel',
      },
      {
        name: 'Funded By',
        selector: 'fundedBy',
      },
    ];
    const ledgerTable = <DataTable columns={columns} data={ledgerChannels} />;
    const appTable = <DataTable columns={columns} data={applicationChannels} />;

    return (
      <Fragment>
        {ledgerTable}
        {appTable}
        <Button onClick={closeAction}>Close</Button>
      </Fragment>
    );
  }
}
