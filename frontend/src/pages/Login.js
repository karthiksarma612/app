import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { User, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      localStorage.setItem('hr_token', response.data.access_token);
      localStorage.setItem('hr_user', JSON.stringify(response.data.user));
      
      toast.success(isLogin ? 'Login successful!' : 'Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 data-testid="login-title">HR Management System</h1>
          <p>Enterprise Human Resources Platform</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                data-testid="full-name-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Email
            </label>
            <input
              type="email"
              className="form-input"
              data-testid="email-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
              data-testid="password-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                data-testid="role-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr_admin">HR Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            data-testid="auth-submit-btn"
            style={{ width: '100%', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            data-testid="toggle-auth-mode-btn"
            style={{ background: 'none', border: 'none', color: '#4A90E2', cursor: 'pointer', fontSize: '14px' }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}