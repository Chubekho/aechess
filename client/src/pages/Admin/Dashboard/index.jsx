// client/src/pages/Admin/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '@/utils/axiosConfig';
import styles from './Dashboard.module.scss';

// A simple, internal StatCard component. Can be moved to a separate file if needed.
// Icons are placeholders. An icon library like react-icons could be added.
const StatCard = ({ title, value, icon, highlight = false }) => {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/admin/stats');
        if (response.success) {
          setStats(response.stats);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        setError(err.response?.message || 'An error occurred while fetching stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.header}>Dashboard</h1>
      <div className={styles.statsGrid}>
        {stats && (
          <>
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon="👥" // Placeholder icon
            />
            <StatCard 
              title="Active Games" 
              value={stats.activeGames} 
              icon="♟️" // Placeholder icon
              highlight={stats.activeGames > 0}
            />
            <StatCard 
              title="Completed Games" 
              value={stats.completedGames} 
              icon="✔️" // Placeholder icon
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;