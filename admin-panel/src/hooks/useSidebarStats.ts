import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/adminApi';

interface SidebarStats {
  users: number;
  withdrawals: number;
  tickets: number;
}

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats>({
    users: 0,
    withdrawals: 0,
    tickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        
        if (data && data.data) {
          const statsData = data.data;
          setStats({
            users: statsData.users?.total || 0,
            withdrawals: statsData.withdrawals?.pending || 0,
            tickets: statsData.tickets?.open || 0,
          });
        }
      } catch (error) {
        console.error('Error loading sidebar stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    // Refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}

