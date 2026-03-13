import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';

const Cart = () => {
	const navigate = useNavigate();
	const { cartItems, loading, updateQuantity, removeFromCart } = useCart();

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const handleQuantityChange = (cartItemId: string, change: number) => {
		const item = cartItems.find((item) => item.id === cartItemId);
		if (!item || !item.product) return;

		const currentQuantity = item.quantity;
		const newQuantity = currentQuantity + change;
		const availableStock = item.variant_stock ?? item.product.stock;

		// Don't allow quantity below 1 (use remove button instead)
		if (newQuantity < 1) return;

		// Don't allow quantity above stock
		if (newQuantity > availableStock) return;

		updateQuantity(cartItemId, newQuantity);
	};

	const subtotal = cartItems.reduce(
		(sum, item) => sum + (item.product?.price || 0) * item.quantity,
		0
	);
	const shipping = 0; // Shipping will be calculated in checkout based on selected delivery method
	const total = subtotal + shipping;

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Hero Section */}
				<section className="py-16 md:py-24 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="text-center space-y-4">
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
								Shopping Cart
							</h1>
							<p className="text-muted-foreground">
								Review your items and proceed to checkout
							</p>
						</div>
					</div>
				</section>

				{/* Cart Content */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						{loading ? (
							<div className="text-center py-16">
								<p className="text-muted-foreground">Loading cart...</p>
							</div>
						) : cartItems.length > 0 ? (
							<div className="grid lg:grid-cols-3 gap-8">
								{/* Cart Items */}
								<div className="lg:col-span-2 space-y-4">
									{cartItems.map((item) => {
										if (!item.product) return null;
										
										return (
											<Card key={item.id} className="border-border">
												<CardContent className="p-6">
													<div className="flex gap-6">
														{/* Product Image */}
														<Link
															to={`/product/${item.product.id}`}
															className="flex-shrink-0"
														>
															<img
																src={
																	item.product.images && item.product.images.length > 0
																		? getOptimizedCloudinaryUrl(item.product.images[0], {
																				width: 200,
																				height: 200,
																				crop: 'fill',
																				quality: 'auto',
																			})
																		: '/placeholder.svg'
																}
																alt={item.product.name}
																className="w-24 h-24 object-cover rounded-sm"
															/>
														</Link>

														{/* Product Details */}
														<div className="flex-1 flex flex-col justify-between">
															<div>
																<Link
																	to={`/product/${item.product.id}`}
																	className="hover:text-gold transition-colors"
																>
																	<h3 className="font-semibold text-lg mb-1">
																		{item.product.name}
																	</h3>
																</Link>
																<p className="text-sm text-muted-foreground mb-2">
																	{item.product.category}
																</p>
										{(item.selected_color || item.selected_size) && (
											<p className="text-xs text-muted-foreground mb-2">
												{item.selected_color ? `Color: ${item.selected_color}` : ''}
												{item.selected_color && item.selected_size ? ' | ' : ''}
												{item.selected_size ? `Size: ${item.selected_size}` : ''}
											</p>
										)}
																<p className="text-lg font-semibold text-gradient-gold">
																	{formatPrice(item.product.price)}
																</p>
															</div>

															{/* Quantity Controls */}
															<div className="flex items-center justify-between mt-4">
																<div className="flex items-center gap-3">
																	<Button
																		variant="outline"
																		size="icon"
																		className="h-8 w-8"
																		onClick={() => handleQuantityChange(item.id, -1)}
																		disabled={item.quantity <= 1}
																		title="Decrease quantity"
																	>
																		<Minus className="h-4 w-4" />
																	</Button>
																	<span className="w-12 text-center font-medium">
																		{item.quantity}
																	</span>
																	<Button
																		variant="outline"
																		size="icon"
																		className="h-8 w-8"
																		onClick={() => handleQuantityChange(item.id, 1)}
																		disabled={
																			!item.product ||
																			item.quantity >= (item.variant_stock ?? item.product.stock)
																		}
																		title="Increase quantity"
																	>
																		<Plus className="h-4 w-4" />
																	</Button>
																</div>

																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => removeFromCart(item.id)}
																	className="text-destructive hover:text-destructive"
																>
																	<Trash2 className="h-5 w-5" />
																</Button>
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>

								{/* Order Summary */}
								<div className="lg:col-span-1">
									<Card className="border-border sticky top-24">
										<CardHeader>
											<CardTitle>Order Summary</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Subtotal
													</span>
													<span>{formatPrice(subtotal)}</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Shipping
													</span>
													<span className="text-muted-foreground">
														Calculated at checkout
													</span>
												</div>
											</div>

											<div className="border-t border-border pt-4">
												<div className="flex justify-between text-lg font-bold mb-4">
													<span>Total</span>
													<span className="text-gradient-gold">
														{formatPrice(total)}
													</span>
												</div>
												<Button 
													variant="hero" 
													className="w-full" 
													size="lg"
													onClick={() => {
														navigate('/checkout', {
															state: {
																cartItems: cartItems.map(item => ({
																	id: item.id,
																	product_id: item.product_id,
																	variant_id: item.variant_id ?? null,
																	selected_color: item.selected_color ?? null,
																	selected_size: item.selected_size ?? null,
																	product: item.product,
																	quantity: item.quantity,
																})),
																subtotal,
																shipping,
																total,
															}
														});
													}}
												>
													Proceed to Checkout
												</Button>
											</div>

											<Link
												to="/products"
												className="block text-center text-sm text-gold hover:text-gold-muted transition-colors"
											>
												Continue Shopping
											</Link>
										</CardContent>
									</Card>
								</div>
							</div>
						) : (
							<div className="text-center py-16">
								<ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
								<p className="text-muted-foreground mb-6">
									Start adding items to your cart
								</p>
								<Link to="/products">
									<Button variant="hero">Browse Products</Button>
								</Link>
							</div>
						)}
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default Cart;
