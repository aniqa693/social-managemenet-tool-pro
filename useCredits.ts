// hooks/useCredits.ts
import { useState, useEffect, useCallback } from 'react';

interface UseCreditsReturn {
  balance: number;
  loading: boolean;
  error: string | null;
  checkCredits: (toolName: string) => Promise<any>;
  refreshBalance: () => Promise<void>;
  transactionHistory: any[];
  toolCost: number;
  fetchToolCost: (toolName: string) => Promise<number>;
}

export function useCredits(userId?: string): UseCreditsReturn {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [toolCost, setToolCost] = useState<number>(2); // Default

  const refreshBalance = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/credits/balance', {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      
      if (response.ok) {
        setBalance(data.balance);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchToolCost = useCallback(async (toolName: string): Promise<number> => {
    try {
      const response = await fetch(`/api/tool-cost/${toolName}`);
      const data = await response.json();
      
      if (response.ok) {
        setToolCost(data.cost);
        return data.cost;
      }
      return 5; // Default fallback
    } catch (err) {
      console.error('Failed to fetch tool cost:', err);
      return 5; // Default fallback
    }
  }, []);

  const checkCredits = useCallback(async (toolName: string) => {
    if (!userId) return { hasCredits: true, requiredCredits: 0, currentCredits: 0 };
    
    try {
      const response = await fetch(`/api/credits/check?toolName=${toolName}&userId=${userId}`);
      return await response.json();
    } catch (err) {
      console.error('Failed to check credits:', err);
      return { hasCredits: false, error: 'Failed to check credits' };
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshBalance();
      fetchToolCost('caption_generator');
    }
  }, [userId, refreshBalance, fetchToolCost]);

  return {
    balance,
    loading,
    error,
    checkCredits,
    refreshBalance,
    transactionHistory,
    toolCost,
    fetchToolCost
  };
}