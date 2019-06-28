import { addStoriesFromScenario as addStories } from '../../../../../__stories__';
import * as scenarios from './scenarios';

addStories(scenarios.newChannelHappyPath, 'Funding / Player A / Happy path');
addStories(scenarios.rejectedStrategy, 'Funding / Player A / Rejected strategy');
addStories(scenarios.cancelledByUser, 'Funding / Player A / Cancelled by user');
addStories(scenarios.cancelledByOpponent, 'Funding / Player A / Cancelled by opponent');
