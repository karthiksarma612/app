import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    avgRating: 0,
    monthlyPayroll: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [employees, leaves, reviews, payroll] = await Promise.all([
        axios.get(`${API}/employees`),
        axios.get(`${API}/leave`),
        axios.get(`${API}/performance`),
        axios.get(`${API}/payroll`)
      ]);

      const pendingLeaves = leaves.data.filter(l => l.status === 'pending').length;
      const avgRating = reviews.data.length > 0
        ? reviews.data.reduce((sum, r) => sum + r.rating, 0) / reviews.data.length
        : 0;
      const monthlyPayroll = payroll.data.reduce((sum, p) => sum + p.net_salary, 0);

      setStats({
        totalEmployees: employees.data.length,
        pendingLeaves,
        avgRating: avgRating.toFixed(1),
        monthlyPayroll: monthlyPayroll.toFixed(2)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="dashboard" />
      <div className="main-content" data-testid="dashboard-page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome to your HR Management System</p>
        </div>

        <div className="grid grid-4">
          <div className="stat-card" data-testid="stat-employees">
            <div className="stat-icon" style={{ background: '#e8f4fd' }}>
              <Users size={24} color="#4A90E2" />
            </div>
            <div className="stat-value" data-testid="stat-employees-value">{stats.totalEmployees}</div>
            <div className="stat-label">Total Employees</div>
          </div>

          <div className="stat-card" data-testid="stat-leaves">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Calendar size={24} color="#f59e0b" />
            </div>
            <div className="stat-value" data-testid="stat-leaves-value">{stats.pendingLeaves}</div>
            <div className="stat-label">Pending Leaves</div>
          </div>

          <div className="stat-card" data-testid="stat-performance">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <div className="stat-value" data-testid="stat-performance-value">{stats.avgRating}</div>
            <div className="stat-label">Avg Performance Rating</div>
          </div>

          <div className="stat-card" data-testid="stat-payroll">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <DollarSign size={24} color="#3b82f6" />
            </div>
            <div className="stat-value" data-testid="stat-payroll-value">${stats.monthlyPayroll}</div>
            <div className="stat-label">Monthly Payroll</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" data-testid="add-employee-btn" onClick={() => navigate('/employees')}>Add New Employee</button>
              <button className="btn btn-secondary" data-testid="view-leaves-btn" onClick={() => navigate('/leave')}>View Leave Requests</button>
              <button className="btn btn-secondary" data-testid="view-performance-btn" onClick={() => navigate('/performance')}>Performance Reviews</button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>AI Assistant</h3>
            <p style={{ color: '#718096', marginBottom: '16px', fontSize: '14px' }}>
              Need help with HR queries? Chat with our AI assistant powered by Claude Sonnet 4.
            </p>
            <button className="btn btn-primary" data-testid="open-ai-assistant-btn" onClick={() => navigate('/ai-assistant')}>
              Open AI Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}