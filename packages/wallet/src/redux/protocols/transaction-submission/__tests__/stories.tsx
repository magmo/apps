import * as scenarios from './scenarios';
import { addStoriesFromScenarioAsWallet as addStories } from '../../../../__stories__';

addStories(scenarios.happyPath, 'Transaction Submission / Happy path');
addStories(scenarios.retryAndApprove, 'Transaction Submission / User approves retry');
addStories(scenarios.retryAndDeny, 'Transaction Submission / User denies retry');
addStories(scenarios.transactionFailed, 'Transaction Submission / Transaction fails');
