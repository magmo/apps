import * as scenarios from './scenarios';

import { addStoriesFromScenarioAsWallet as addStories } from '../../../../__stories__';

addStories(scenarios.aHappyPath, 'Direct Funding / PlayerA / Happy Path');
