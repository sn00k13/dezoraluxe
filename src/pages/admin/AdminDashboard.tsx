import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	Users,
	Settings,
	LogOut,
	TrendingUp,
	DollarSign,
	Package2,
	UserPlus,
	ArrowUpRight,
	ArrowDownRight,
	Edit,
	Trash2,
	Plus,
} from 'lucide-react';

const AdminDashboard = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('overview');

	useEffect(() => {
		// Check if admin is authenticated
		const isAuthenticated = localStorage.getItem('adminAuthenticated');
		if (!isAuthenticated) {
			navigate('/admin/login');
		}
	}, [navigate]);

	const handleLogout = () => {
		localStorage.removeItem('adminAuthenticated');
		navigate('/admin/login');
	};

	// Mock data
	const stats = {
		totalRevenue: 125430,
		totalOrders: 342,
		totalProducts: 156,
		totalUsers: 2847,
		revenueChange: 12.5,
		ordersChange: 8.3,
		productsChange: 5.2,
		usersChange: 15.7,
	};

	const recentOrders = [
		{ id: 'ORD-001', customer: 'John Doe', amount: 2499, status: 'Delivered', date: '2024-01-15' },
		{ id: 'ORD-002', customer: 'Jane Smith', amount: 899, status: 'Processing', date: '2024-01-14' },
		{ id: 'ORD-003', customer: 'Bob Johnson', amount: 549, status: 'Shipped', date: '2024-01-13' },
		{ id: 'ORD-004', customer: 'Alice Brown', amount: 329, status: 'Delivered', date: '2024-01-12' },
	];

	const products = [
		{ id: 1, name: 'Signature Timepiece', category: 'Watches', price: 2499, stock: 45 },
		{ id: 2, name: 'Executive Tote', category: 'Bags', price: 899, stock: 32 },
		{ id: 3, name: 'Studio Pro Max', category: 'Audio', price: 549, stock: 28 },
		{ id: 4, name: 'Aviator Classic', category: 'Eyewear', price: 329, stock: 67 },
	];

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const sidebarItems = [
		{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ id: 'products', label: 'Products', icon: Package },
		{ id: 'orders', label: 'Orders', icon: ShoppingCart },
		{ id: 'users', label: 'Users', icon: Users },
		{ id: 'settings', label: 'Settings', icon: Settings },
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Sidebar */}
			<div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6">
				<div className="flex flex-col h-full">
					<div className="mb-8">
						<h1 className="text-2xl font-bold text-gradient-gold mb-2">
							Dezora Luxe
						</h1>
						<p className="text-xs text-muted-foreground">Admin Dashboard</p>
					</div>

					<nav className="flex-1 space-y-2">
						{sidebarItems.map((item) => {
							const Icon = item.icon;
							return (
								<button
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
										activeTab === item.id
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
									}`}
								>
									<Icon className="h-5 w-5" />
									<span className="font-medium">{item.label}</span>
								</button>
							);
						})}
					</nav>

					<Button
						variant="outline"
						className="w-full justify-start"
						onClick={handleLogout}
					>
						<LogOut className="mr-2 h-4 w-4" />
						Logout
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="ml-64 p-8">
				{activeTab === 'overview' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
							<p className="text-muted-foreground">
								Welcome back! Here's what's happening with your store today.
							</p>
						</div>

						{/* Stats Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Total Revenue
									</CardTitle>
									<DollarSign className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
									<div className="flex items-center gap-1 text-xs text-green-500 mt-1">
										<ArrowUpRight className="h-3 w-3" />
										{stats.revenueChange}% from last month
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Total Orders
									</CardTitle>
									<ShoppingCart className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{stats.totalOrders}</div>
									<div className="flex items-center gap-1 text-xs text-green-500 mt-1">
										<ArrowUpRight className="h-3 w-3" />
										{stats.ordersChange}% from last month
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Total Products
									</CardTitle>
									<Package2 className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{stats.totalProducts}</div>
									<div className="flex items-center gap-1 text-xs text-green-500 mt-1">
										<ArrowUpRight className="h-3 w-3" />
										{stats.productsChange}% from last month
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Total Users
									</CardTitle>
									<UserPlus className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{stats.totalUsers}</div>
									<div className="flex items-center gap-1 text-xs text-green-500 mt-1">
										<ArrowUpRight className="h-3 w-3" />
										{stats.usersChange}% from last month
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Recent Orders */}
						<Card className="border-border">
							<CardHeader>
								<CardTitle>Recent Orders</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Order ID</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{recentOrders.map((order) => (
											<TableRow key={order.id}>
												<TableCell className="font-medium">{order.id}</TableCell>
												<TableCell>{order.customer}</TableCell>
												<TableCell>{formatPrice(order.amount)}</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded-full text-xs ${
															order.status === 'Delivered'
																? 'bg-green-500/20 text-green-500'
																: order.status === 'Shipped'
																? 'bg-blue-500/20 text-blue-500'
																: 'bg-yellow-500/20 text-yellow-500'
														}`}
													>
														{order.status}
													</span>
												</TableCell>
												<TableCell>{order.date}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'products' && (
					<div className="space-y-8">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-3xl font-bold mb-2">Products</h2>
								<p className="text-muted-foreground">
									Manage your product catalog
								</p>
							</div>
							<Button variant="hero">
								<Plus className="mr-2 h-4 w-4" />
								Add Product
							</Button>
						</div>

						<Card className="border-border">
							<CardContent className="p-0">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.map((product) => (
											<TableRow key={product.id}>
												<TableCell className="font-medium">{product.id}</TableCell>
												<TableCell>{product.name}</TableCell>
												<TableCell>{product.category}</TableCell>
												<TableCell>{formatPrice(product.price)}</TableCell>
												<TableCell>{product.stock}</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button variant="ghost" size="icon">
															<Edit className="h-4 w-4" />
														</Button>
														<Button variant="ghost" size="icon" className="text-destructive">
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'orders' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-3xl font-bold mb-2">Orders</h2>
							<p className="text-muted-foreground">
								View and manage customer orders
							</p>
						</div>

						<Card className="border-border">
							<CardContent className="p-0">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Order ID</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Date</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{recentOrders.map((order) => (
											<TableRow key={order.id}>
												<TableCell className="font-medium">{order.id}</TableCell>
												<TableCell>{order.customer}</TableCell>
												<TableCell>{formatPrice(order.amount)}</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded-full text-xs ${
															order.status === 'Delivered'
																? 'bg-green-500/20 text-green-500'
																: order.status === 'Shipped'
																? 'bg-blue-500/20 text-blue-500'
																: 'bg-yellow-500/20 text-yellow-500'
														}`}
													>
														{order.status}
													</span>
												</TableCell>
												<TableCell>{order.date}</TableCell>
												<TableCell className="text-right">
													<Button variant="ghost" size="sm">
														View
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'users' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-3xl font-bold mb-2">Users</h2>
							<p className="text-muted-foreground">
								Manage user accounts
							</p>
						</div>

						<Card className="border-border">
							<CardContent className="p-6">
								<p className="text-muted-foreground">
									User management features coming soon...
								</p>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'settings' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-3xl font-bold mb-2">Settings</h2>
							<p className="text-muted-foreground">
								Configure store settings
							</p>
						</div>

						<Card className="border-border">
							<CardContent className="p-6">
								<p className="text-muted-foreground">
									Settings configuration coming soon...
								</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminDashboard;

