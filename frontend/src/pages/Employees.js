import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    employee_number: '',
    department_id: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    benefits: '',
    phone: '',
    address: '',
    emergency_contact: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, usersRes, deptRes] = await Promise.all([
        axios.get(`${API}/employees`),
        axios.get(`${API}/auth/login`).catch(() => ({ data: [] })),
        axios.get(`${API}/departments`)
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        salary: parseFloat(formData.salary),
        hire_date: new Date(formData.hire_date).toISOString(),
        benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()) : []
      };
      await axios.post(`${API}/employees`, data);
      toast.success('Employee added successfully');
      setShowModal(false);
      loadData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add employee');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      employee_number: '',
      department_id: '',
      position: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary: '',
      benefits: '',
      phone: '',
      address: '',
      emergency_contact: ''
    });
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'N/A';
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="employees" />
      <div className="main-content" data-testid="employees-page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Employees</h1>
            <p>Manage your workforce</p>
          </div>
          <button className="btn btn-primary" data-testid="add-employee-modal-btn" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Employee
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee #</th>
                <th>User ID</th>
                <th>Position</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Hire Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} data-testid={`employee-row-${emp.id}`}>
                  <td data-testid={`employee-number-${emp.id}`}>{emp.employee_number}</td>
                  <td>{emp.user_id}</td>
                  <td>{emp.position}</td>
                  <td>{getDepartmentName(emp.department_id)}</td>
                  <td data-testid={`employee-salary-${emp.id}`}>${emp.salary.toLocaleString()}</td>
                  <td>{new Date(emp.hire_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${emp.status === 'active' ? 'success' : 'warning'}`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              No employees found. Add your first employee to get started.
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add New Employee</h2>
              <button
                onClick={() => setShowModal(false)}
                data-testid="close-modal-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} data-testid="employee-form">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">User ID</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="user-id-input"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee Number</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="employee-number-input"
                    value={formData.employee_number}
                    onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="position-input"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    data-testid="department-select"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Salary</label>
                  <input
                    type="number"
                    className="form-input"
                    data-testid="salary-input"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hire Date</label>
                  <input
                    type="date"
                    className="form-input"
                    data-testid="hire-date-input"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    data-testid="phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Benefits (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="benefits-input"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Health, Dental, 401k"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  data-testid="address-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input
                  type="text"
                  className="form-input"
                  data-testid="emergency-contact-input"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" data-testid="submit-employee-btn" style={{ flex: 1 }}>
                  Add Employee
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="cancel-employee-btn"
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