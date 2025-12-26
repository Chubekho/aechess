// client/src/pages/Admin/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '@/utils/axiosConfig';
import styles from './Dashboard.module.scss';
import { FaUsers, FaChessBoard, FaTrophy } from 'react-icons/fa';

const StatCard = ({ title, value, icon, variant }) => {
  return (
    <div className={styles.statCard} data-variant={variant}>
      <div className={styles.iconWrapper}>{icon}</div>
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
              icon={<FaUsers />}
              variant="blue"
            />
            <StatCard 
              title="Active Games" 
              value={stats.activeGames} 
              icon={<FaChessBoard />}
              variant="green"
            />
            <StatCard 
              title="Completed Games" 
              value={stats.completedGames} 
              icon={<FaTrophy />}
              variant="purple"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;