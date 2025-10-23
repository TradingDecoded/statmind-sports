'use client';
import { useState, useEffect } from 'react';

export default function FeedbackModal({ isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Show modal after 3 minutes (180000 milliseconds) - automatic popup
  // Change this number to adjust timing: 60000 = 1 minute, 300000 = 5 minutes
  useEffect(() => {
    // Check if user has already dismissed or submitted feedback this session
    const hasDismissed = sessionStorage.getItem('feedbackDismissed');
    const hasSubmittedBefore = sessionStorage.getItem('feedbackSubmitted');
    
    if (hasDismissed || hasSubmittedBefore) {
      return; // Don't show popup if they already dismissed or submitted
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 180000); // 3 minutes - ADJUST THIS NUMBER TO CHANGE TIMING

    return () => clearTimeout(timer);
  }, []);

  // Handle manual open from navigation button
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setHasSubmitted(false); // Reset submission state when manually opened
      setFormData({ name: '', email: '', message: '' }); // Clear form
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setHasSubmitted(true);
        sessionStorage.setItem('feedbackSubmitted', 'true');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose(); // Notify parent that modal is closed
        }, 2000);
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('feedbackDismissed', 'true');
    if (onClose) onClose(); // Notify parent that modal is closed
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-700">
        {!hasSubmitted ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  💬 We'd Love Your Feedback!
                </h2>
                <p className="text-slate-400 text-sm">
                  Help us improve StatMind Sports
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Your Feedback *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Tell us what you think..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Not Now
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Thank You!
            </h3>
            <p className="text-slate-400">
              Your feedback helps us improve
            </p>
          </div>
        )}
      </div>
    </div>
  );
}