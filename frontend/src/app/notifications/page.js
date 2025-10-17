// frontend/src/app/notifications/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [user, router]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    if (type === 'parlay_win') return '🎉';
    if (type === 'parlay_loss') return '📊';
    return '🔔';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-slate-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-slate-400">
              You'll receive notifications when your parlays resolve.
            </p>
            <Link
              href="/parlay-builder"
              className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Create Your First Parlay
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-slate-800 border border-slate-700 rounded-lg p-6 transition-all hover:border-slate-600 ${
                  !notification.is_read ? 'bg-slate-800/80 border-emerald-500/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {notification.title}
                        </h3>
                        <p className="text-slate-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full"></span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4">
                      {notification.parlay_id && (
                        <Link
                          href="/my-parlays"
                          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          View Parlay →
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-slate-400 hover:text-slate-300"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
