import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I\'m your AI HR Assistant powered by Claude Sonnet 4. I can help you with HR policies, leave balances, performance reviews, and general HR queries. How can I assist you today?'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('hr_user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai-chat`, {
        message: input,
        user_id: currentUser.id
      });

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get response');
      const errorMessage = { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="ai-assistant" />
      <div className="main-content" data-testid="ai-assistant-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
        <div style={{ padding: '30px 40px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>AI HR Assistant</h1>
            <p>Powered by Claude Sonnet 4 - Ask me anything about HR</p>
          </div>
        </div>

        <div className="chat-container" style={{ flex: 1, margin: '20px 40px 20px 40px' }}>
          <div className="chat-messages" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`} data-testid={`chat-message-${idx}`}>
                <div className="chat-message-avatar">
                  {msg.role === 'user' ? currentUser.full_name?.[0]?.toUpperCase() : 'AI'}
                </div>
                <div className="chat-message-content" data-testid={`chat-message-content-${idx}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant" data-testid="chat-loading">
                <div className="chat-message-avatar">AI</div>
                <div className="chat-message-content">
                  <div className="spinner" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              data-testid="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              data-testid="chat-send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}