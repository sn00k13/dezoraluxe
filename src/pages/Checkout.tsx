import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	Truck,
	CreditCard,
	Lock,
	Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { initializePaystack, generatePaystackReference } from '@/lib/paystack';
import { supabase } from '@/lib/supabase';
import { ShippingAddress } from '@/types/database';
import { toast } from 'sonner';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';

interface DeliveryMethod {
	id: string;
	name: string;
	company: string;
	price: number;
	estimatedDays: string;
}

const deliveryMethods: DeliveryMethod[] = [
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
		name: '*Locations Within Abuja',
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

const Checkout = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, signIn } = useAuth();
	const {
		cartItems: contextCartItems,
		loading: cartLoading,
		clearCart,
	} = useCart();
	const [currentStage, setCurrentStage] = useState<
		'email' | 'shipping' | 'delivery' | 'payment'
	>(user ? 'shipping' : 'email');
	const [isShippingOpen, setIsShippingOpen] = useState(false);
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [loginEmail, setLoginEmail] = useState('');
	const [loginPassword, setLoginPassword] = useState('');
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [guestEmail, setGuestEmail] = useState('');
	const [shippingInfo, setShippingInfo] = useState({
		firstName: '',
		lastName: '',
		email: user?.email || '',
		phone: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'Nigeria',
	});
	const [selectedDelivery, setSelectedDelivery] = useState<string>('gig');
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null
	);
	const [showNewAddressForm, setShowNewAddressForm] = useState(false);
	const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
	const [isSavingAddress, setIsSavingAddress] = useState(false);

	// Load saved addresses
	const loadSavedAddresses = async () => {
		if (!user) return;

		setIsLoadingAddresses(true);
		try {
			const { data, error } = await supabase
				.from('shipping_addresses')
				.select('*')
				.eq('user_id', user.id)
				.order('is_default', { ascending: false })
				.order('created_at', { ascending: false });

			if (error) throw error;

			setSavedAddresses(data || []);

			// Auto-select default address if available
			const defaultAddress = data?.find((addr) => addr.is_default);
			if (defaultAddress) {
				selectAddress(defaultAddress);
			}
		} catch (error) {
			console.error('Error loading addresses:', error);
			toast.error('Failed to load saved addresses');
		} finally {
			setIsLoadingAddresses(false);
		}
	};

	// Fetch saved addresses when user is logged in
	useEffect(() => {
		if (user && currentStage === 'shipping') {
			loadSavedAddresses();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, currentStage]);

	// Auto-advance to shipping when user logs in
	useEffect(() => {
		if (user && currentStage === 'email') {
			setShippingInfo((prev) => ({ ...prev, email: user.email || '' }));
			setCurrentStage('shipping');
			setIsShippingOpen(true);
		}
	}, [user, currentStage]);

	// Select a saved address
	const selectAddress = (address: ShippingAddress) => {
		setSelectedAddressId(address.id);
		setShippingInfo({
			firstName: address.first_name,
			lastName: address.last_name,
			email: user?.email || '',
			phone: address.phone || '',
			address: address.address,
			city: address.city,
			state: address.state,
			zipCode: address.zip_code,
			country: address.country,
		});
		setShowNewAddressForm(false);
	};

	// Save new address
	const saveNewAddress = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		// Validate form
		if (
			!shippingInfo.firstName ||
			!shippingInfo.lastName ||
			!shippingInfo.address ||
			!shippingInfo.city ||
			!shippingInfo.state
		) {
			toast.error('Please fill in all required fields');
			return;
		}

		setIsSavingAddress(true);
		try {
			const { data, error } = await supabase
				.from('shipping_addresses')
				.insert({
					user_id: user.id,
					first_name: shippingInfo.firstName,
					last_name: shippingInfo.lastName,
					phone: shippingInfo.phone || null,
					address: shippingInfo.address,
					city: shippingInfo.city,
					state: shippingInfo.state,
					zip_code: shippingInfo.zipCode,
					country: shippingInfo.country,
					is_default: savedAddresses.length === 0, // Set as default if it's the first address
				})
				.select()
				.single();

			if (error) throw error;

			toast.success('Address saved successfully!');
			await loadSavedAddresses();
			if (data) {
				selectAddress(data);
			}
		} catch (error) {
			console.error('Error saving address:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to save address';
			toast.error(errorMessage);
		} finally {
			setIsSavingAddress(false);
		}
	};

	// Get cart data from location state or fallback to context
	interface LocationState {
		cartItems?: Array<{
			id: string;
			product_id: string;
			product?: {
				id: string;
				name: string;
				category: string;
				price: number;
				images: string[];
			};
			quantity: number;
		}>;
		subtotal?: number;
		shipping?: number;
		tax?: number;
		total?: number;
	}

	const locationState = (location.state as LocationState | null) || null;

	// Use cart items from location state, or fallback to context cart items
	const cartItemsFromState = locationState?.cartItems || [];
	const cartItems =
		cartItemsFromState.length > 0
			? cartItemsFromState.map((item) => ({
					id: item.id,
					product_id: item.product_id,
					product: item.product,
					quantity: item.quantity,
			  }))
			: contextCartItems.filter((item) => item.product); // Only include items with product data

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0,
		}).format(price);
	};

	// Calculate totals from cart items or use passed values
	const calculatedSubtotal = cartItems.reduce(
		(sum, item) => sum + (item.product?.price || 0) * item.quantity,
		0
	);
	const subtotal = locationState?.subtotal ?? calculatedSubtotal;

	const selectedDeliveryMethod =
		deliveryMethods.find((method) => method.id === selectedDelivery) ||
		deliveryMethods[0];
	const shipping = locationState?.shipping ?? selectedDeliveryMethod.price;
	const tax = locationState?.tax ?? subtotal * 0.08;
	const total = locationState?.total ?? subtotal + shipping + tax;

	// Redirect to cart if no items
	useEffect(() => {
		if (cartItems.length === 0 && !cartLoading) {
			toast.error('Your cart is empty');
			navigate('/cart');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cartItems.length, navigate]);

	const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setShippingInfo({
			...shippingInfo,
			[e.target.id]: e.target.value,
		});
	};

	const handleEmailSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!guestEmail || !guestEmail.includes('@')) {
			toast.error('Please enter a valid email address');
			return;
		}
		setShippingInfo({ ...shippingInfo, email: guestEmail });
		setCurrentStage('shipping');
		setIsShippingOpen(true);
	};

	const handleLoginSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!loginEmail || !loginPassword) {
			toast.error('Please enter both email and password');
			return;
		}

		setIsLoggingIn(true);
		try {
			const { error } = await signIn(loginEmail, loginPassword);
			if (error) {
				toast.error(error.message || 'Failed to sign in');
				setIsLoggingIn(false);
				return;
			}
			// Success - user will be logged in and component will re-render
			toast.success('Successfully signed in!');
			setShippingInfo({ ...shippingInfo, email: loginEmail });
			setCurrentStage('shipping');
			setIsShippingOpen(true);
		} catch (error) {
			toast.error('An error occurred during sign in');
			setIsLoggingIn(false);
		}
	};

	const handleShippingProceed = async (e: React.FormEvent) => {
		e.preventDefault();
		// Validate shipping form
		if (
			!shippingInfo.firstName ||
			!shippingInfo.lastName ||
			!shippingInfo.email ||
			!shippingInfo.phone ||
			!shippingInfo.address ||
			!shippingInfo.city ||
			!shippingInfo.state
		) {
			toast.error('Please fill in all required shipping fields');
			return;
		}

		// If user is logged in and using a new address (not from saved addresses), save it
		if (user && !selectedAddressId) {
			try {
				const { data, error } = await supabase
					.from('shipping_addresses')
					.insert({
						user_id: user.id,
						first_name: shippingInfo.firstName,
						last_name: shippingInfo.lastName,
						phone: shippingInfo.phone || null,
						address: shippingInfo.address,
						city: shippingInfo.city,
						state: shippingInfo.state,
						zip_code: shippingInfo.zipCode,
						country: shippingInfo.country,
						is_default: savedAddresses.length === 0, // Set as default if it's the first address
					})
					.select()
					.single();

				if (error) {
					console.error('Error saving address:', error);
					// Don't block checkout if address save fails, just log it
					toast.error('Address could not be saved, but checkout will continue');
				} else {
					// Reload addresses to include the new one
					await loadSavedAddresses();
					if (data) {
						setSelectedAddressId(data.id);
					}
				}
			} catch (error) {
				console.error('Error saving address:', error);
				// Don't block checkout if address save fails
			}
		}

		setIsShippingOpen(false);
		setCurrentStage('delivery');
	};

	const handleDeliveryProceed = () => {
		if (!selectedDelivery) {
			toast.error('Please select a delivery method');
			return;
		}
		setCurrentStage('payment');
	};

	const createOrder = async (paymentReference: string) => {
		try {
			// Generate order number using RPC function or fallback
			let orderNumber: string;

			try {
				const { data: orderNumberData, error: orderNumberError } =
					await supabase.rpc('generate_order_number');

				if (orderNumberError || !orderNumberData) {
					throw new Error('RPC function failed');
				}
				orderNumber = orderNumberData;
			} catch (error) {
				// Fallback to manual order number generation
				const year = new Date().getFullYear();
				const timestamp = Date.now();
				orderNumber = `ORD-${year}-${timestamp.toString().slice(-6)}`;
			}

			// Create order
			const shippingAddressJson = {
				name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
				address: shippingInfo.address,
				city: shippingInfo.city,
				state: shippingInfo.state,
				zip_code: shippingInfo.zipCode,
				country: shippingInfo.country,
			};

			const { data: orderData, error: orderError } = await supabase
				.from('orders')
				.insert({
					user_id: user?.id || null,
					order_number: orderNumber,
					total_amount: total,
					status: 'pending',
					shipping_address: shippingAddressJson,
					payment_reference: paymentReference,
					delivery_method: selectedDeliveryMethod.name,
				})
				.select()
				.single();

			if (orderError) {
				throw orderError;
			}

			// Create order items
			const orderItems = cartItems
				.filter((item) => item.product) // Only include items with product data
				.map((item) => ({
					order_id: orderData.id,
					product_id: item.product_id,
					quantity: item.quantity,
					price: item.product?.price || 0,
				}));

			if (orderItems.length === 0) {
				throw new Error('No valid items to create order');
			}

			const { error: itemsError } = await supabase
				.from('order_items')
				.insert(orderItems);

			if (itemsError) {
				throw itemsError;
			}

			// Clear cart after successful order creation
			await clearCart();

			return orderData;
		} catch (error) {
			console.error('Error creating order:', error);
			throw error;
		}
	};

	const handlePayment = async () => {
		if (isProcessingPayment) return;

		setIsProcessingPayment(true);

		try {
			const email = user?.email || guestEmail || shippingInfo.email;
			const reference = generatePaystackReference();

			// Initialize Paystack payment
			initializePaystack(
				email,
				total,
				reference,
				{
					custom_fields: [
						{
							display_name: 'Order Items',
							variable_name: 'order_items',
							value: cartItems
								.map(
									(item) =>
										`${item.product?.name || 'Product'} x${item.quantity}`
								)
								.join(', '),
						},
						{
							display_name: 'Shipping Address',
							variable_name: 'shipping_address',
							value: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state}`,
						},
						{
							display_name: 'Delivery Method',
							variable_name: 'delivery_method',
							value: selectedDeliveryMethod.name,
						},
					],
				},
				async (response) => {
					// Payment successful - create order
					try {
						const order = await createOrder(response.reference);

						toast.success('Payment successful! Order created.');

						// Navigate to order confirmation with order details
						navigate('/order-confirmation', {
							state: {
								orderId: order.id,
								orderNumber: order.order_number,
								orderReference: reference,
								paymentReference: response.reference,
								shippingInfo,
								cartItems,
								total,
								deliveryMethod: selectedDeliveryMethod,
							},
						});
					} catch (error) {
						console.error('Error creating order:', error);
						const errorMessage =
							error instanceof Error ? error.message : 'Unknown error';
						toast.error(
							'Payment successful but failed to create order. Please contact support with reference: ' +
								response.reference
						);
						setIsProcessingPayment(false);
					}
				},
				() => {
					// Payment cancelled
					toast.error('Payment was cancelled');
					setIsProcessingPayment(false);
				}
			);
		} catch (error) {
			console.error('Payment error:', error);
			toast.error('An error occurred while processing payment');
			setIsProcessingPayment(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Hero Section */}
				<section className="py-16 md:py-24 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="text-center space-y-4">
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
								Checkout
							</h1>
							<p className="text-muted-foreground">
								Complete your order securely
							</p>
						</div>
					</div>
				</section>

				{/* Checkout Content */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						<Link
							to="/cart"
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Cart
						</Link>

						<div className="grid lg:grid-cols-3 gap-8">
							{/* Left Column - Checkout Steps */}
							<div className="lg:col-span-2 space-y-6">
								{/* Stage 1: Guest Email or Login (if not logged in) */}
								{!user && currentStage === 'email' && (
									<Card className="border-border">
										<CardHeader>
											<CardTitle>
												{showLoginForm ? 'Sign In' : 'Email Address'}
											</CardTitle>
										</CardHeader>
										<CardContent>
											{showLoginForm ? (
												<form
													onSubmit={handleLoginSubmit}
													className="space-y-4"
												>
													<div className="space-y-2">
														<Label htmlFor="loginEmail">
															Email Address{' '}
															<span className="text-red-500">*</span>
														</Label>
														<Input
															id="loginEmail"
															type="email"
															placeholder="your.email@example.com"
															value={loginEmail}
															onChange={(e) => setLoginEmail(e.target.value)}
															required
															disabled={isLoggingIn}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="loginPassword">
															Password <span className="text-red-500">*</span>
														</Label>
														<Input
															id="loginPassword"
															type="password"
															placeholder="Enter your password"
															value={loginPassword}
															onChange={(e) => setLoginPassword(e.target.value)}
															required
															disabled={isLoggingIn}
														/>
													</div>
													<div className="flex items-center justify-between text-sm">
														<button
															type="button"
															onClick={() => setShowLoginForm(false)}
															className="text-gold hover:underline font-medium"
															disabled={isLoggingIn}
														>
															← Back to guest checkout
														</button>
														<Link
															to="/signup"
															className="text-gold hover:underline font-medium"
														>
															Sign up
														</Link>
													</div>
													<Button
														type="submit"
														variant="hero"
														className="w-full"
														disabled={isLoggingIn}
													>
														{isLoggingIn ? 'Signing in...' : 'Sign In'}
													</Button>
												</form>
											) : (
												<form
													onSubmit={handleEmailSubmit}
													className="space-y-4"
												>
													<div className="space-y-2">
														<Label htmlFor="guestEmail">
															Email Address{' '}
															<span className="text-red-500">*</span>
														</Label>
														<Input
															id="guestEmail"
															type="email"
															placeholder="your.email@example.com"
															value={guestEmail}
															onChange={(e) => setGuestEmail(e.target.value)}
															required
														/>
														<p className="text-xs text-muted-foreground">
															We'll send your order confirmation and receipt to
															this email
														</p>
													</div>
													<div className="flex items-center justify-between text-sm">
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">
																Already have an account?
															</span>
															<button
																type="button"
																onClick={() => setShowLoginForm(true)}
																className="text-gold hover:underline font-medium"
															>
																Sign in
															</button>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">
																Don't have an account?
															</span>
															<Link
																to="/signup"
																className="text-gold hover:underline font-medium"
															>
																Sign up
															</Link>
														</div>
													</div>
													<Button
														type="submit"
														variant="hero"
														className="w-full"
													>
														Continue to Shipping
													</Button>
												</form>
											)}
										</CardContent>
									</Card>
								)}

								{/* Stage 2: Shipping Information */}
								{(currentStage === 'shipping' ||
									currentStage === 'delivery' ||
									currentStage === 'payment') && (
									<Card className="border-border">
										<Collapsible
											open={isShippingOpen}
											onOpenChange={setIsShippingOpen}
										>
											<CardHeader>
												<CollapsibleTrigger asChild>
													<button
														type="button"
														className="flex items-center justify-between w-full text-left"
													>
														<CardTitle>Shipping Information</CardTitle>
														{isShippingOpen ? (
															<ChevronUp className="h-5 w-5 text-muted-foreground" />
														) : (
															<ChevronDown className="h-5 w-5 text-muted-foreground" />
														)}
													</button>
												</CollapsibleTrigger>
											</CardHeader>
											<CollapsibleContent>
												<CardContent>
													{/* Show saved addresses for logged-in users */}
													{user &&
														savedAddresses.length > 0 &&
														!showNewAddressForm && (
															<div className="space-y-4 mb-6">
																<RadioGroup
																	value={selectedAddressId || ''}
																	onValueChange={(value) => {
																		const address = savedAddresses.find(
																			(addr) => addr.id === value
																		);
																		if (address) {
																			selectAddress(address);
																		}
																	}}
																	className="space-y-3"
																>
																	{savedAddresses.map((address) => (
																		<div
																			key={address.id}
																			className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
																				selectedAddressId === address.id
																					? 'border-gold bg-gold/5'
																					: 'border-border hover:border-gold/50'
																			}`}
																			onClick={() => selectAddress(address)}
																		>
																			<RadioGroupItem
																				value={address.id}
																				id={address.id}
																				className="mt-1"
																			/>
																			<Label
																				htmlFor={address.id}
																				className="flex-1 cursor-pointer space-y-1"
																			>
																				<div className="flex items-start justify-between">
																					<div className="flex-1">
																						<div className="flex items-center gap-2 mb-1">
																							<p className="font-medium">
																								{address.first_name}{' '}
																								{address.last_name}
																							</p>
																							{address.is_default && (
																								<span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded">
																									Default
																								</span>
																							)}
																						</div>
																						<p className="text-sm text-muted-foreground">
																							{address.address}
																						</p>
																		<p className="text-sm text-muted-foreground">
																			{address.city}, {address.state}
																		</p>
																						<p className="text-sm text-muted-foreground">
																							{address.country}
																						</p>
																						{address.phone && (
																							<p className="text-sm text-muted-foreground">
																								{address.phone}
																							</p>
																						)}
																					</div>
																				</div>
																			</Label>
																		</div>
																	))}
																</RadioGroup>

																<Button
																	type="button"
																	variant="outline"
																	className="w-full"
																	onClick={() => {
																		setShowNewAddressForm(true);
																		setSelectedAddressId(null);
																		// Clear form for new address
																		setShippingInfo({
																			firstName: '',
																			lastName: '',
																			email: user.email || '',
																			phone: '',
																			address: '',
																			city: '',
																			state: '',
																			zipCode: '',
																			country: 'Nigeria',
																		});
																	}}
																>
																	<Plus className="h-4 w-4 mr-2" />
																	Add Shipping Address
																</Button>
															</div>
														)}

													{/* Show form for new address or guest checkout */}
													{(showNewAddressForm ||
														!user ||
														savedAddresses.length === 0) && (
														<form
															onSubmit={
																user && showNewAddressForm
																	? saveNewAddress
																	: handleShippingProceed
															}
															className="space-y-4"
														>
															{user &&
																savedAddresses.length > 0 &&
																showNewAddressForm && (
																	<div className="mb-4">
																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			onClick={() => {
																				setShowNewAddressForm(false);
																				// Restore selected address if any
																				if (selectedAddressId) {
																					const address = savedAddresses.find(
																						(addr) =>
																							addr.id === selectedAddressId
																					);
																					if (address) {
																						selectAddress(address);
																					}
																				}
																			}}
																		>
																			← Back to saved addresses
																		</Button>
																	</div>
																)}
															<div className="grid md:grid-cols-2 gap-4">
																<div className="space-y-2">
																	<Label htmlFor="firstName">
																		First Name{' '}
																		<span className="text-red-500">*</span>
																	</Label>
																	<Input
																		id="firstName"
																		value={shippingInfo.firstName}
																		onChange={handleShippingChange}
																		required
																	/>
																</div>
																<div className="space-y-2">
																	<Label htmlFor="lastName">
																		Last Name{' '}
																		<span className="text-red-500">*</span>
																	</Label>
																	<Input
																		id="lastName"
																		value={shippingInfo.lastName}
																		onChange={handleShippingChange}
																		required
																	/>
																</div>
															</div>

															<div className="space-y-2">
																<Label htmlFor="email">
																	Email <span className="text-red-500">*</span>
																</Label>
																<Input
																	id="email"
																	type="email"
																	value={shippingInfo.email}
																	onChange={handleShippingChange}
																	required
																	disabled={!!user}
																/>
															</div>

															<div className="space-y-2">
																<Label htmlFor="phone">
																	Phone <span className="text-red-500">*</span>
																</Label>
																<Input
																	id="phone"
																	type="tel"
																	value={shippingInfo.phone}
																	onChange={handleShippingChange}
																	required
																/>
															</div>

															<div className="space-y-2">
																<Label htmlFor="address">
																	Address{' '}
																	<span className="text-red-500">*</span>
																</Label>
																<Input
																	id="address"
																	value={shippingInfo.address}
																	onChange={handleShippingChange}
																	required
																/>
															</div>

															<div className="grid md:grid-cols-2 gap-4">
																<div className="space-y-2">
																	<Label htmlFor="city">
																		City <span className="text-red-500">*</span>
																	</Label>
																	<Input
																		id="city"
																		value={shippingInfo.city}
																		onChange={handleShippingChange}
																		required
																	/>
																</div>
																<div className="space-y-2">
																	<Label htmlFor="state">
																		State{' '}
																		<span className="text-red-500">*</span>
																	</Label>
																	<Input
																		id="state"
																		value={shippingInfo.state}
																		onChange={handleShippingChange}
																		required
																	/>
																</div>
															</div>

															<div className="space-y-2">
																<Label htmlFor="country">Country</Label>
																<Input
																	id="country"
																	value={shippingInfo.country}
																	onChange={handleShippingChange}
																	placeholder="Enter country"
																/>
															</div>

															{user && showNewAddressForm ? (
																<Button
																	type="submit"
																	variant="hero"
																	className="w-full"
																	disabled={isSavingAddress}
																>
																	{isSavingAddress
																		? 'Saving...'
																		: 'Save Address & Continue'}
																</Button>
															) : (
																<Button
																	type="submit"
																	variant="hero"
																	className="w-full"
																>
																	Proceed to Delivery
																</Button>
															)}
														</form>
													)}

													{/* Proceed button when address is selected */}
													{user &&
														savedAddresses.length > 0 &&
														!showNewAddressForm &&
														selectedAddressId && (
															<Button
																type="button"
																variant="hero"
																className="w-full"
																onClick={handleShippingProceed}
															>
																Proceed to Delivery
															</Button>
														)}
												</CardContent>
											</CollapsibleContent>
										</Collapsible>
									</Card>
								)}

								{/* Stage 3: Delivery Method */}
								{(currentStage === 'delivery' ||
									currentStage === 'payment') && (
									<Card className="border-border">
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<Truck className="h-5 w-5" />
												Choose Delivery Method
											</CardTitle>
										</CardHeader>
										<CardContent>
											<RadioGroup
												value={selectedDelivery}
												onValueChange={setSelectedDelivery}
												className="space-y-4"
											>
												{deliveryMethods.map((method) => (
													<div
														key={method.id}
														className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
															selectedDelivery === method.id
																? 'border-gold bg-gold/5'
																: 'border-border hover:border-gold/50'
														}`}
														onClick={() => setSelectedDelivery(method.id)}
													>
														<RadioGroupItem value={method.id} id={method.id} />
														<Label
															htmlFor={method.id}
															className="flex-1 cursor-pointer space-y-1"
														>
															<div className="flex items-center justify-between">
																<div>
																	<p className="font-medium">{method.name}</p>
																	<p className="text-sm text-muted-foreground">
																		{method.estimatedDays}
																	</p>
																</div>
																<p className="font-semibold text-gold">
																	{method.price === 0 ? 'Free' : formatPrice(method.price)}
																</p>
															</div>
														</Label>
													</div>
												))}
											</RadioGroup>

											<div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
												<p className="text-sm text-muted-foreground">
													<strong className="text-foreground">Note:</strong> Please note you might still be communicated for extra charge if you have a large volume of order.
												</p>
												<p className="text-sm text-muted-foreground">
													<strong className="text-foreground">Note:</strong> Please note that you might still be communicated for extra charge if your location is far from town.
												</p>
											</div>

											{currentStage === 'delivery' && (
												<Button
													variant="hero"
													className="w-full mt-6"
													onClick={handleDeliveryProceed}
												>
													Proceed to Payment
												</Button>
											)}
										</CardContent>
									</Card>
								)}

								{/* Stage 4: Payment */}
								{currentStage === 'payment' && (
									<Card className="border-border">
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<CreditCard className="h-5 w-5" />
												Payment
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="bg-muted/50 p-4 rounded-lg space-y-2">
												<p className="text-sm font-medium">Payment Method</p>
												<p className="text-sm text-muted-foreground">
													Secure payment powered by Paystack
												</p>
											</div>

											<div className="flex items-center gap-2 pt-2">
												<Lock className="h-4 w-4 text-muted-foreground" />
												<p className="text-xs text-muted-foreground">
													Your payment information is secure and encrypted
												</p>
											</div>

											<Button
												variant="hero"
												className="w-full"
												size="lg"
												onClick={handlePayment}
												disabled={isProcessingPayment}
											>
												{isProcessingPayment
													? 'Processing...'
													: `Pay ${formatPrice(total)}`}
											</Button>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Right Column - Order Summary */}
							<div className="lg:col-span-1">
								<Card className="border-border sticky top-24">
									<CardHeader>
										<CardTitle>Order Summary</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{/* Order Items */}
										<div className="space-y-4 max-h-64 overflow-y-auto">
											{cartItems.map((item) => {
												if (!item.product) return null;
												const imageUrl =
													item.product.images && item.product.images.length > 0
														? getOptimizedCloudinaryUrl(
																item.product.images[0],
																{
																	width: 200,
																	height: 200,
																	crop: 'fill',
																	quality: 'auto',
																}
														  )
														: '/placeholder.svg';

												return (
													<div key={item.id} className="flex gap-4">
														<img
															src={imageUrl}
															alt={item.product.name}
															className="w-16 h-16 object-cover rounded-sm"
														/>
														<div className="flex-1">
															<p className="font-medium text-sm">
																{item.product.name}
															</p>
															<p className="text-xs text-muted-foreground">
																Qty: {item.quantity}
															</p>
															<p className="text-sm font-semibold text-gradient-gold mt-1">
																{formatPrice(
																	item.product.price * item.quantity
																)}
															</p>
														</div>
													</div>
												);
											})}
										</div>

										<div className="border-t border-border pt-4 space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">Subtotal</span>
												<span>{formatPrice(subtotal)}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">Shipping</span>
												<span>
													{selectedDeliveryMethod && (
														<span>
															{formatPrice(selectedDeliveryMethod.price)}
														</span>
													)}
												</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-muted-foreground">Tax</span>
												<span>{formatPrice(tax)}</span>
											</div>
											<div className="border-t border-border pt-4">
												<div className="flex justify-between text-lg font-bold mb-4">
													<span>Total</span>
													<span className="text-gradient-gold">
														{formatPrice(total)}
													</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default Checkout;
