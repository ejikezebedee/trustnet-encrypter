// Re-export all marketplace components for easier imports
export * from './types';
export * from './core';

// Re-export specific functions with clear names
export { 
  createJob,
  getJobs,
  getJobById,
  applyToJob,
  acceptApplication,
  generateQRCode,
  verifyJobCompletion,
  initializeEscrow,
  releaseEscrow,
  rateJobParticipant,
  getUserJobHistory,
  getUserRatings,
  createDispute,
  getJobCategories,
  getJobStatusColor
} from './core';