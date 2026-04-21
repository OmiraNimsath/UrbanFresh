import api from './api';

const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'Your order #1002 has been shipped!', read: false, createdAt: '2026-04-19T15:00:00' },
  { id: 2, message: 'Order #1001 delivered successfully. Enjoy your groceries!', read: true, createdAt: '2026-04-18T18:30:00' },
  { id: 3, message: 'Loyalty reward: You earned 50 points on your last order.', read: false, createdAt: '2026-04-18T10:35:00' },
];

export const getMyNotifications = () => Promise.resolve(MOCK_NOTIFICATIONS);
export const getUnreadCount = () => Promise.resolve(2);
export const markNotificationRead = (notificationId) => Promise.resolve(MOCK_NOTIFICATIONS.find((n) => n.id === notificationId) ?? MOCK_NOTIFICATIONS[0]);
export const markAllNotificationsRead = () => Promise.resolve();
