import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Plus, X, Star } from 'lucide-react';

export default function Performance() {
  const [reviews, setReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('hr_user') || '{}');
  const [formData, setFormData] = useState({
    employee_id: '',
    reviewer_id: currentUser.id || '',
    review_period: '',
    rating: 3,
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    comments: ''
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${API}/performance`);
      setReviews(response.data);
    } catch (error) {
      toast.error('Failed to load performance reviews');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        rating: parseFloat(formData.rating)
      };
      await axios.post(`${API}/performance`, data);
      toast.success('Performance review created');
      setShowModal(false);
      loadReviews();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create review');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      reviewer_id: currentUser.id || '',
      review_period: '',
      rating: 3,
      strengths: '',
      areas_for_improvement: '',
      goals: '',
      comments: ''
    });
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#f59e0b' : 'none'}
            color={star <= rating ? '#f59e0b' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="performance" />
      <div className="main-content" data-testid="performance-page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Performance Reviews</h1>
            <p>Evaluate and track employee performance</p>
          </div>
          {(currentUser.role === 'hr_admin' || currentUser.role === 'manager') && (
            <button className="btn btn-primary" data-testid="add-review-btn" onClick={() => setShowModal(true)}>
              <Plus size={20} />
              Add Review
            </button>
          )}
        </div>

        <div className="grid">
          {reviews.map((review) => (
            <div key={review.id} className="card" data-testid={`review-card-${review.id}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Employee: {review.employee_id}</h3>
                  <p style={{ color: '#718096', fontSize: '13px' }}>{review.review_period}</p>
                </div>
                <div data-testid={`review-rating-${review.id}`}>{renderStars(review.rating)}</div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Strengths:</div>
                <p style={{ fontSize: '14px', color: '#475569' }}>{review.strengths}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Areas for Improvement:</div>
                <p style={{ fontSize: '14px', color: '#475569' }}>{review.areas_for_improvement}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Goals:</div>
                <p style={{ fontSize: '14px', color: '#475569' }}>{review.goals}</p>
              </div>

              {review.comments && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Comments:</div>
                  <p style={{ fontSize: '14px', color: '#475569' }}>{review.comments}</p>
                </div>
              )}

              <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
                Reviewed by: {review.reviewer_id}
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No performance reviews found.
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add Performance Review</h2>
              <button
                onClick={() => setShowModal(false)}
                data-testid="close-review-modal-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} data-testid="review-form">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="review-employee-id-input"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Review Period</label>
                  <input
                    type="text"
                    className="form-input"
                    data-testid="review-period-input"
                    placeholder="Q1 2025"
                    value={formData.review_period}
                    onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rating (1-5)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    data-testid="review-rating-input"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '18px', color: '#4A90E2', minWidth: '40px' }}>
                    {formData.rating}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Strengths</label>
                <textarea
                  className="form-textarea"
                  data-testid="review-strengths-textarea"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Areas for Improvement</label>
                <textarea
                  className="form-textarea"
                  data-testid="review-improvement-textarea"
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Goals</label>
                <textarea
                  className="form-textarea"
                  data-testid="review-goals-textarea"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Comments (optional)</label>
                <textarea
                  className="form-textarea"
                  data-testid="review-comments-textarea"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" data-testid="submit-review-btn" style={{ flex: 1 }}>
                  Submit Review
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-testid="cancel-review-btn"
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