import type { AdminSettings, NotificationSettings } from './settings';

interface ToastLike {
	info: (message: string, options?: { title?: string }) => void;
}

/**
 * Browser Notification Service
 * 
 * This handles browser push notifications that appear even when the tab is closed.
 * Requires user permission to show notifications.
 */

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
	if (!('Notification' in window)) {
		console.warn('This browser does not support notifications');
		return 'denied';
	}

	if (Notification.permission === 'granted') {
		return 'granted';
	}

	if (Notification.permission !== 'denied') {
		const permission = await Notification.requestPermission();
		return permission;
	}

	return Notification.permission;
};

/**
 * Check if notifications are allowed
 */
export const canShowNotifications = (): boolean => {
	if (!('Notification' in window)) {
		return false;
	}
	return Notification.permission === 'granted';
};

/**
 * Show a browser notification
 */
export const showBrowserNotification = (
	title: string,
	options?: NotificationOptions
): Notification | null => {
	if (!canShowNotifications()) {
		return null;
	}

	try {
		const notification = new Notification(title, {
			icon: '/images/DLX.png',
			badge: '/images/DLX.png',
			...options,
		});

		// Auto-close after 5 seconds
		setTimeout(() => {
			notification.close();
		}, 5000);

		return notification;
	} catch (error) {
		console.error('Error showing notification:', error);
		return null;
	}
};

/**
 * Show notification based on settings
 */
export const showNotificationIfEnabled = async (
	type: keyof NotificationSettings,
	title: string,
	message: string,
	settings: AdminSettings,
	toast: ToastLike
): Promise<void> => {
	// Check if notification is enabled in settings
	if (!settings.notifications[type]) {
		return;
	}

	// Show in-app toast notification (always works)
	toast.info(message, {
		title: title,
	});

	// Show browser notification if permission granted
	if (canShowNotifications()) {
		showBrowserNotification(title, {
			body: message,
			tag: type, // Prevents duplicate notifications
		});
	}
};

