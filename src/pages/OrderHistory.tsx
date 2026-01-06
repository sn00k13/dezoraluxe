import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
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
import { Package, Eye } from 'lucide-react';

interface Order {
	id: string;
	date: string;
	status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled';
	items: number;
	total: number;
}

const orders: Order[] = [
	{
		id: 'ORD-2024-001',
		date: '2024-01-15',
		status: 'Delivered',
		items: 2,
		total: 3398,
	},
	{
		id: 'ORD-2024-002',
		date: '2024-01-10',
		status: 'Delivered',
		items: 1,
		total: 899,
	},
	{
		id: 'ORD-2024-003',
		date: '2024-01-05',
		status: 'Shipped',
		items: 3,
		total: 1377,
	},
	{
		id: 'ORD-2024-004',
		date: '2024-01-01',
		status: 'Processing',
		items: 1,
		total: 549,
	},
];

const OrderHistory = () => {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Delivered':
				return 'text-green-500';
			case 'Shipped':
				return 'text-blue-500';
			case 'Processing':
				return 'text-yellow-500';
			case 'Cancelled':
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
						{orders.length > 0 ? (
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
														{order.id}
													</TableCell>
													<TableCell>{formatDate(order.date)}</TableCell>
													<TableCell>{order.items}</TableCell>
													<TableCell className="font-semibold">
														{formatPrice(order.total)}
													</TableCell>
													<TableCell>
														<span className={getStatusColor(order.status)}>
															{order.status}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="sm"
															asChild
														>
															<Link to={`/orders/${order.id}`}>
																<Eye className="mr-2 h-4 w-4" />
																View
															</Link>
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

