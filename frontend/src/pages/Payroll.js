import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Plus, X, DollarSign } from 'lucide-react';

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('hr_user') || '{}');
  const [formData, setFormData] = useState({
    employee_id: '',
    pay_period: '',
    gross_salary: '',
    deductions: '',
    net_salary: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPayroll();
  }, []);

  useEffect(() => {
    // Auto-calculate net salary
    if (formData.gross_salary && formData.deductions) {
      const net = parseFloat(formData.gross_salary) - parseFloat(formData.deductions);
      setFormData(prev => ({ ...prev, net_salary: net.toFixed(2) }));
    }
  }, [formData.gross_salary, formData.deductions]);

  const loadPayroll = async () => {
    try {
      const response = await axios.get(`${API}/payroll`);
      setPayrollRecords(response.data);
    } catch (error) {
      toast.error('Failed to load payroll records');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        gross_salary: parseFloat(formData.gross_salary),
        deductions: parseFloat(formData.deductions),
        net_salary: parseFloat(formData.net_salary),
        payment_date: new Date(formData.payment_date).toISOString()
      };
      await axios.post(`${API}/payroll`, data);
      toast.success('Payroll record created');
      setShowModal(false);
      loadPayroll();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payroll record');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      pay_period: '',
      gross_salary: '',
      deductions: '',
      net_salary: '',
      payment_date: new Date().toISOString().split('T')[0]
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      processed: 'badge-info',
      paid: 'badge-success'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="payroll" />
      <div className="main-content" data-testid="payroll-page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Payroll Management</h1>
            <p>Track and manage employee compensation</p>
          </div>
          {currentUser.role === 'hr_admin' && (
            <button className="btn btn-primary" data-testid="add-payroll-btn" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Add Payroll Record
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Pay Period</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.map((record) => (
                <tr key={record.id} data-testid={`payroll-row-${record.id}`}>
                  <td>{record.employee_id}</td>
                  <td data-testid={`payroll-period-${record.id}`}>{record.pay_period}</td>
                  <td data-testid={`payroll-gross-${record.id}`}>${record.gross_salary.toLocaleString()}</td>
                  <td>${record.deductions.toLocaleString()}</td>
                  <td data-testid={`payroll-net-${record.id}`} style={{ fontWeight: 600, color: '#10b981' }}>
                    ${record.net_salary.toLocaleString()}
                  </td>
                  <td>{new Date(record.payment_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(record.status)}`} data-testid={`payroll-status-${record.id}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payrollRecords.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              No payroll records found.
            </div>
          )}
        </div>

        {payrollRecords.length > 0 && (
          <div className="grid grid-3" style={{ marginTop: '30px' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <DollarSign size={20} color="#4A90E2" />
                <span style={{ fontSize: '13px', color: '#718096', fontWeight: 500 }}>Total Gross</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a202c' }}>
                ${payrollRecords.reduce((sum, r) => sum + r.gross_salary, 0).toLocaleString()}
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <DollarSign size={20} color="#ef4444" />
                <span style={{ fontSize: '13px', color: '#718096', fontWeight: 500 }}>Total Deductions</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a202c' }}>
                ${payrollRecords.reduce((sum, r) => sum + r.deductions, 0).toLocaleString()}
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <DollarSign size={20} color="#10b981" />
                <span style={{ fontSize: '13px', color: '#718096', fontWeight: 500 }}>Total Net</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                ${payrollRecords.reduce((sum, r) => sum + r.net_salary, 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}
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
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add Payroll Record</h2>
              <button
                onClick={() => setShowModal(false)}
                data-testid="close-payroll-modal-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} data-testid="payroll-form">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-input"
                  data-testid="payroll-employee-id-input"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pay Period</label>
                <input
                  type="text"
                  className="form-input"
                  data-testid="payroll-period-input"
                  placeholder="January 2025"
                  value={formData.pay_period}
                  onChange={(e) => setFormData({ ...formData, pay_period: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gross Salary</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  data-testid="payroll-gross-input"
                  value={formData.gross_salary}
                  onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deductions</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  data-testid="payroll-deductions-input"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Net Salary (Auto-calculated)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  data-testid="payroll-net-input"
                  value={formData.net_salary}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  data-testid="payroll-payment-date-input"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" data-testid="submit-payroll-btn" style={{ flex: 1 }}>
                  Create Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="cancel-payroll-btn"
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