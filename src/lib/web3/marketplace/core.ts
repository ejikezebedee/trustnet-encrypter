import { Job, JobApplication, JobRating, JobFilter, JobCategory, JobStatus, ApplicationStatus, EscrowWallet, DisputeCase } from './types';
import { TrustBadge, Message } from '../messaging/types';
import { getTrustBadgeFromScore } from '../messaging/core';

// Mock data for development - in production this would connect to blockchain
let jobs: Job[] = [];
let applications: JobApplication[] = [];
let ratings: JobRating[] = [];
let escrowWallets: Map<string, EscrowWallet> = new Map();
let disputes: DisputeCase[] = [];

export const createJob = async (
  title: string,
  description: string,
  category: JobCategory,
  location: string,
  budget: number,
  requiredTrustScore: number,
  completionTime: string,
  deliveryMethod: 'in-person' | 'remote',
  posterAddress: string,
  posterTrustScore: number
): Promise<Job> => {
  const job: Job = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    category,
    location,
    budget,
    currency: 'TRUST', // Test token
    requiredTrustScore,
    completionTime,
    deliveryMethod,
    posterAddress,
    posterTrustScore,
    posterTrustBadge: getTrustBadgeFromScore(posterTrustScore),
    status: JobStatus.OPEN,
    createdAt: new Date(),
    applicants: []
  };

  jobs.push(job);
  return job;
};

export const getJobs = async (filter?: JobFilter): Promise<Job[]> => {
  let filteredJobs = [...jobs];

  if (filter) {
    if (filter.category) {
      filteredJobs = filteredJobs.filter(job => job.category === filter.category);
    }
    if (filter.minBudget !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.budget >= filter.minBudget!);
    }
    if (filter.maxBudget !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.budget <= filter.maxBudget!);
    }
    if (filter.minTrustScore !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.posterTrustScore >= filter.minTrustScore!);
    }
    if (filter.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filter.location!.toLowerCase())
      );
    }
    if (filter.deliveryMethod) {
      filteredJobs = filteredJobs.filter(job => job.deliveryMethod === filter.deliveryMethod);
    }
  }

  return filteredJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getJobById = async (jobId: string): Promise<Job | null> => {
  return jobs.find(job => job.id === jobId) || null;
};

export const applyToJob = async (
  jobId: string,
  applicantAddress: string,
  applicantTrustScore: number,
  message: string
): Promise<JobApplication | null> => {
  const job = await getJobById(jobId);
  if (!job || job.status !== JobStatus.OPEN) {
    return null;
  }

  // Check if applicant meets trust score requirement
  if (applicantTrustScore < job.requiredTrustScore) {
    throw new Error(`Trust score too low. Required: ${job.requiredTrustScore}, yours: ${applicantTrustScore}`);
  }

  // Check if already applied
  const existingApplication = applications.find(
    app => app.jobId === jobId && app.applicantAddress === applicantAddress
  );
  if (existingApplication) {
    throw new Error('You have already applied to this job');
  }

  const application: JobApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobId,
    applicantAddress,
    applicantTrustScore,
    applicantTrustBadge: getTrustBadgeFromScore(applicantTrustScore),
    message,
    appliedAt: new Date(),
    status: ApplicationStatus.PENDING
  };

  applications.push(application);
  
  // Update job with new applicant
  job.applicants.push(application);
  
  return application;
};

export const acceptApplication = async (
  jobId: string,
  applicationId: string,
  posterAddress: string
): Promise<boolean> => {
  const job = await getJobById(jobId);
  if (!job || job.posterAddress !== posterAddress) {
    return false;
  }

  const application = applications.find(app => app.id === applicationId);
  if (!application) {
    return false;
  }

  // Update application status
  application.status = ApplicationStatus.ACCEPTED;
  
  // Reject other applications
  applications
    .filter(app => app.jobId === jobId && app.id !== applicationId)
    .forEach(app => app.status = ApplicationStatus.REJECTED);

  // Update job
  job.status = JobStatus.IN_PROGRESS;
  job.selectedApplicant = application.applicantAddress;
  job.qrCode = generateQRCode(jobId);

  // Initialize escrow
  await initializeEscrow(jobId, job.budget, posterAddress);

  return true;
};

export const generateQRCode = (jobId: string): string => {
  // In production, this would generate a proper QR code
  return `TRUSTNET_JOB_${jobId}_${Date.now()}`;
};

export const verifyJobCompletion = async (
  qrCode: string,
  scannerAddress: string
): Promise<boolean> => {
  const job = jobs.find(j => j.qrCode === qrCode);
  if (!job || job.selectedApplicant !== scannerAddress) {
    return false;
  }

  job.status = JobStatus.DELIVERED;
  return true;
};

export const initializeEscrow = async (
  jobId: string,
  amount: number,
  posterAddress: string
): Promise<EscrowWallet> => {
  const escrowWallet: EscrowWallet = {
    address: `escrow_${jobId}`,
    balance: amount,
    lockedAmount: amount,
    transactions: [{
      id: `tx_${Date.now()}`,
      jobId,
      amount,
      type: 'deposit',
      status: 'completed',
      createdAt: new Date()
    }]
  };

  escrowWallets.set(jobId, escrowWallet);
  return escrowWallet;
};

export const releaseEscrow = async (
  jobId: string,
  recipientAddress: string
): Promise<boolean> => {
  const escrowWallet = escrowWallets.get(jobId);
  if (!escrowWallet || escrowWallet.lockedAmount === 0) {
    return false;
  }

  const job = await getJobById(jobId);
  if (!job || job.status !== JobStatus.DELIVERED) {
    return false;
  }

  // Release payment
  escrowWallet.lockedAmount = 0;
  escrowWallet.transactions.push({
    id: `tx_${Date.now()}`,
    jobId,
    amount: escrowWallet.balance,
    type: 'release',
    status: 'completed',
    createdAt: new Date()
  });

  job.status = JobStatus.COMPLETED;
  job.completedAt = new Date();

  return true;
};

export const rateJobParticipant = async (
  jobId: string,
  raterAddress: string,
  ratedAddress: string,
  stars: number,
  comment: string
): Promise<JobRating> => {
  const rating: JobRating = {
    id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobId,
    raterAddress,
    ratedAddress,
    stars,
    comment,
    createdAt: new Date()
  };

  ratings.push(rating);
  return rating;
};

export const getUserJobHistory = async (userAddress: string): Promise<Job[]> => {
  return jobs.filter(job => 
    job.posterAddress === userAddress || job.selectedApplicant === userAddress
  );
};

export const getUserRatings = async (userAddress: string): Promise<JobRating[]> => {
  return ratings.filter(rating => rating.ratedAddress === userAddress);
};

export const createDispute = async (
  jobId: string,
  raisedBy: string,
  reason: string,
  description: string
): Promise<DisputeCase> => {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  const dispute: DisputeCase = {
    id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobId,
    raisedBy,
    reason,
    description,
    status: 'open',
    createdAt: new Date()
  };

  disputes.push(dispute);
  job.status = JobStatus.DISPUTED;

  return dispute;
};

export const getJobCategories = (): JobCategory[] => {
  return Object.values(JobCategory);
};

export const getJobStatusColor = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.OPEN:
      return 'text-green-600';
    case JobStatus.IN_PROGRESS:
      return 'text-blue-600';
    case JobStatus.DELIVERED:
      return 'text-purple-600';
    case JobStatus.COMPLETED:
      return 'text-gray-600';
    case JobStatus.DISPUTED:
      return 'text-orange-600';
    case JobStatus.CANCELLED:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};