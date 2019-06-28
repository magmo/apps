import { addStoriesFromScenario as addStories } from '../../../../__stories__';
import * as scenarios from './scenarios';

addStories(scenarios.twoPlayerAHappyPath, 'Consensus Update /Two Player Player A Happy Path');
addStories(scenarios.twoPlayerBHappyPath, 'Consensus Update /Two Player Player B Happy Path');
