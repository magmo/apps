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
    const hubColumns = [
      {
        name: 'Channel Id',
        selector: 'channelId',
      },
      {
        name: 'Your Deposit',
        selector: 'ourAmount',
        cell: row => <div>{formatEther(bigNumberify(row.ourAmount || '0x0'))}</div>,
        width: '50px',
      },

      {
        name: 'Channel Total',
        selector: 'channelAmount',
        cell: row => <div>{formatEther(bigNumberify(row.channelAmount || '0x0'))}</div>,
        width: '50px',
      },

      {
        name: 'Status',
        selector: 'fundingChannel',
        cell: row => <div>{row.fundingChannel ? `Funding ${row.channelId}` : 'Open'}</div>,
      },
    ];
    const appColumns = [
      {
        name: 'Channel Id',
        selector: 'channelId',
      },
      {
        name: "Opponent's address",
        selector: 'opponentAddress',
      },
      {
        name: 'Your Funds',
        selector: 'ourAmount',
        cell: row => <div>{formatEther(bigNumberify(row.ourAmount || '0x0'))}</div>,
        width: '50px',
      },

      {
        name: "Opponent's Funds",
        selector: 'opponentAmount',
        cell: row => <div>{formatEther(bigNumberify(row.channelAmount || '0x0'))}</div>,
        width: '50px',
      },
      {
        name: 'Status',
        selector: 'fundedBy',
        cell: row => <div>{row.fundedBy ? `Funded by ${row.fundedBy}` : 'Directly Funded'}</div>,
      },
    ];
    const ledgerTable = (
      <DataTable title="Hub Channels" columns={hubColumns} data={ledgerChannels} />
    );
    const appTable = (
      <DataTable title="Application Channels" columns={appColumns} data={applicationChannels} />
    );

    return (
      <Fragment>
        {ledgerTable}
        {appTable}
        <Button onClick={closeAction}>Close</Button>
      </Fragment>
    );
  }
}
