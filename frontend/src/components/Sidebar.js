import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, TrendingUp, DollarSign, Bot, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Sidebar({ active }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('hr_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const NavItem = ({ icon: Icon, label, path, name }) => (
    <div
      className={`nav-item ${active === name ? 'active' : ''}`}
      onClick={() => navigate(path)}
      data-testid={`nav-${name}`}
    >
      <Icon size={20} />
      {label}
    </div>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>HR Suite</h1>
      </div>

      <div className="sidebar-nav">
        <NavItem icon={LayoutDashboard} label="Dashboard" path="/" name="dashboard" />
        <NavItem icon={Users} label="Employees" path="/employees" name="employees" />
        <NavItem icon={Calendar} label="Leave Management" path="/leave" name="leave" />
        <NavItem icon={TrendingUp} label="Performance" path="/performance" name="performance" />
        <NavItem icon={DollarSign} label="Payroll" path="/payroll" name="payroll" />
        <NavItem icon={Bot} label="AI Assistant" path="/ai-assistant" name="ai-assistant" />
      </div>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a202c' }}>{user.full_name}</div>
          <div style={{ fontSize: '12px', color: '#718096' }}>{user.email}</div>
          <div style={{ fontSize: '12px', color: '#4A90E2', marginTop: '4px', textTransform: 'capitalize' }}>{user.role}</div>
        </div>
        <button
          className="btn btn-danger"
          data-testid="logout-btn"
          onClick={handleLogout}
          style={{ width: '100%', fontSize: '13px', padding: '8px' }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}