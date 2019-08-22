import React, { Fragment } from 'react';
import { DisplayChannel } from '../states';
import DataTable from 'react-data-table-component';
import Button from 'reactstrap/lib/Button';
import { formatEther, bigNumberify } from 'ethers/utils';

export interface Props {
  ledgerChannels: DisplayChannel[];
  applicationChannels: DisplayChannel[];
  closeAction: () => void;
  closeChannelAction: (channelId: string) => void;
}

export default class DisplayChannels extends React.Component<Props> {
  render() {
    const { ledgerChannels, applicationChannels, closeAction, closeChannelAction } = this.props;
    const hubColumns = [
      {
        name: 'Channel Id',
        selector: 'channelId',
      },
      {
        name: 'Your Deposit',
        selector: 'ourAmount',
        cell: row => <div>{formatEther(bigNumberify(row.ourAmount || '0x0'))}</div>,
      },

      {
        name: 'Channel Total',
        selector: 'channelAmount',
        cell: row => <div>{formatEther(bigNumberify(row.channelAmount || '0x0'))}</div>,
      },

      {
        name: 'Status',
        selector: 'fundingChannel',
        cell: row => <div>{row.fundingChannel ? `Funding ${row.channelId}` : 'Open'}</div>,
      },
      {
        selector: 'fundingChannel',
        cell: row => (
          <div>
            {!row.fundingChannel ? (
              <Button
                onClick={() => {
                  closeChannelAction(row.channelId);
                }}
              >
                Close Channel
              </Button>
            ) : (
              ''
            )}
          </div>
        ),
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
      },

      {
        name: "Opponent's Funds",
        selector: 'opponentAmount',
        cell: row => <div>{formatEther(bigNumberify(row.opponentAmount || '0x0'))}</div>,
      },
      {
        name: 'Status',
        selector: 'fundedBy',
        cell: row => <div>{row.fundedBy ? `Funded by ${row.fundedBy}` : 'Directly Funded'}</div>,
      },
    ];

    return (
      <Fragment>
        <DataTable title="Hub Channels" columns={hubColumns} data={ledgerChannels} />
        <DataTable title="Application Channels" columns={appColumns} data={applicationChannels} />
        <div style={{ textAlign: 'center' }}>
          <Button style={{ margin: '10px 0' }} onClick={closeAction}>
            Close
          </Button>
        </div>
      </Fragment>
    );
  }
}
