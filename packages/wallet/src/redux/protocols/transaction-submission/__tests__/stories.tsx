import { addStoriesFromScenario as addStories } from '../../../../__stories__';
import * as scenarios from './scenarios';

addStories(scenarios.happyPath, 'Transaction Submission / Happy path');
addStories(scenarios.retryAndApprove, 'Transaction Submission / User approves retry');
addStories(scenarios.retryAndDeny, 'Transaction Submission / User denies retry');
addStories(scenarios.transactionFailed, 'Transaction Submission / Transaction fails');
