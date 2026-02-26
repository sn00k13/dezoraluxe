import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem } from '@/types/database';
import { toast } from 'sonner';

interface OrderWithItems extends Order {
	items_count: number;
}

const OrderHistory = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [orders, setOrders] = useState<OrderWithItems[]>([]);
	const [loading, setLoading] = useState(true);
	const getErrorMessage = (error: unknown) =>
		error instanceof Error ? error.message : 'An unexpected error occurred';

	useEffect(() => {
		if (!user) {
			// Redirect to sign in if not logged in
			navigate('/signin');
			return;
		}

		loadOrders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const loadOrders = async () => {
		if (!user) return;

		setLoading(true);
		try {
			// Fetch orders for the current user
			const { data: ordersData, error: ordersError } = await supabase
				.from('orders')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (ordersError) {
				throw ordersError;
			}

			if (!ordersData || ordersData.length === 0) {
				setOrders([]);
				setLoading(false);
				return;
			}

			// Fetch item counts for each order
			const ordersWithItems = await Promise.all(
				ordersData.map(async (order) => {
					const { count, error: countError } = await supabase
						.from('order_items')
						.select('*', { count: 'exact', head: true })
						.eq('order_id', order.id);

					if (countError) {
						console.error('Error counting order items:', countError);
					}

					return {
						...order,
						items_count: count || 0,
					};
				})
			);

			setOrders(ordersWithItems);
		} catch (error: unknown) {
			console.error('Error loading orders:', error);
			toast.error(getErrorMessage(error) || 'Failed to load orders');
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const getStatusDisplay = (status: Order['status']) => {
		switch (status) {
			case 'delivered':
				return 'Delivered';
			case 'shipped':
				return 'Shipped';
			case 'processing':
				return 'Processing';
			case 'pending':
				return 'Pending';
			case 'cancelled':
				return 'Cancelled';
			default:
				return status;
		}
	};

	const getStatusColor = (status: Order['status']) => {
		switch (status) {
			case 'delivered':
				return 'text-green-500';
			case 'shipped':
				return 'text-blue-500';
			case 'processing':
				return 'text-yellow-500';
			case 'pending':
				return 'text-yellow-500';
			case 'cancelled':
				return 'text-destructive';
			default:
				return 'text-muted-foreground';
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
								Order History
							</h1>
							<p className="text-muted-foreground">
								View and track your past orders
							</p>
						</div>
					</div>
				</section>

				{/* Orders Table */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						{loading ? (
							<div className="text-center py-16">
								<Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
								<p className="text-muted-foreground">Loading orders...</p>
							</div>
						) : orders.length > 0 ? (
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Your Orders</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Order ID</TableHead>
												<TableHead>Date</TableHead>
												<TableHead>Items</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{orders.map((order) => (
												<TableRow key={order.id}>
													<TableCell className="font-medium">
														{order.order_number || order.id}
													</TableCell>
													<TableCell>{formatDate(order.created_at)}</TableCell>
													<TableCell>{order.items_count}</TableCell>
													<TableCell className="font-semibold">
														{formatPrice(order.total_amount)}
													</TableCell>
													<TableCell>
														<span className={getStatusColor(order.status)}>
															{getStatusDisplay(order.status)}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																// Navigate to order detail or confirmation page
																navigate('/order-confirmation', {
																	state: { orderId: order.id }
																});
															}}
														>
															<Eye className="mr-2 h-4 w-4" />
															View
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						) : (
							<div className="text-center py-16">
								<Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h2 className="text-2xl font-bold mb-2">No orders yet</h2>
								<p className="text-muted-foreground mb-6">
									Start shopping to see your orders here
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

export default OrderHistory;

