import { ethers } from 'ethers';

export interface EscrowTransaction {
  id: string;
  jobId: string;
  amount: number;
  currency: 'ETH' | 'USDC' | 'TEST_TOKEN';
  payer: string;
  payee: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'released' | 'refunded';
  createdAt: number;
  fundedAt?: number;
  completedAt?: number;
  releasedAt?: number;
  disputeReason?: string;
  adminNotes?: string;
}

export interface EscrowBalance {
  available: number;
  locked: number;
  pending: number;
  currency: string;
}

// Mock test token balances for demo purposes
const mockBalances = new Map<string, EscrowBalance>();

// Initialize mock balance for testing
export const initializeMockBalance = (address: string): void => {
  if (!mockBalances.has(address)) {
    mockBalances.set(address, {
      available: 1000, // 1000 TEST_TOKEN
      locked: 0,
      pending: 0,
      currency: 'TEST_TOKEN'
    });
  }
};

// Get user's escrow balance
export const getEscrowBalance = (address: string): EscrowBalance => {
  initializeMockBalance(address);
  return mockBalances.get(address)!;
};

// Create escrow transaction
export const createEscrowTransaction = (
  jobId: string,
  amount: number,
  payer: string,
  payee: string,
  currency: 'ETH' | 'USDC' | 'TEST_TOKEN' = 'TEST_TOKEN'
): EscrowTransaction => {
  const transaction: EscrowTransaction = {
    id: `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    jobId,
    amount,
    currency,
    payer,
    payee,
    status: 'pending',
    createdAt: Date.now()
  };

  // Save to localStorage
  const existingTransactions = getEscrowTransactions();
  existingTransactions.push(transaction);
  localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(existingTransactions));

  return transaction;
};

// Fund escrow transaction
export const fundEscrow = async (transactionId: string, payerAddress: string): Promise<boolean> => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.payer !== payerAddress) {
      throw new Error('Unauthorized payer');
    }
    
    if (transaction.status !== 'pending') {
      throw new Error('Transaction already processed');
    }

    // Check balance
    const balance = getEscrowBalance(payerAddress);
    if (balance.available < transaction.amount) {
      throw new Error('Insufficient balance');
    }

    // Lock funds
    balance.available -= transaction.amount;
    balance.locked += transaction.amount;
    mockBalances.set(payerAddress, balance);

    // Update transaction
    transaction.status = 'funded';
    transaction.fundedAt = Date.now();

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to fund escrow:', error);
    return false;
  }
};

// Complete job and mark for release
export const markJobCompleted = (transactionId: string): boolean => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status !== 'funded') {
      throw new Error('Transaction not funded');
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.completedAt = Date.now();

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to mark job completed:', error);
    return false;
  }
};

// Release escrow funds to payee
export const releaseEscrow = async (transactionId: string): Promise<boolean> => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status !== 'completed') {
      throw new Error('Job not completed');
    }

    // Release funds from payer's locked balance
    const payerBalance = getEscrowBalance(transaction.payer);
    payerBalance.locked -= transaction.amount;
    mockBalances.set(transaction.payer, payerBalance);

    // Add funds to payee's available balance
    const payeeBalance = getEscrowBalance(transaction.payee);
    payeeBalance.available += transaction.amount;
    mockBalances.set(transaction.payee, payeeBalance);

    // Update transaction
    transaction.status = 'released';
    transaction.releasedAt = Date.now();

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to release escrow:', error);
    return false;
  }
};

// Dispute escrow transaction
export const disputeEscrow = (transactionId: string, reason: string): boolean => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status === 'released' || transaction.status === 'refunded') {
      throw new Error('Transaction already finalized');
    }

    // Update transaction
    transaction.status = 'disputed';
    transaction.disputeReason = reason;

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to dispute escrow:', error);
    return false;
  }
};

// Admin: Force release escrow
export const adminReleaseEscrow = async (transactionId: string, adminNotes?: string): Promise<boolean> => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'released' || transaction.status === 'refunded') {
      throw new Error('Transaction already finalized');
    }

    // Release funds from payer's locked balance
    const payerBalance = getEscrowBalance(transaction.payer);
    payerBalance.locked -= transaction.amount;
    mockBalances.set(transaction.payer, payerBalance);

    // Add funds to payee's available balance
    const payeeBalance = getEscrowBalance(transaction.payee);
    payeeBalance.available += transaction.amount;
    mockBalances.set(transaction.payee, payeeBalance);

    // Update transaction
    transaction.status = 'released';
    transaction.releasedAt = Date.now();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to admin release escrow:', error);
    return false;
  }
};

// Admin: Refund escrow to payer
export const adminRefundEscrow = async (transactionId: string, adminNotes?: string): Promise<boolean> => {
  try {
    const transactions = getEscrowTransactions();
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'released' || transaction.status === 'refunded') {
      throw new Error('Transaction already finalized');
    }

    // Return funds to payer's available balance
    const payerBalance = getEscrowBalance(transaction.payer);
    payerBalance.locked -= transaction.amount;
    payerBalance.available += transaction.amount;
    mockBalances.set(transaction.payer, payerBalance);

    // Update transaction
    transaction.status = 'refunded';
    transaction.releasedAt = Date.now();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }

    // Save updated transactions
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId ? transaction : t
    );
    localStorage.setItem('trustnet-escrow-transactions', JSON.stringify(updatedTransactions));

    return true;
  } catch (error) {
    console.error('Failed to admin refund escrow:', error);
    return false;
  }
};

// Get all escrow transactions
export const getEscrowTransactions = (): EscrowTransaction[] => {
  const data = localStorage.getItem('trustnet-escrow-transactions');
  return data ? JSON.parse(data) : [];
};

// Get escrow transactions for a specific job
export const getJobEscrow = (jobId: string): EscrowTransaction | null => {
  const transactions = getEscrowTransactions();
  return transactions.find(t => t.jobId === jobId) || null;
};

// Get user's escrow transactions (as payer or payee)
export const getUserEscrowTransactions = (userAddress: string): EscrowTransaction[] => {
  const transactions = getEscrowTransactions();
  return transactions.filter(t => t.payer === userAddress || t.payee === userAddress);
};

// Get disputed transactions for admin
export const getDisputedTransactions = (): EscrowTransaction[] => {
  const transactions = getEscrowTransactions();
  return transactions.filter(t => t.status === 'disputed');
};

// Format currency amount for display
export const formatCurrency = (amount: number, currency: string): string => {
  switch (currency) {
    case 'ETH':
      return `${amount.toFixed(4)} ETH`;
    case 'USDC':
      return `$${amount.toFixed(2)} USDC`;
    case 'TEST_TOKEN':
      return `${amount.toFixed(2)} TEST`;
    default:
      return `${amount} ${currency}`;
  }
};

// Get escrow status color for UI
export const getEscrowStatusColor = (status: EscrowTransaction['status']): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'funded':
      return 'text-blue-600 bg-blue-50';
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'disputed':
      return 'text-red-600 bg-red-50';
    case 'released':
      return 'text-green-700 bg-green-100';
    case 'refunded':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};