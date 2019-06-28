import { addStoriesFromScenario as addStories } from '../../../../../__stories__';
import * as scenarios from './scenarios';

function flattenScenario(scenario) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      scenario[key].state = scenario[key].state.state;
    }
  });
  return scenario;
}

addStories(flattenScenario(scenarios.happyPath), 'Indirect Funding / Player A / Happy Path');
addStories(
  flattenScenario(scenarios.ledgerFundingFails),
  'Indirect Funding / Player A / Ledger funding fails',
);
