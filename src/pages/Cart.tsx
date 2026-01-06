import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';

interface CartItem {
	id: number;
	name: string;
	category: string;
	price: number;
	image: string;
	quantity: number;
}

const Cart = () => {
	const [cartItems, setCartItems] = useState<CartItem[]>([
		{
			id: 1,
			name: 'Signature Timepiece',
			category: 'Watches',
			price: 2499,
			image: productWatch,
			quantity: 1,
		},
		{
			id: 2,
			name: 'Executive Tote',
			category: 'Bags',
			price: 899,
			image: productBag,
			quantity: 2,
		},
		{
			id: 3,
			name: 'Studio Pro Max',
			category: 'Audio',
			price: 549,
			image: productHeadphones,
			quantity: 1,
		},
	]);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const updateQuantity = (id: number, change: number) => {
		setCartItems((items) =>
			items.map((item) =>
				item.id === id
					? { ...item, quantity: Math.max(1, item.quantity + change) }
					: item
			)
		);
	};

	const removeItem = (id: number) => {
		setCartItems((items) => items.filter((item) => item.id !== id));
	};

	const subtotal = cartItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0
	);
	const shipping = subtotal > 200 ? 0 : 15;
	const tax = subtotal * 0.08;
	const total = subtotal + shipping + tax;

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
						{cartItems.length > 0 ? (
							<div className="grid lg:grid-cols-3 gap-8">
								{/* Cart Items */}
								<div className="lg:col-span-2 space-y-4">
									{cartItems.map((item) => (
										<Card key={item.id} className="border-border">
											<CardContent className="p-6">
												<div className="flex gap-6">
													{/* Product Image */}
													<Link
														to={`/product/${item.id}`}
														className="flex-shrink-0"
													>
														<img
															src={item.image}
															alt={item.name}
															className="w-24 h-24 object-cover rounded-sm"
														/>
													</Link>

													{/* Product Details */}
													<div className="flex-1 flex flex-col justify-between">
														<div>
															<Link
																to={`/product/${item.id}`}
																className="hover:text-gold transition-colors"
															>
																<h3 className="font-semibold text-lg mb-1">
																	{item.name}
																</h3>
															</Link>
															<p className="text-sm text-muted-foreground mb-2">
																{item.category}
															</p>
															<p className="text-lg font-semibold text-gradient-gold">
																{formatPrice(item.price)}
															</p>
														</div>

														{/* Quantity Controls */}
														<div className="flex items-center justify-between mt-4">
															<div className="flex items-center gap-3">
																<Button
																	variant="outline"
																	size="icon"
																	className="h-8 w-8"
																	onClick={() => updateQuantity(item.id, -1)}
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
																	onClick={() => updateQuantity(item.id, 1)}
																>
																	<Plus className="h-4 w-4" />
																</Button>
															</div>

															<Button
																variant="ghost"
																size="icon"
																onClick={() => removeItem(item.id)}
																className="text-destructive hover:text-destructive"
															>
																<Trash2 className="h-5 w-5" />
															</Button>
														</div>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
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
													<span className="text-muted-foreground">Subtotal</span>
													<span>{formatPrice(subtotal)}</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">Shipping</span>
													<span>
														{shipping === 0 ? (
															<span className="text-gold">Free</span>
														) : (
															formatPrice(shipping)
														)}
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">Tax</span>
													<span>{formatPrice(tax)}</span>
												</div>
												{subtotal < 200 && (
													<p className="text-xs text-muted-foreground pt-2">
														Add {formatPrice(200 - subtotal)} more for free shipping
													</p>
												)}
											</div>

											<div className="border-t border-border pt-4">
												<div className="flex justify-between text-lg font-bold mb-4">
													<span>Total</span>
													<span className="text-gradient-gold">
														{formatPrice(total)}
													</span>
												</div>
												<Button variant="hero" className="w-full" size="lg">
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

