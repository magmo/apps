import { addStoriesFromScenario as addStories } from '../../../../../__stories__';
import * as scenarios from './scenarios';

addStories(scenarios.newChannelHappyPath, 'Funding / Player B / Happy path');
addStories(scenarios.rejectedStrategy, 'Funding / Player B / Rejected strategy');
addStories(scenarios.cancelledByUser, 'Funding / Player B / Cancelled by user');
addStories(scenarios.cancelledByOpponent, 'Funding / Player B / Cancelled by opponent');
