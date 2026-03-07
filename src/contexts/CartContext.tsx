import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { CartItem, Product, ProductVariant } from '@/types/database';
import { trackAnalyticsEvent } from '@/lib/analytics';

interface CartItemWithProduct extends CartItem {
	product?: Product;
	variant?: ProductVariant;
	variant_stock?: number;
}

interface AddToCartOptions {
	variantId?: string | null;
	selectedColor?: string | null;
	selectedSize?: string | null;
}

interface CartContextType {
	cartItems: CartItemWithProduct[];
	cartCount: number;
	loading: boolean;
	addToCart: (
		productId: string,
		quantity?: number,
		options?: AddToCartOptions
	) => Promise<void>;
	removeFromCart: (cartItemId: string) => Promise<void>;
	updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
	clearCart: () => Promise<void>;
	refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const getErrorMessage = (error: unknown) =>
		error instanceof Error ? error.message : 'An unexpected error occurred';
	const getVariantIdentity = (
		item: Pick<CartItem, 'variant_id' | 'selected_color' | 'selected_size'>
	) =>
		item.variant_id ??
		`${item.selected_color ?? ''}::${item.selected_size ?? ''}`;

	// Load cart items from database or localStorage
	const loadCart = async () => {
		setLoading(true);
		try {
			if (user) {
				// Load from database for logged-in users
				const { data, error } = await supabase
					.from('cart_items')
					.select('*')
					.eq('user_id', user.id)
					.order('created_at', { ascending: false });

				if (error) {
					console.error('Error loading cart:', error);
					setCartItems([]);
					return;
				}

				// Fetch product details for each cart item
				const itemsWithProducts = await Promise.all(
					(data || []).map(async (item) => {
						const { data: product } = await supabase
							.from('products')
							.select('*')
							.eq('id', item.product_id)
							.single();
						const { data: variant } = item.variant_id
							? await supabase
									.from('product_variants')
									.select('*')
									.eq('id', item.variant_id)
									.maybeSingle()
							: { data: null };

						return {
							...item,
							product: product || undefined,
							variant: variant || undefined,
							variant_stock: variant?.stock,
						};
					})
				);

				setCartItems(itemsWithProducts);
			} else {
				// Load from localStorage for guest users
				const savedCart = localStorage.getItem('guest_cart');
				if (savedCart) {
					const parsedCart = JSON.parse(savedCart);
					
					// Fetch product details for each cart item
					const itemsWithProducts = await Promise.all(
						parsedCart.map(
							async (item: {
								product_id: string;
								quantity: number;
								variant_id?: string | null;
								selected_color?: string | null;
								selected_size?: string | null;
							}) => {
							const { data: product } = await supabase
								.from('products')
								.select('*')
								.eq('id', item.product_id)
								.single();
							const { data: variant } = item.variant_id
								? await supabase
										.from('product_variants')
										.select('*')
										.eq('id', item.variant_id)
										.maybeSingle()
								: { data: null };

							return {
								id: `guest_${item.product_id}_${item.variant_id ?? 'base'}_${item.selected_color ?? ''}_${item.selected_size ?? ''}`,
								user_id: '',
								product_id: item.product_id,
								variant_id: item.variant_id ?? null,
								selected_color: item.selected_color ?? null,
								selected_size: item.selected_size ?? null,
								quantity: item.quantity,
								created_at: new Date().toISOString(),
								product: product || undefined,
								variant: variant || undefined,
								variant_stock: variant?.stock,
							};
						})
					);

					setCartItems(itemsWithProducts);
				} else {
					setCartItems([]);
				}
			}
		} catch (error) {
			console.error('Error loading cart:', error);
			setCartItems([]);
		} finally {
			setLoading(false);
		}
	};

	// Sync guest cart to database when user logs in
	const syncGuestCartToDatabase = async () => {
		if (!user) return;

		const savedCart = localStorage.getItem('guest_cart');
		if (!savedCart) return;

		try {
			const parsedCart = JSON.parse(savedCart);
			
			// Add each item to database
			for (const item of parsedCart) {
				const variantId = item.variant_id ?? null;
				const selectedColor = item.selected_color ?? null;
				const selectedSize = item.selected_size ?? null;
				let existingQuery = supabase
					.from('cart_items')
					.select('id, quantity')
					.eq('user_id', user.id)
					.eq('product_id', item.product_id)
					.limit(1);
				existingQuery = variantId
					? existingQuery.eq('variant_id', variantId)
					: existingQuery.is('variant_id', null);
				const { data: existingRows } = await existingQuery;
				const existing = existingRows?.[0];

				const { error } = existing
					? await supabase
							.from('cart_items')
							.update({ quantity: existing.quantity + item.quantity })
							.eq('id', existing.id)
					: await supabase.from('cart_items').insert({
							user_id: user.id,
							product_id: item.product_id,
							variant_id: variantId,
							selected_color: selectedColor,
							selected_size: selectedSize,
							quantity: item.quantity,
					  });

				if (error) {
					console.error('Error syncing cart item:', error);
				}
			}

			// Clear localStorage cart
			localStorage.removeItem('guest_cart');
			
			// Reload cart from database
			await loadCart();
		} catch (error) {
			console.error('Error syncing guest cart:', error);
		}
	};

	// Load cart on mount and when user changes
	useEffect(() => {
		loadCart();
	}, [user]);

	// Sync guest cart when user logs in
	useEffect(() => {
		if (user) {
			syncGuestCartToDatabase();
		}
	}, [user]);

	// Add item to cart
	const addToCart = async (
		productId: string,
		quantity: number = 1,
		options?: AddToCartOptions
	) => {
		try {
			let variantId = options?.variantId ?? null;
			let selectedColor = options?.selectedColor ?? null;
			let selectedSize = options?.selectedSize ?? null;

			if (!variantId) {
				const { data: fallbackVariant } = await supabase
					.from('product_variants')
					.select('*')
					.eq('product_id', productId)
					.gt('stock', 0)
					.order('created_at', { ascending: true })
					.limit(1)
					.maybeSingle();
				if (fallbackVariant) {
					variantId = fallbackVariant.id;
					selectedColor = fallbackVariant.color;
					selectedSize = fallbackVariant.size;
				}
			}

			const { data: variant } = variantId
				? await supabase
						.from('product_variants')
						.select('*')
						.eq('id', variantId)
						.maybeSingle()
				: { data: null };

			if (variant && quantity > variant.stock) {
				toast.error(`Only ${variant.stock} left for this variant`);
				return;
			}

			if (user) {
				// Add to database for logged-in users
				let existingQuery = supabase
					.from('cart_items')
					.select('*')
					.eq('user_id', user.id)
					.eq('product_id', productId)
					.limit(1);
				existingQuery = variantId
					? existingQuery.eq('variant_id', variantId)
					: existingQuery.is('variant_id', null);
				const { data: existingRows } = await existingQuery;
				const existing = existingRows?.[0];
				const nextQuantity = (existing?.quantity ?? 0) + quantity;

				if (variant && nextQuantity > variant.stock) {
					toast.error(`Only ${variant.stock} left for this variant`);
					return;
				}

				const { data, error } = existing
					? await supabase
							.from('cart_items')
							.update({
								quantity: nextQuantity,
								selected_color: selectedColor,
								selected_size: selectedSize,
							})
							.eq('id', existing.id)
							.select()
							.single()
					: await supabase
							.from('cart_items')
							.insert({
								user_id: user.id,
								product_id: productId,
								variant_id: variantId,
								selected_color: selectedColor,
								selected_size: selectedSize,
								quantity,
							})
							.select()
							.single();

				if (error) {
					throw error;
				}

				// Fetch product details
				const { data: product } = await supabase
					.from('products')
					.select('*')
					.eq('id', productId)
					.single();

				// Update local state
				setCartItems((prev) => {
					const existingItem = prev.find(
						(item) =>
							item.product_id === productId &&
							getVariantIdentity(item) ===
								(variantId ?? `${selectedColor ?? ''}::${selectedSize ?? ''}`)
					);
					if (existingItem) {
						return prev.map((item) =>
							item.id === existingItem.id
								? {
										...item,
										quantity: nextQuantity,
										product: product || undefined,
										variant: variant || undefined,
										variant_stock: variant?.stock,
										selected_color: selectedColor,
										selected_size: selectedSize,
								  }
								: item
						);
					}
					return [
						{
							...data,
							product: product || undefined,
							variant: variant || undefined,
							variant_stock: variant?.stock,
						},
						...prev,
					];
				});

				toast.success(product?.name ? `${product.name} added to cart` : 'Added to cart');
				void trackAnalyticsEvent({
					eventName: 'add_to_cart',
					userId: user.id,
					productId,
					metadata: { quantity },
				});
			} else {
				// Add to localStorage for guest users
				const savedCart = localStorage.getItem('guest_cart');
				const cart = savedCart ? JSON.parse(savedCart) : [];
				
				const existingIndex = cart.findIndex(
					(item: {
						product_id: string;
						variant_id?: string | null;
						selected_color?: string | null;
						selected_size?: string | null;
					}) =>
						item.product_id === productId &&
						(item.variant_id ?? null) === variantId &&
						(item.selected_color ?? null) === selectedColor &&
						(item.selected_size ?? null) === selectedSize
				);

				if (existingIndex >= 0) {
					if (variant && cart[existingIndex].quantity + quantity > variant.stock) {
						toast.error(`Only ${variant.stock} left for this variant`);
						return;
					}
					cart[existingIndex].quantity += quantity;
				} else {
					cart.push({
						product_id: productId,
						variant_id: variantId,
						selected_color: selectedColor,
						selected_size: selectedSize,
						quantity,
					});
				}

				localStorage.setItem('guest_cart', JSON.stringify(cart));

				// Fetch product details and update state
				const { data: product } = await supabase
					.from('products')
					.select('*')
					.eq('id', productId)
					.single();

				setCartItems((prev) => {
					const existing = prev.find(
						(item) =>
							item.product_id === productId &&
							getVariantIdentity(item) ===
								(variantId ?? `${selectedColor ?? ''}::${selectedSize ?? ''}`)
					);
					if (existing && existingIndex >= 0) {
						return prev.map((item) =>
							item.id === existing.id
								? {
										...item,
										quantity: cart[existingIndex].quantity,
										product: product || undefined,
										variant: variant || undefined,
										variant_stock: variant?.stock,
										selected_color: selectedColor,
										selected_size: selectedSize,
								  }
								: item
						);
					}
					return [
						{
							id: `guest_${productId}_${variantId ?? 'base'}_${selectedColor ?? ''}_${selectedSize ?? ''}`,
							user_id: '',
							product_id: productId,
							variant_id: variantId,
							selected_color: selectedColor,
							selected_size: selectedSize,
							quantity: existingIndex >= 0 ? cart[existingIndex].quantity : quantity,
							created_at: new Date().toISOString(),
							product: product || undefined,
							variant: variant || undefined,
							variant_stock: variant?.stock,
						},
						...prev,
					];
				});

				toast.success(product?.name ? `${product.name} added to cart` : 'Added to cart');
				void trackAnalyticsEvent({
					eventName: 'add_to_cart',
					productId,
					metadata: { quantity, guest: true },
				});
			}
		} catch (error: unknown) {
			console.error('Error adding to cart:', error);
			toast.error(getErrorMessage(error) || 'Failed to add item to cart');
		}
	};

	// Remove item from cart
	const removeFromCart = async (cartItemId: string) => {
		try {
			if (user) {
				// Remove from database
				const { error } = await supabase
					.from('cart_items')
					.delete()
					.eq('id', cartItemId);

				if (error) {
					throw error;
				}
			} else {
				// Remove from localStorage
				const item = cartItems.find((item) => item.id === cartItemId);
				if (item) {
					const savedCart = localStorage.getItem('guest_cart');
					if (savedCart) {
						const cart = JSON.parse(savedCart);
						const filtered = cart.filter(
							(cartItem: {
								product_id: string;
								variant_id?: string | null;
								selected_color?: string | null;
								selected_size?: string | null;
							}) =>
								!(
									cartItem.product_id === item.product_id &&
									(cartItem.variant_id ?? null) === (item.variant_id ?? null) &&
									(cartItem.selected_color ?? null) === (item.selected_color ?? null) &&
									(cartItem.selected_size ?? null) === (item.selected_size ?? null)
								)
						);
						localStorage.setItem('guest_cart', JSON.stringify(filtered));
					}
				}
			}

			// Update local state
			setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
			toast.success('Removed from cart');
		} catch (error: unknown) {
			console.error('Error removing from cart:', error);
			toast.error(getErrorMessage(error) || 'Failed to remove item from cart');
		}
	};

	// Update quantity
	const updateQuantity = async (cartItemId: string, quantity: number) => {
		if (quantity < 1) {
			removeFromCart(cartItemId);
			return;
		}

		try {
			if (user) {
				// Update in database - only update quantity field to avoid trigger issues
				const { error } = await supabase
					.from('cart_items')
					.update({ quantity })
					.eq('id', cartItemId)
					.select()
					.single();

				if (error) {
					// If the error is about updated_at, try without it (the trigger should handle it)
					if (error.code === '42703' || error.message?.includes('updated_at')) {
						// Retry with explicit updated_at
						const { error: retryError } = await supabase
							.from('cart_items')
							.update({ 
								quantity,
								updated_at: new Date().toISOString()
							})
							.eq('id', cartItemId);

						if (retryError) {
							throw retryError;
						}
					} else {
						throw error;
					}
				}
			} else {
				// Update in localStorage
				const item = cartItems.find((item) => item.id === cartItemId);
				if (item) {
					const savedCart = localStorage.getItem('guest_cart');
					if (savedCart) {
						const cart = JSON.parse(savedCart);
						const index = cart.findIndex(
							(cartItem: {
								product_id: string;
								variant_id?: string | null;
								selected_color?: string | null;
								selected_size?: string | null;
							}) =>
								cartItem.product_id === item.product_id &&
								(cartItem.variant_id ?? null) === (item.variant_id ?? null) &&
								(cartItem.selected_color ?? null) === (item.selected_color ?? null) &&
								(cartItem.selected_size ?? null) === (item.selected_size ?? null)
						);
						if (index >= 0) {
							cart[index].quantity = quantity;
							localStorage.setItem('guest_cart', JSON.stringify(cart));
						}
					}
				}
			}

			// Update local state
			setCartItems((prev) =>
				prev.map((item) =>
					item.id === cartItemId ? { ...item, quantity } : item
				)
			);
		} catch (error: unknown) {
			console.error('Error updating quantity:', error);
			toast.error(getErrorMessage(error) || 'Failed to update quantity');
		}
	};

	// Clear cart
	const clearCart = async () => {
		try {
			if (user) {
				// Clear from database
				const { error } = await supabase
					.from('cart_items')
					.delete()
					.eq('user_id', user.id);

				if (error) {
					throw error;
				}
			} else {
				// Clear from localStorage
				localStorage.removeItem('guest_cart');
			}

			setCartItems([]);
		} catch (error: unknown) {
			console.error('Error clearing cart:', error);
			toast.error(getErrorMessage(error) || 'Failed to clear cart');
		}
	};

	// Refresh cart
	const refreshCart = async () => {
		await loadCart();
	};

	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<CartContext.Provider
			value={{
				cartItems,
				cartCount,
				loading,
				addToCart,
				removeFromCart,
				updateQuantity,
				clearCart,
				refreshCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error('useCart must be used within a CartProvider');
	}
	return context;
}

