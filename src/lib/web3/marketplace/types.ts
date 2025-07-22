export interface Job {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  budget: number;
  currency: string;
  requiredTrustScore: number;
  completionTime: string;
  deliveryMethod: 'in-person' | 'remote';
  posterAddress: string;
  posterTrustScore: number;
  posterTrustBadge: string;
  status: JobStatus;
  createdAt: Date;
  applicants: JobApplication[];
  selectedApplicant?: string;
  escrowAddress?: string;
  qrCode?: string;
  completedAt?: Date;
  rating?: JobRating;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantAddress: string;
  applicantTrustScore: number;
  applicantTrustBadge: string;
  message: string;
  appliedAt: Date;
  status: ApplicationStatus;
}

export interface JobRating {
  id: string;
  jobId: string;
  raterAddress: string;
  ratedAddress: string;
  stars: number;
  comment: string;
  createdAt: Date;
}

export enum JobCategory {
  DELIVERY = 'delivery',
  TUTORING = 'tutoring',
  REPAIR = 'repair',
  CLEANING = 'cleaning',
  DESIGN = 'design',
  WRITING = 'writing',
  PROGRAMMING = 'programming',
  OTHER = 'other'
}

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface JobFilter {
  category?: JobCategory;
  minBudget?: number;
  maxBudget?: number;
  minTrustScore?: number;
  maxTrustScore?: number;
  location?: string;
  deliveryMethod?: 'in-person' | 'remote';
}

export interface EscrowWallet {
  address: string;
  balance: number;
  lockedAmount: number;
  transactions: EscrowTransaction[];
}

export interface EscrowTransaction {
  id: string;
  jobId: string;
  amount: number;
  type: 'deposit' | 'release' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface DisputeCase {
  id: string;
  jobId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'open' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}