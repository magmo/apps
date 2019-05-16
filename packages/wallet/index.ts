import * as communicationModule from './src/communication';
import { RelayableAction, CommitmentReceived, StrategyProposed } from './src/communication';
import { unreachable } from './src/utils/reducer-utils';
import { getProcessId } from './src/redux/reducer';

// We don't want to export test scenarios from the communication module, but in
// other packages that want to use the communication module, we want them
// to have access to the same test scenarios
import communicationScenarios from './src/communication/__tests__/test-scenarios';
import { getChannelId } from './src/domain';
import { WalletProtocol } from './src/redux/types';
const communication = { ...communicationModule, testScenarios: communicationScenarios };

export { communication, unreachable, getChannelId, getProcessId, WalletProtocol };
export { RelayableAction, CommitmentReceived, StrategyProposed };
