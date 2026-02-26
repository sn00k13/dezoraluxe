import { supabase } from '@/lib/supabase';
import type { AnalyticsEventName } from '@/types/database';

const ANALYTICS_SESSION_KEY = 'analytics_session_id';

const getSessionId = () => {
	if (typeof window === 'undefined') {
		return `server-${Date.now()}`;
	}

	const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
	if (existing) return existing;

	const generated =
		(crypto?.randomUUID?.() ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	localStorage.setItem(ANALYTICS_SESSION_KEY, generated);
	return generated;
};

export const trackAnalyticsEvent = async (params: {
	eventName: AnalyticsEventName;
	userId?: string | null;
	productId?: string | null;
	orderId?: string | null;
	path?: string;
	metadata?: Record<string, unknown>;
}) => {
	try {
		const sessionId = getSessionId();
		const payload = {
			event_name: params.eventName,
			session_id: sessionId,
			user_id: params.userId ?? null,
			product_id: params.productId ?? null,
			order_id: params.orderId ?? null,
			path:
				params.path ??
				(typeof window !== 'undefined' ? window.location.pathname : null),
			metadata: params.metadata ?? {},
		};

		const { error } = await supabase.from('analytics_events').insert(payload);
		if (error) {
			// Keep analytics fire-and-forget so user flows never fail.
			console.warn('Analytics event skipped:', error.message);
		}
	} catch (error) {
		console.warn('Analytics event failed:', error);
	}
};

