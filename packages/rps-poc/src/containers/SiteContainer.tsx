import React from 'react';

import ApplicationContainer from './ApplicationContainer';
import HomePageContainer from './HomePageContainer';
import { connect } from 'react-redux';

import { SiteState } from '../redux/reducer';
import MetamaskErrorPage from '../components/MetamaskErrorPage';
import { MetamaskError } from '../redux/metamask/actions';
import LoadingPage from '../components/LoadingPage';

interface SiteProps {
  isAuthenticated: boolean;
  metamaskError: MetamaskError | null;
  loading: boolean;
}

function Site(props: SiteProps) {
  let component;
  if (props.loading) {
    component = <LoadingPage />;
  } else if (props.metamaskError !== null) {
    component = <MetamaskErrorPage error={props.metamaskError} />;
  } else if (props.isAuthenticated) {
    component = <ApplicationContainer />;
  } else {
    component = <HomePageContainer />;
  }
  return <div><iframe src="http://localhost:3000" id="walletId" width="100%" height="100%" allowTransparency={true} />{component}</div>;
}

const mapStateToProps = (state: SiteState): SiteProps => {
  return {
    isAuthenticated: state.login && state.login.loggedIn,
    loading: state.metamask.loading,
    metamaskError: state.metamask.error,
  };
};

export default connect(mapStateToProps)(Site);
