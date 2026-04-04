import { supabase } from '@/lib/supabase';

/** Shape used by checkout (order summary + Paystack). */
export interface DeliveryMethodCheckout {
	id: string;
	name: string;
	company: string;
	price: number;
	estimatedDays: string;
}

function rowToCheckout(row: {
	id: string;
	name: string;
	company: string;
	price: number | string;
	estimated_days: string;
}): DeliveryMethodCheckout {
	return {
		id: row.id,
		name: row.name,
		company: row.company,
		price: typeof row.price === 'string' ? Number(row.price) : row.price,
		estimatedDays: row.estimated_days,
	};
}

/** Used when the table is missing or the request fails (offline / migration not applied). */
export const FALLBACK_DELIVERY_METHODS: DeliveryMethodCheckout[] = [
	{
		id: 'gig',
		name: 'GIG Logistics',
		company: 'GIG Logistics',
		price: 8000,
		estimatedDays: 'Standard delivery',
	},
	{
		id: 'guo',
		name: 'GUO Logistics',
		company: 'GUO Logistics',
		price: 4000,
		estimatedDays: 'Standard delivery',
	},
	{
		id: 'abuja',
		name: 'Locations within Abuja',
		company: 'Local Delivery',
		price: 3000,
		estimatedDays: 'Within Abuja',
	},
	{
		id: 'pickup',
		name: 'Pick-Up (Free)',
		company: 'Store Pickup',
		price: 0,
		estimatedDays: 'available within Abuja',
	},
];

/**
 * Load active delivery options for checkout (RLS allows public read of active rows).
 */
export async function fetchDeliveryOptionsForCheckout(): Promise<DeliveryMethodCheckout[]> {
	try {
		const { data, error } = await supabase
			.from('delivery_options')
			.select('id, name, company, price, estimated_days')
			.order('sort_order', { ascending: true });

		if (error) throw error;
		if (!data?.length) return FALLBACK_DELIVERY_METHODS;

		return data.map((row) => rowToCheckout(row));
	} catch (e) {
		console.error('fetchDeliveryOptionsForCheckout:', e);
		return FALLBACK_DELIVERY_METHODS;
	}
}
