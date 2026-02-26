import { supabase } from './supabase';

export interface NotificationSettings {
	newOrders: boolean;
	lowStock: boolean;
	newUsers: boolean;
	orderUpdates: boolean;
	weeklyReport: boolean;
}

export interface StoreSettings {
	storeName: string;
	storeEmail: string;
	storePhone: string;
	currency: string;
	timezone: string;
}

export interface DisplaySettings {
	itemsPerPage: number;
	dateFormat: string;
	theme: string;
}

export interface SecuritySettings {
	twoFactorAuth: boolean;
	sessionTimeout: number;
}

export interface AdminSettings {
	notifications: NotificationSettings;
	store: StoreSettings;
	display: DisplaySettings;
	security: SecuritySettings;
}

interface ToastLike {
	info: (message: string, options?: { title?: string }) => void;
}

const DEFAULT_SETTINGS: AdminSettings = {
	notifications: {
		newOrders: true,
		lowStock: true,
		newUsers: false,
		orderUpdates: true,
		weeklyReport: true,
	},
	store: {
		storeName: 'Dezora Luxe',
		storeEmail: 'bibianaezeonu25@gmail.com',
		storePhone: '08107124371',
		currency: 'NGN',
		timezone: 'America/New_York',
	},
	display: {
		itemsPerPage: 20,
		dateFormat: 'MM/DD/YYYY',
		theme: 'dark',
	},
	security: {
		twoFactorAuth: false,
		sessionTimeout: 30,
	},
};

/**
 * Load settings from localStorage or return defaults
 */
export const loadSettings = (): AdminSettings => {
	try {
		const saved = localStorage.getItem('adminSettings');
		if (saved) {
			const parsed = JSON.parse(saved);
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (error) {
		console.error('Error loading settings:', error);
	}
	return DEFAULT_SETTINGS;
};

/**
 * Save settings to localStorage
 */
export const saveSettings = async (settings: AdminSettings): Promise<boolean> => {
	try {
		localStorage.setItem('adminSettings', JSON.stringify(settings));
		
		// Also try to save to Supabase if user is authenticated
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			// Save to user_profiles or a settings table
			const { error } = await supabase
				.from('user_profiles')
				.update({
					updated_at: new Date().toISOString(),
				})
				.eq('id', user.id);
			
			if (error) {
				console.error('Error saving settings to database:', error);
			}
		}
		
		return true;
	} catch (error) {
		console.error('Error saving settings:', error);
		return false;
	}
};

/**
 * Format date according to settings
 */
export const formatDate = (date: string | Date, format: string = 'MM/DD/YYYY'): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	
	switch (format) {
		case 'DD/MM/YYYY':
			return d.toLocaleDateString('en-GB');
		case 'YYYY-MM-DD':
			return d.toISOString().split('T')[0];
		case 'MM/DD/YYYY':
		default:
			return d.toLocaleDateString('en-US');
	}
};

/**
 * Format currency according to settings
 */
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
	}).format(amount);
};

/**
 * Get items per page from settings
 */
export const getItemsPerPage = (): number => {
	const settings = loadSettings();
	return settings.display.itemsPerPage;
};

/**
 * Check if notification is enabled
 */
export const isNotificationEnabled = (type: keyof NotificationSettings): boolean => {
	const settings = loadSettings();
	return settings.notifications[type];
};

/**
 * Show notification if enabled
 * This shows in-app toast notifications (no browser permission needed)
 */
export const showNotification = (
	type: keyof NotificationSettings,
	message: string,
	toast: ToastLike
) => {
	if (isNotificationEnabled(type)) {
		toast.info(message);
	}
};

/**
 * Show browser notification if enabled and permission granted
 * This shows system notifications that work even when tab is closed
 */
export const showBrowserNotificationIfEnabled = async (
	type: keyof NotificationSettings,
	title: string,
	message: string,
	settings: AdminSettings,
	toast: ToastLike
) => {
	if (!isNotificationEnabled(type)) {
		return;
	}

	// Always show in-app toast
	toast.info(message, { title });

	// Show browser notification if permission granted
	if ('Notification' in window && Notification.permission === 'granted') {
		try {
			const notification = new Notification(title, {
				body: message,
				icon: '/images/DLX.png',
				badge: '/images/DLX.png',
				tag: type, // Prevents duplicate notifications
			});

			// Auto-close after 5 seconds
			setTimeout(() => {
				notification.close();
			}, 5000);
		} catch (error) {
			console.error('Error showing browser notification:', error);
		}
	}
};

