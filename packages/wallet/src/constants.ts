import { getStringEnvironmentVariable, getNumberEnvironmentVariable } from './utils/env-utils';

export const ADJUDICATOR_ADDRESS = getStringEnvironmentVariable('ADJUDICATOR_ADDRESS');
export const CONSENSUS_LIBRARY_ADDRESS = getStringEnvironmentVariable('CONSENSUS_LIBRARY_ADDRESS');
export const ADJUDICATOR_ABI = getStringEnvironmentVariable('ADJUDICATOR_ABI');
export const NETWORK_ID = getNumberEnvironmentVariable('TARGET_NETWORK_ID');
