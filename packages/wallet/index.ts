import * as communicationModule from './src/communication';
import { RelayableAction } from './src/communication';
import { unreachable } from './src/utils/reducer-utils';

// We don't want to export test scenarios from the communication module, but in
// other packages that want to use the communication module, we want them
// to have access to the same test scenarios
import communicationScenarios from './src/communication/__tests__/test-scenarios';
const communication = { ...communicationModule, testScenarios: communicationScenarios };

export { communication, RelayableAction, unreachable };
