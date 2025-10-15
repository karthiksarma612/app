import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Plus, X, Check, XCircle } from 'lucide-react';

export default function Leave() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('hr_user') || '{}');
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'vacation',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      const response = await axios.get(`${API}/leave`);
      setLeaveRequests(response.data);
    } catch (error) {
      toast.error('Failed to load leave requests');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      await axios.post(`${API}/leave`, data);
      toast.success('Leave request submitted');
      setShowModal(false);
      loadLeaveRequests();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    }
  };

  const handleApprove = async (leaveId, status) => {
    try {
      await axios.put(`${API}/leave/${leaveId}/approve`, {
        status,
        approved_by: currentUser.id
      });
      toast.success(`Leave request ${status}`);
      loadLeaveRequests();
    } catch (error) {
      toast.error('Failed to update leave request');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type: 'vacation',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="leave" />
      <div className="main-content" data-testid="leave-page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Leave Management</h1>
            <p>Track and manage employee leave requests</p>
          </div>
          <button className="btn btn-primary" data-testid="add-leave-request-btn" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Request Leave
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((leave) => (
                <tr key={leave.id} data-testid={`leave-row-${leave.id}`}>
                  <td>{leave.employee_id}</td>
                  <td data-testid={`leave-type-${leave.id}`}>
                    <span style={{ textTransform: 'capitalize' }}>{leave.leave_type}</span>
                  </td>
                  <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td>{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(leave.status)}`} data-testid={`leave-status-${leave.id}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>
                    {leave.status === 'pending' && (currentUser.role === 'hr_admin' || currentUser.role === 'manager') && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          data-testid={`approve-leave-${leave.id}`}
                          onClick={() => handleApprove(leave.id, 'approved')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          data-testid={`reject-leave-${leave.id}`}
                          onClick={() => handleApprove(leave.id, 'rejected')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaveRequests.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              No leave requests found.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Request Leave</h2>
              <button
                onClick={() => setShowModal(false)}
                data-testid="close-leave-modal-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} data-testid="leave-form">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  data-testid="leave-employee-id-input"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  className="form-select"
                  data-testid="leave-type-select"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    data-testid="leave-start-date-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    data-testid="leave-end-date-input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-textarea"
                  data-testid="leave-reason-textarea"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" data-testid="submit-leave-btn" style={{ flex: 1 }}>
                  Submit Request
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="cancel-leave-btn"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}