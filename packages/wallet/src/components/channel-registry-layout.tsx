import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

interface Props {
    state: states.Initialized;
  }
  
class ChannelRegistryLayout extends PureComponent<Props> {
  render() {
    const channels = this.props.state.channelState.initializedChannels;
    let channelList: string = '';
    for (const key in channels) {
        if (key) {
            channelList = channelList.concat(key);
            channelList = channelList.concat(', ');
            // console.log(key);
            // console.log(channelList);
        }
    }
    console.log(channelList);
    return (
        <div>
        {/* <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i> Ledger Channels </i>
        </div>
        <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i> Application Channels</i>
        </div> */}
        <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i>Channels </i>
        </div>
        { channelList }
        </div>

    );
  }
}
export default connect(() => ({}))(ChannelRegistryLayout);