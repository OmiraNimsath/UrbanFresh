import { useEffect, useRef, useState } from 'react';
import useNotifications from '../hooks/useNotifications';

/**
 * Presentation Layer – Notification bell for the nav bar.
 * Self-contained: owns its own data via useNotifications.
 * Shows a badge with the unread count and a dropdown list of notifications.
 * CUSTOMER role only — Navbar controls whether this renders.
 */
export default function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close the dropdown when the user clicks outside the bell widget.
  useEffect(() => {
    function onOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative px-3 py-2 text-sm font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <p className="text-center text-xs text-gray-400 py-8">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Single notification row shown inside the dropdown. */
function NotificationItem({ notification, onMarkRead }) {
  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 ${
        notification.read ? 'bg-white' : 'bg-green-50'
      }`}
    >
      <span className="text-base mt-0.5" aria-hidden="true">
        {notification.read ? '📭' : '📬'}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-snug">{notification.message}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="text-[10px] text-green-600 hover:text-green-800 font-medium whitespace-nowrap mt-0.5 transition-colors"
        >
          Mark read
        </button>
      )}
    </div>
  );
}

/** Converts an ISO datetime string to a human-readable relative label. */
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
