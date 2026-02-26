import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { CartItem, Product } from '@/types/database';
import { trackAnalyticsEvent } from '@/lib/analytics';

interface CartItemWithProduct extends CartItem {
	product?: Product;
}

interface CartContextType {
	cartItems: CartItemWithProduct[];
	cartCount: number;
	loading: boolean;
	addToCart: (productId: string, quantity?: number) => Promise<void>;
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

						return {
							...item,
							product: product || undefined,
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
						parsedCart.map(async (item: { product_id: string; quantity: number }) => {
							const { data: product } = await supabase
								.from('products')
								.select('*')
								.eq('id', item.product_id)
								.single();

							return {
								id: `guest_${item.product_id}`,
								user_id: '',
								product_id: item.product_id,
								quantity: item.quantity,
								created_at: new Date().toISOString(),
								product: product || undefined,
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
				const { error } = await supabase
					.from('cart_items')
					.upsert({
						user_id: user.id,
						product_id: item.product_id,
						quantity: item.quantity,
					}, {
						onConflict: 'user_id,product_id',
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
	const addToCart = async (productId: string, quantity: number = 1) => {
		try {
			if (user) {
				// Add to database for logged-in users
				const { data, error } = await supabase
					.from('cart_items')
					.upsert({
						user_id: user.id,
						product_id: productId,
						quantity: quantity,
					}, {
						onConflict: 'user_id,product_id',
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
					const existing = prev.find((item) => item.product_id === productId);
					if (existing) {
						return prev.map((item) =>
							item.product_id === productId
								? { ...item, quantity: quantity, product: product || undefined }
								: item
						);
					}
					return [
						{
							...data,
							product: product || undefined,
						},
						...prev,
					];
				});

				toast.success('Added to cart');
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
					(item: { product_id: string }) => item.product_id === productId
				);

				if (existingIndex >= 0) {
					cart[existingIndex].quantity += quantity;
				} else {
					cart.push({ product_id: productId, quantity: quantity });
				}

				localStorage.setItem('guest_cart', JSON.stringify(cart));

				// Fetch product details and update state
				const { data: product } = await supabase
					.from('products')
					.select('*')
					.eq('id', productId)
					.single();

				setCartItems((prev) => {
					const existing = prev.find((item) => item.product_id === productId);
					if (existing && existingIndex >= 0) {
						return prev.map((item) =>
							item.product_id === productId
								? { ...item, quantity: cart[existingIndex].quantity, product: product || undefined }
								: item
						);
					}
					return [
						{
							id: `guest_${productId}`,
							user_id: '',
							product_id: productId,
							quantity: existingIndex >= 0 ? cart[existingIndex].quantity : quantity,
							created_at: new Date().toISOString(),
							product: product || undefined,
						},
						...prev,
					];
				});

				toast.success('Added to cart');
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
							(cartItem: { product_id: string }) => cartItem.product_id !== item.product_id
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
							(cartItem: { product_id: string }) => cartItem.product_id === item.product_id
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

