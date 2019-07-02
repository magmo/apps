import * as scenarios from './scenarios';
import { addStoriesFromScenarioAsWallet as addStories } from '../../../../../__stories__';

addStories(scenarios.happyPath, 'Concluding / Responder / Happy Path');
addStories(scenarios.channelDoesntExist, 'Concluding / Responder / Channel doesnt exist');
addStories(scenarios.concludingNotPossible, 'Concluding / Responder / Concluding impossible');
