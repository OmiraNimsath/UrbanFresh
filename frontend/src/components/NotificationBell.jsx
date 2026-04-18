import { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
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
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e4ebe8] bg-white text-[#0d4a38] shadow-sm transition-colors hover:bg-[#f8fbf9]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FiBell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#e4ebe8] bg-[#f8fbf9] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#163a2f]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-[#0d4a38] transition-colors hover:text-[#083a2c]"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#eef3f0]">
            {loading ? (
              <p className="py-8 text-center text-xs text-[#6f817b]">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#6f817b]">No notifications yet</p>
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
      className={`flex items-start gap-3 px-4 py-3 ${
        notification.read ? 'bg-white' : 'bg-[#eaf5ef]'
      }`}
    >
      <span className="text-base mt-0.5" aria-hidden="true">
        {notification.read ? '📭' : '📬'}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug text-[#163a2f]">{notification.message}</p>
        <p className="mt-1 text-[10px] text-[#6f817b]">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="mt-0.5 whitespace-nowrap text-[10px] font-semibold text-[#0d4a38] transition-colors hover:text-[#083a2c]"
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
