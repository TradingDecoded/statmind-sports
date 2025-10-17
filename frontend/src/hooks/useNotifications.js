// frontend/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Add this line

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    console.log('🔔 Fetching notifications...');
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token from localStorage:', !!token);
      console.log('User from context:', !!user);
      
      if (!token || !user) {
        console.log('No token or user, skipping fetch');
        setLoading(false);
        return;
      }

      console.log('Making API call to /api/notifications');
      const response = await fetch('/api/notifications?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    console.log('🔢 Fetching unread count...');
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !user) return;

      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Unread count:', data);
      
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Fetch on mount and set up polling
  useEffect(() => {
    if (user) {
      console.log('User detected, fetching notifications');
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      console.log('No user, setting loading to false');
      setLoading(false);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}
