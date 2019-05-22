import * as scenarios from './scenarios';
import { addStoriesFromScenario as addStories } from '../../../../../__stories__';

addStories(scenarios.happyPath, 'Indirect Funding / Player A / Happy Path');
addStories(scenarios.ledgerFundingFails, 'Indirect Funding / Player A / Ledger funding fails');
