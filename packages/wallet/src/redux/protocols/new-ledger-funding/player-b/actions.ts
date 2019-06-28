import { CommitmentReceived } from '../../../actions';
import { DirectFundingAction } from '../../direct-funding';
// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export type Action = DirectFundingAction | CommitmentReceived;
