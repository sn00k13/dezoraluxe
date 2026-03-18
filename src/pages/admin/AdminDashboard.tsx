import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/seperator';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	BarChart3,
	Download,
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
	Mail,
	Loader2,
	Bell,
	Save,
	Globe,
	Palette,
	Shield,
	Database,
	Eye,
	X,
	Menu,
	TicketPercent,
	RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { signOutAndClearSession } from '@/lib/auth';
import { toast } from 'sonner';
import {
	checkAdminStatus,
	getAdminRole,
	makeUserAdmin,
	removeAdminRole,
} from '@/lib/admin';
import AddProductModal from '@/components/admin/AddProductModal';
import EditProductModal from '@/components/admin/EditProductModal';
import AddUserModal from '@/components/admin/AddUserModal';
import DiscountCodesManager from '@/components/admin/DiscountCodesManager';
import {
	saveSettings,
	loadSettings,
	getSiteUnderConstruction,
	formatDate,
	formatCurrency,
	getItemsPerPage,
	showNotification,
	showBrowserNotificationIfEnabled,
	isNotificationEnabled,
} from '@/lib/settings';
import {
	requestNotificationPermission,
	canShowNotifications,
} from '@/lib/notifications';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import type { Product, Order, Subscriber, OrderItem, AnalyticsEvent } from '@/types/database';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';

const ORDER_STATUSES: Order['status'][] = [
	'pending',
	'processing',
	'shipped',
	'delivered',
	'cancelled',
];

const getStatusBadgeClass = (status: Order['status']) => {
	switch (status) {
		case 'delivered':
			return 'bg-green-500/20 text-green-500';
		case 'shipped':
			return 'bg-blue-500/20 text-blue-500';
		case 'processing':
			return 'bg-yellow-500/20 text-yellow-500';
		case 'cancelled':
			return 'bg-red-500/20 text-red-500';
		default:
			return 'bg-gray-500/20 text-gray-500';
	}
};

const AdminDashboard = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('overview');
	const [loading, setLoading] = useState(true);
	const [isAddProductOpen, setIsAddProductOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isEditProductOpen, setIsEditProductOpen] = useState(false);

	// Apply session timeout
	useSessionTimeout();

	// Load settings on mount
	const [settings, setSettings] = useState(() => loadSettings());

	// Get system information
	const systemInfo = useSystemInfo();
	const [settingsLoading, setSettingsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [notificationPermission, setNotificationPermission] =
		useState<NotificationPermission>(
			typeof window !== 'undefined' && 'Notification' in window
				? Notification.permission
				: 'denied'
		);
	const [stats, setStats] = useState({
		totalRevenue: 0,
		totalOrders: 0,
		totalProducts: 0,
		totalUsers: 0,
		revenueChange: 0,
		ordersChange: 0,
		productsChange: 0,
		usersChange: 0,
	});
	const [products, setProducts] = useState<Product[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);
	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [users, setUsers] = useState<
		Array<{
			id: string;
			email?: string;
			full_name: string | null;
			phone: string | null;
			avatar_url: string | null;
			created_at: string;
			updated_at: string | null;
			admin_role?: string | null;
		}>
	>([]);
	const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
	const [adminActionsLoading, setAdminActionsLoading] = useState<
		Record<string, boolean>
	>({});
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [orderItems, setOrderItems] = useState<
		Array<OrderItem & { product?: Product }>
	>([]);
	const [analyticsProducts, setAnalyticsProducts] = useState<Product[]>([]);
	const [analyticsOrders, setAnalyticsOrders] = useState<Order[]>([]);
	const [analyticsOrderItems, setAnalyticsOrderItems] = useState<OrderItem[]>([]);
	const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
	const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
	const [loadingOrderItems, setLoadingOrderItems] = useState(false);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [isRefreshingStats, setIsRefreshingStats] = useState(false);
	const [analyticsDatePreset, setAnalyticsDatePreset] = useState<
		'today' | '7d' | '30d' | 'custom'
	>('30d');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');
	const [reorderPoint, setReorderPoint] = useState(10);
	const [targetStockLevel, setTargetStockLevel] = useState(30);
	const [slowMovingThreshold, setSlowMovingThreshold] = useState(2);
	const [paymentFeeRate, setPaymentFeeRate] = useState(1.5);
	const [shippingCostPerOrder, setShippingCostPerOrder] = useState(0);
	const [averageDiscountRate, setAverageDiscountRate] = useState(0);
	const [refundLossRate, setRefundLossRate] = useState(100);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		open: boolean;
		type: 'product' | 'subscriber' | 'order' | 'user' | null;
		id: string | null;
		order: Order | null;
		user: { id: string; email?: string; full_name: string | null } | null;
		confirmText: string;
	}>({
		open: false,
		type: null,
		id: null,
		order: null,
		user: null,
		confirmText: '',
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<{
		id: string;
		email?: string;
		full_name: string | null;
		phone: string | null;
		avatar_url: string | null;
		created_at: string;
		updated_at: string | null;
		admin_role?: string | null;
	} | null>(null);
	const [isUserModalOpen, setIsUserModalOpen] = useState(false);

	useEffect(() => {
		const verifyAdminAccess = async () => {
			// Check if user is signed in
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				navigate('/admin/login');
				return;
			}

			// Check if user has admin privileges
			const isAdmin = await checkAdminStatus();

			if (!isAdmin) {
				toast.error('Access denied. Admin privileges required.');
				await signOutAndClearSession();
				navigate('/admin/login');
				return;
			}

			// Get current user's admin role
			const role = await getAdminRole();
			setCurrentUserRole(role);

			// Verify localStorage flag (for backward compatibility)
			const isAuthenticated = localStorage.getItem('adminAuthenticated');
			if (!isAuthenticated) {
				localStorage.setItem('adminAuthenticated', 'true');
			}

			// Load saved settings (site_under_construction from Supabase for cross-device sync)
			const savedSettings = loadSettings();
			const siteUnderConstruction = await getSiteUnderConstruction();
			setSettings({
				...savedSettings,
				display: {
					...savedSettings.display,
					siteUnderConstruction,
				},
			});

			// Load data when component mounts
			loadDashboardData();
		};

		verifyAdminAccess();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate]);

	useEffect(() => {
		// Reload data when tab changes
		if (activeTab === 'products') {
			loadProducts();
		} else if (activeTab === 'orders') {
			loadOrders();
		} else if (activeTab === 'users') {
			loadUsers();
		} else if (activeTab === 'subscribers') {
			loadSubscribers();
		} else if (activeTab === 'analytics') {
			loadAnalyticsData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	const loadDashboardData = async () => {
		setLoading(true);
		try {
			await Promise.all([
				loadStats(),
				loadProducts(),
				loadOrders(),
				loadSubscribers(),
				loadUsers(),
			]);
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			toast.error('Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			// Get total revenue from orders
			const { data: ordersData, error: ordersError } = await supabase
				.from('orders')
				.select('total_amount, created_at');

			if (ordersError) throw ordersError;

			const totalRevenue =
				ordersData?.reduce(
					(sum, order) => sum + Number(order.total_amount),
					0
				) || 0;

			// Get total orders count
			const { count: ordersCount } = await supabase
				.from('orders')
				.select('*', { count: 'exact', head: true });

			// Get total products count
			const { count: productsCount } = await supabase
				.from('products')
				.select('*', { count: 'exact', head: true });

			// Get total users count
			const { count: usersCount } = await supabase
				.from('user_profiles')
				.select('*', { count: 'exact', head: true });

			// Calculate changes (simplified - you can enhance this with date comparisons)
			setStats({
				totalRevenue,
				totalOrders: ordersCount || 0,
				totalProducts: productsCount || 0,
				totalUsers: usersCount || 0,
				revenueChange: 12.5, // TODO: Calculate from previous period
				ordersChange: 8.3,
				productsChange: 5.2,
				usersChange: 15.7,
			});
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	const handleRefreshStats = async () => {
		setIsRefreshingStats(true);
		try {
			await loadStats();
			toast.success('Dashboard stats refreshed');
		} finally {
			setIsRefreshingStats(false);
		}
	};

	const loadProducts = async () => {
		try {
			const itemsPerPage = getItemsPerPage();
			const { data, error } = await supabase
				.from('products')
				.select('*')
				.order('created_at', { ascending: false })
				.range(
					(currentPage - 1) * itemsPerPage,
					currentPage * itemsPerPage - 1
				);

			if (error) throw error;
			setProducts(data || []);

			// Check for low stock and notify if enabled
			if (data) {
				const lowStockProducts = data.filter((p: Product) => p.stock < 10);
				if (lowStockProducts.length > 0 && isNotificationEnabled('lowStock')) {
					const message = `${lowStockProducts.length} product(s) are running low on stock`;
					showNotification('lowStock', message, toast);
					await showBrowserNotificationIfEnabled(
						'lowStock',
						'Low Stock Alert',
						message,
						settings,
						toast
					);
				}
			}
		} catch (error) {
			console.error('Error loading products:', error);
			toast.error('Failed to load products');
		}
	};

	const loadOrders = async () => {
		try {
			const itemsPerPage = getItemsPerPage();
			const { data, error } = await supabase
				.from('orders')
				.select('*')
				.order('created_at', { ascending: false })
				.range(
					(currentPage - 1) * itemsPerPage,
					currentPage * itemsPerPage - 1
				);

			if (error) throw error;

			// Notify about new orders if enabled
			if (data && data.length > 0 && isNotificationEnabled('newOrders')) {
				const newOrders = data.filter((order: Order) => {
					const orderDate = new Date(order.created_at);
					const hoursSinceOrder =
						(new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60);
					return hoursSinceOrder < 24; // Orders from last 24 hours
				});
				if (newOrders.length > 0) {
					const message = `${newOrders.length} new order(s) in the last 24 hours`;
					showNotification('newOrders', message, toast);
					await showBrowserNotificationIfEnabled(
						'newOrders',
						'New Orders',
						message,
						settings,
						toast
					);
				}
			}

			setOrders(data || []);
		} catch (error) {
			console.error('Error loading orders:', error);
			toast.error('Failed to load orders');
		}
	};

	const loadSubscribers = async () => {
		try {
			const { data, error } = await supabase
				.from('subscribers')
				.select('*')
				.order('subscribed_at', { ascending: false });

			if (error) throw error;
			setSubscribers(data || []);
		} catch (error) {
			console.error('Error loading subscribers:', error);
			toast.error('Failed to load subscribers');
		}
	};

	const loadAnalyticsData = async () => {
		setAnalyticsLoading(true);
		try {
			const [{ data: productsData, error: productsError }, { data: ordersData, error: ordersError }, { data: orderItemsData, error: orderItemsError }, { data: eventsData, error: eventsError }] =
				await Promise.all([
					supabase.from('products').select('*'),
					supabase.from('orders').select('*'),
					supabase.from('order_items').select('*'),
					supabase.from('analytics_events').select('*'),
				]);

			if (productsError) throw productsError;
			if (ordersError) throw ordersError;
			if (orderItemsError) throw orderItemsError;

			setAnalyticsProducts((productsData || []) as Product[]);
			setAnalyticsOrders((ordersData || []) as Order[]);
			setAnalyticsOrderItems((orderItemsData || []) as OrderItem[]);
			if (eventsError) {
				console.warn('analytics_events not available:', eventsError.message);
				setAnalyticsEvents([]);
			} else {
				setAnalyticsEvents((eventsData || []) as AnalyticsEvent[]);
			}
		} catch (error) {
			console.error('Error loading analytics data:', error);
			toast.error('Failed to load analytics data');
			setAnalyticsProducts([]);
			setAnalyticsOrders([]);
			setAnalyticsOrderItems([]);
			setAnalyticsEvents([]);
		} finally {
			setAnalyticsLoading(false);
		}
	};

	const loadUsers = async () => {
		// Notify about new users if enabled
		if (isNotificationEnabled('newUsers')) {
			// This would check for new users in the last 24 hours
		}
		try {
			// Load admin roles for all users
			const { data: adminRolesData } = await supabase
				.from('admin_roles')
				.select('user_id, role');

			const adminRolesMap = new Map<string, string>();
			adminRolesData?.forEach((ar) => {
				adminRolesMap.set(ar.user_id, ar.role);
			});

			// Try to use the database function first (if created)
			try {
				const { data: authUsersData, error: authError } = await supabase.rpc(
					'get_all_users'
				);

				if (!authError && authUsersData && authUsersData.length > 0) {
					setUsers(
						authUsersData.map(
							(user: {
								id: string;
								email?: string;
								full_name: string | null;
								phone: string | null;
								avatar_url: string | null;
								created_at: string;
								updated_at: string | null;
							}) => ({
								id: user.id,
								email: user.email || 'N/A',
								full_name: user.full_name,
								phone: user.phone,
								avatar_url: user.avatar_url,
								created_at: user.created_at,
								updated_at: user.updated_at,
								admin_role: adminRolesMap.get(user.id) || null,
							})
						)
					);
					return;
				}
			} catch (rpcError) {
				console.log('RPC function not available, trying alternative method');
			}

			// Fallback: Try to use the view
			try {
				const { data: viewData, error: viewError } = await supabase
					.from('admin_users_view')
					.select('*')
					.order('created_at', { ascending: false });

				if (!viewError && viewData && viewData.length > 0) {
					setUsers(
						viewData.map(
							(user: {
								id: string;
								email?: string;
								full_name: string | null;
								phone: string | null;
								avatar_url: string | null;
								created_at: string;
								updated_at: string | null;
								role?: string;
							}) => ({
								id: user.id,
								email: user.email || 'N/A',
								full_name: user.full_name,
								phone: user.phone,
								avatar_url: user.avatar_url,
								created_at: user.created_at,
								updated_at: user.updated_at,
								admin_role: user.role || adminRolesMap.get(user.id) || null,
							})
						)
					);
					return;
				}
			} catch (viewError) {
				console.log('View not available, using user_profiles only');
			}

			// Final fallback: Use user_profiles table
			// Note: This will only show users who have profiles created
			// Make sure user_profiles are created for all users (see AuthContext.tsx)
			const { data: profilesData, error: profilesError } = await supabase
				.from('user_profiles')
				.select('*')
				.order('created_at', { ascending: false });

			if (profilesError) {
				throw profilesError;
			}

			// Get emails from auth.users by checking each profile
			// This is a workaround - ideally use the function or view above
			const usersWithEmail =
				profilesData?.map((profile) => ({
					...profile,
					email: 'Check auth.users', // Email not available without function/view
					admin_role: adminRolesMap.get(profile.id) || null,
				})) || [];

			setUsers(usersWithEmail);

			if (usersWithEmail.length === 0) {
				toast.info(
					'No users found. Run the SQL function in SUPABASE_USERS_FUNCTION.sql to see all auth users.'
				);
			}
		} catch (error) {
			console.error('Error loading users:', error);
			toast.error(
				'Failed to load users. Run SUPABASE_USERS_FUNCTION.sql in your Supabase SQL Editor to enable full user listing.'
			);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		try {
			const { error } = await supabase
				.from('products')
				.delete()
				.eq('id', productId);

			if (error) throw error;

			toast.success('Product deleted successfully');
			loadProducts();
			loadStats();
		} catch (error) {
			console.error('Error deleting product:', error);
			toast.error('Failed to delete product');
		}
	};

	const handleDeleteSubscriber = async (subscriberId: string) => {
		try {
			const { error } = await supabase
				.from('subscribers')
				.delete()
				.eq('id', subscriberId);

			if (error) throw error;

			toast.success('Subscriber deleted successfully');
			loadSubscribers();
		} catch (error) {
			console.error('Error deleting subscriber:', error);
			toast.error('Failed to delete subscriber');
		}
	};

	const handleDeleteOrder = async (orderId: string) => {
		try {
			// Try RPC first (requires migration). Fall back to direct delete if RPC doesn't exist.
			const { data, error } = await supabase.rpc('admin_delete_order', {
				p_order_id: orderId,
			});

			if (error) {
				// PGRST202 = function not found (migration not applied)
				if (error.code === 'PGRST202') {
					// Fallback: direct delete (requires RLS to allow admin deletes)
					const { error: itemsError } = await supabase
						.from('order_items')
						.delete()
						.eq('order_id', orderId);
					if (itemsError) throw itemsError;

					const { error: orderError } = await supabase
						.from('orders')
						.delete()
						.eq('id', orderId);
					if (orderError) throw orderError;
				} else {
					throw error;
				}
			} else {
				const result = data as { success: boolean; error?: string } | null;
				if (result && !result.success) {
					throw new Error(result.error || 'Failed to delete order');
				}
			}

			toast.success('Order deleted successfully');
			loadOrders();
			loadStats();
			if (selectedOrder?.id === orderId) {
				setIsOrderModalOpen(false);
				setSelectedOrder(null);
			}
		} catch (error) {
			console.error('Error deleting order:', error);
			toast.error('Failed to delete order');
		}
	};

	const handleDeleteUser = async (userId: string) => {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.user?.id === userId) {
				toast.error('You cannot delete your own account');
				return;
			}

			const { error: rolesError } = await supabase
				.from('admin_roles')
				.delete()
				.eq('user_id', userId);

			if (rolesError) throw rolesError;

			const { error: profileError } = await supabase
				.from('user_profiles')
				.delete()
				.eq('id', userId);

			if (profileError) throw profileError;

			toast.success('User removed successfully');
			loadUsers();
			if (selectedUser?.id === userId) {
				setIsUserModalOpen(false);
				setSelectedUser(null);
			}
		} catch (error) {
			console.error('Error deleting user:', error);
			toast.error('Failed to delete user');
		}
	};

	const executeDeleteConfirm = async () => {
		if (!deleteConfirm.id || !deleteConfirm.type) return;
		const { type, id } = deleteConfirm;
		setDeleteConfirm({ open: false, type: null, id: null, order: null, user: null, confirmText: '' });
		if (type === 'product') await handleDeleteProduct(id);
		else if (type === 'subscriber') await handleDeleteSubscriber(id);
		else if (type === 'order') await handleDeleteOrder(id);
		else if (type === 'user') await handleDeleteUser(id);
	};

	const handleMakeAdmin = async (
		userId: string,
		role: 'admin' | 'super_admin' = 'admin'
	) => {
		if (!confirm(`Are you sure you want to make this user a ${role}?`)) return;

		setAdminActionsLoading((prev) => ({ ...prev, [userId]: true }));
		try {
			const result = await makeUserAdmin(userId, role);
			if (result.success) {
				toast.success(`User has been made a ${role}`);
				loadUsers();
			} else {
				toast.error(result.error || 'Failed to make user admin');
			}
		} catch (error) {
			console.error('Error making user admin:', error);
			toast.error('Failed to make user admin');
		} finally {
			setAdminActionsLoading((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const handleRemoveAdmin = async (userId: string) => {
		if (
			!confirm(
				'Are you sure you want to remove admin privileges from this user?'
			)
		)
			return;

		setAdminActionsLoading((prev) => ({ ...prev, [userId]: true }));
		try {
			const result = await removeAdminRole(userId);
			if (result.success) {
				toast.success('Admin privileges removed');
				loadUsers();
			} else {
				toast.error(result.error || 'Failed to remove admin role');
			}
		} catch (error) {
			console.error('Error removing admin role:', error);
			toast.error('Failed to remove admin role');
		} finally {
			setAdminActionsLoading((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const handleUpdateOrderStatus = async (
		orderId: string,
		newStatus: Order['status']
	) => {
		try {
			const { error } = await supabase
				.from('orders')
				.update({ status: newStatus, updated_at: new Date().toISOString() })
				.eq('id', orderId);

			if (error) throw error;

			toast.success('Order status updated');
			loadOrders();
			loadStats();
			if (selectedOrder?.id === orderId) {
				setSelectedOrder((prev) =>
					prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null
				);
			}
		} catch (error) {
			console.error('Error updating order status:', error);
			toast.error('Failed to update order status');
		}
	};

	const loadOrderItems = async (orderId: string) => {
		setLoadingOrderItems(true);
		try {
			// Fetch order items with product details
			const { data: itemsData, error: itemsError } = await supabase
				.from('order_items')
				.select('*')
				.eq('order_id', orderId);

			if (itemsError) throw itemsError;

			// Fetch product details for each item
			const itemsWithProducts = await Promise.all(
				(itemsData || []).map(async (item) => {
					const { data: productData, error: productError } = await supabase
						.from('products')
						.select('*')
						.eq('id', item.product_id)
						.single();

					if (productError) {
						console.error('Error loading product:', productError);
					}

					return {
						...item,
						product: productData || undefined,
					};
				})
			);

			setOrderItems(itemsWithProducts);
		} catch (error) {
			console.error('Error loading order items:', error);
			toast.error('Failed to load order items');
			setOrderItems([]);
		} finally {
			setLoadingOrderItems(false);
		}
	};

	const handleViewOrder = async (order: Order) => {
		setSelectedOrder(order);
		setIsOrderModalOpen(true);
		await loadOrderItems(order.id);
	};

	const handleSaveSettings = async () => {
		setSettingsLoading(true);
		try {
			const success = await saveSettings(settings);
			if (success) {
				toast.success('Settings saved successfully');
				// Reload page to apply settings (or just reload data)
				window.location.reload();
			} else {
				toast.error('Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('Failed to save settings');
		} finally {
			setSettingsLoading(false);
		}
	};

	const handleLogout = async () => {
		await signOutAndClearSession();
		toast.success('Logged out successfully');
		navigate('/admin/login');
	};

	// Get customer name from order shipping address
	const getCustomerName = (order: Order) => {
		if (
			typeof order.shipping_address === 'object' &&
			order.shipping_address?.name
		) {
			return order.shipping_address.name;
		}
		return 'Unknown Customer';
	};

	const getCustomerEmail = (order: Order) => {
		return (
			order.customer_email ||
			order.discount_customer_email ||
			(order.user_id ? 'Registered user (email unavailable)' : 'Guest email unavailable')
		);
	};

	const getCustomerPhone = (order: Order) => {
		return order.customer_phone || order.discount_customer_phone || 'N/A';
	};

	const formatPrice = (price: number) => {
		return formatCurrency(price, settings.store.currency);
	};

	const analyticsRange = useMemo(() => {
		const now = new Date();
		const end = new Date(now);
		end.setHours(23, 59, 59, 999);

		if (analyticsDatePreset === 'today') {
			const start = new Date(now);
			start.setHours(0, 0, 0, 0);
			return { start, end };
		}

		if (analyticsDatePreset === '7d' || analyticsDatePreset === '30d') {
			const days = analyticsDatePreset === '7d' ? 7 : 30;
			const start = new Date(now);
			start.setDate(start.getDate() - (days - 1));
			start.setHours(0, 0, 0, 0);
			return { start, end };
		}

		if (analyticsDatePreset === 'custom' && customStartDate && customEndDate) {
			const start = new Date(`${customStartDate}T00:00:00`);
			const customEnd = new Date(`${customEndDate}T23:59:59.999`);
			return { start, end: customEnd };
		}

		const fallbackStart = new Date(now);
		fallbackStart.setDate(fallbackStart.getDate() - 29);
		fallbackStart.setHours(0, 0, 0, 0);
		return { start: fallbackStart, end };
	}, [analyticsDatePreset, customStartDate, customEndDate]);

	const analytics = useMemo(() => {
		const isWithinRange = (timestamp: string, start: Date, end: Date) => {
			const date = new Date(timestamp);
			return date >= start && date <= end;
		};

		const productsForAnalytics = analyticsProducts.length > 0 ? analyticsProducts : products;
		const ordersForAnalytics = analyticsOrders.length > 0 ? analyticsOrders : orders;
		const rangeOrders = ordersForAnalytics.filter((order) =>
			isWithinRange(order.created_at, analyticsRange.start, analyticsRange.end)
		);
		const validOrders = rangeOrders.filter((order) => order.status !== 'cancelled');
		const refundedOrders = rangeOrders.filter((order) => order.status === 'cancelled');
		const validOrderIds = new Set(validOrders.map((order) => order.id));
		const productById = new Map(
			productsForAnalytics.map((product) => [product.id, product])
		);
		const orderDateById = new Map(
			ordersForAnalytics.map((order) => [order.id, order.created_at])
		);
		const filteredItems = analyticsOrderItems.filter((item) => {
			const orderDate = orderDateById.get(item.order_id);
			return (
				typeof orderDate === 'string' &&
				isWithinRange(orderDate, analyticsRange.start, analyticsRange.end)
			);
		});

		let salesRevenue = 0;
		let estimatedCogs = 0;
		let totalUnitsSold = 0;

		const productPerformance = new Map<
			string,
			{
				productId: string;
				name: string;
				category: string;
				collection: string;
				unitsSold: number;
				revenue: number;
				cogs: number;
				profit: number;
				stock: number;
			}
		>();
		const categoryPerformance = new Map<
			string,
			{ category: string; revenue: number; cogs: number; profit: number; unitsSold: number }
		>();
		const collectionPerformance = new Map<
			string,
			{ collection: string; revenue: number; cogs: number; profit: number; unitsSold: number }
		>();

		for (const item of filteredItems) {
			if (!validOrderIds.has(item.order_id)) continue;

			const quantity = Number(item.quantity) || 0;
			if (quantity <= 0) continue;

			const lineRevenue = (Number(item.price) || 0) * quantity;
			const product = productById.get(item.product_id);
			const unitCost = Number(product?.cost_price ?? 0);
			const lineCogs = unitCost * quantity;
			const category = product?.category || 'Uncategorized';
			const collection = product?.collection || 'Unassigned';

			totalUnitsSold += quantity;
			salesRevenue += lineRevenue;
			estimatedCogs += lineCogs;

			const current = productPerformance.get(item.product_id) ?? {
				productId: item.product_id,
				name: product?.name ?? 'Deleted product',
				category,
				collection,
				unitsSold: 0,
				revenue: 0,
				cogs: 0,
				profit: 0,
				stock: Number(product?.stock ?? 0),
			};

			current.unitsSold += quantity;
			current.revenue += lineRevenue;
			current.cogs += lineCogs;
			current.profit = current.revenue - current.cogs;
			productPerformance.set(item.product_id, current);

			const categoryRow = categoryPerformance.get(category) ?? {
				category,
				revenue: 0,
				cogs: 0,
				profit: 0,
				unitsSold: 0,
			};
			categoryRow.revenue += lineRevenue;
			categoryRow.cogs += lineCogs;
			categoryRow.unitsSold += quantity;
			categoryRow.profit = categoryRow.revenue - categoryRow.cogs;
			categoryPerformance.set(category, categoryRow);

			const collectionRow = collectionPerformance.get(collection) ?? {
				collection,
				revenue: 0,
				cogs: 0,
				profit: 0,
				unitsSold: 0,
			};
			collectionRow.revenue += lineRevenue;
			collectionRow.cogs += lineCogs;
			collectionRow.unitsSold += quantity;
			collectionRow.profit = collectionRow.revenue - collectionRow.cogs;
			collectionPerformance.set(collection, collectionRow);
		}

		const totalStockUnits = productsForAnalytics.reduce(
			(sum, product) => sum + (Number(product.stock) || 0),
			0
		);
		const outOfStockCount = productsForAnalytics.filter(
			(product) => Number(product.stock) === 0
		).length;
		const lowStockCount = productsForAnalytics.filter(
			(product) =>
				Number(product.stock) > 0 && Number(product.stock) <= Number(reorderPoint)
		).length;

		const inventoryCostValue = productsForAnalytics.reduce((sum, product) => {
			const stock = Number(product.stock) || 0;
			const cost = Number(product.cost_price ?? 0);
			return sum + stock * cost;
		}, 0);

		const inventorySellingValue = productsForAnalytics.reduce((sum, product) => {
			const stock = Number(product.stock) || 0;
			const sellingPrice = Number(product.selling_price ?? product.price ?? 0);
			return sum + stock * sellingPrice;
		}, 0);

		const grossProfit = salesRevenue - estimatedCogs;
		const estimatedTransactionFees = salesRevenue * (Number(paymentFeeRate) / 100);
		const estimatedDiscountAmount = salesRevenue * (Number(averageDiscountRate) / 100);
		const estimatedShippingCost =
			validOrders.length * Number(shippingCostPerOrder || 0);
		const refundedAmount = refundedOrders.reduce(
			(sum, order) => sum + (Number(order.total_amount) || 0),
			0
		);
		const refundImpactAmount = refundedAmount * (Number(refundLossRate) / 100);
		const netProfit =
			grossProfit -
			estimatedTransactionFees -
			estimatedDiscountAmount -
			estimatedShippingCost -
			refundImpactAmount;
		const profitMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;
		const netProfitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;
		const avgOrderValue =
			validOrders.length > 0
				? validOrders.reduce(
						(sum, order) => sum + (Number(order.total_amount) || 0),
						0
				  ) / validOrders.length
				: 0;

		const topProducts = Array.from(productPerformance.values())
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 8);
		const leastProfitableProducts = Array.from(productPerformance.values())
			.sort((a, b) => a.profit - b.profit)
			.slice(0, 8);
		const categoryBreakdown = Array.from(categoryPerformance.values()).sort(
			(a, b) => b.revenue - a.revenue
		);
		const collectionBreakdown = Array.from(collectionPerformance.values()).sort(
			(a, b) => b.revenue - a.revenue
		);

		const unitsByProduct = new Map<string, number>();
		for (const item of filteredItems) {
			if (!validOrderIds.has(item.order_id)) continue;
			const current = unitsByProduct.get(item.product_id) ?? 0;
			unitsByProduct.set(item.product_id, current + (Number(item.quantity) || 0));
		}
		const reorderRecommendations = productsForAnalytics
			.filter((product) => Number(product.stock) <= Number(reorderPoint))
			.map((product) => {
				const stock = Number(product.stock) || 0;
				const recommendedQty = Math.max(Number(targetStockLevel) - stock, 0);
				return {
					id: product.id,
					name: product.name,
					stock,
					recommendedQty,
					reorderCost: recommendedQty * Number(product.cost_price ?? 0),
				};
			})
			.sort((a, b) => a.stock - b.stock);

		const slowMovingProducts = productsForAnalytics
			.map((product) => ({
				id: product.id,
				name: product.name,
				stock: Number(product.stock) || 0,
				unitsSold: unitsByProduct.get(product.id) ?? 0,
			}))
			.filter(
				(product) =>
					product.stock > 0 && product.unitsSold > 0 && product.unitsSold <= Number(slowMovingThreshold)
			)
			.sort((a, b) => a.unitsSold - b.unitsSold);
		const deadStockProducts = productsForAnalytics
			.map((product) => ({
				id: product.id,
				name: product.name,
				stock: Number(product.stock) || 0,
			}))
			.filter((product) => product.stock > 0 && (unitsByProduct.get(product.id) ?? 0) === 0)
			.sort((a, b) => b.stock - a.stock);

		const periodDurationMs = Math.max(
			analyticsRange.end.getTime() - analyticsRange.start.getTime(),
			24 * 60 * 60 * 1000
		);
		const previousRangeEnd = new Date(analyticsRange.start.getTime() - 1);
		const previousRangeStart = new Date(previousRangeEnd.getTime() - periodDurationMs);
		const previousValidOrderIds = new Set(
			ordersForAnalytics
				.filter(
					(order) =>
						order.status !== 'cancelled' &&
						isWithinRange(order.created_at, previousRangeStart, previousRangeEnd)
				)
				.map((order) => order.id)
		);
		const previousRevenueByProduct = new Map<string, number>();
		for (const item of analyticsOrderItems) {
			if (!previousValidOrderIds.has(item.order_id)) continue;
			const current = previousRevenueByProduct.get(item.product_id) ?? 0;
			previousRevenueByProduct.set(
				item.product_id,
				current + (Number(item.price) || 0) * (Number(item.quantity) || 0)
			);
		}
		const trendRows = Array.from(productPerformance.values()).map((row) => {
			const previousRevenue = previousRevenueByProduct.get(row.productId) ?? 0;
			const deltaRevenue = row.revenue - previousRevenue;
			const deltaPct =
				previousRevenue > 0 ? (deltaRevenue / previousRevenue) * 100 : 100;
			return {
				...row,
				previousRevenue,
				deltaRevenue,
				deltaPct,
			};
		});
		const bestTrendProducts = trendRows
			.filter((row) => row.deltaRevenue > 0)
			.sort((a, b) => b.deltaRevenue - a.deltaRevenue)
			.slice(0, 5);
		const worstTrendProducts = trendRows
			.filter((row) => row.deltaRevenue < 0)
			.sort((a, b) => a.deltaRevenue - b.deltaRevenue)
			.slice(0, 5);

		const customerOrderMap = new Map<
			string,
			{ orders: number; revenue: number; firstOrderAt: string; orderDates: string[] }
		>();
		const nonCancelledAllOrders = ordersForAnalytics.filter(
			(order) => order.status !== 'cancelled'
		);
		for (const order of nonCancelledAllOrders) {
			const key = order.user_id || `guest:${getCustomerName(order)}`;
			const current = customerOrderMap.get(key) ?? {
				orders: 0,
				revenue: 0,
				firstOrderAt: order.created_at,
				orderDates: [],
			};
			current.orders += 1;
			current.revenue += Number(order.total_amount) || 0;
			current.orderDates.push(order.created_at);
			if (new Date(order.created_at) < new Date(current.firstOrderAt)) {
				current.firstOrderAt = order.created_at;
			}
			customerOrderMap.set(key, current);
		}
		const customersThisPeriod = new Set<string>();
		for (const order of validOrders) {
			const key = order.user_id || `guest:${getCustomerName(order)}`;
			customersThisPeriod.add(key);
		}
		let newCustomers = 0;
		let repeatCustomers = 0;
		for (const key of customersThisPeriod) {
			const stats = customerOrderMap.get(key);
			if (!stats) continue;
			if (isWithinRange(stats.firstOrderAt, analyticsRange.start, analyticsRange.end)) {
				newCustomers += 1;
			} else {
				repeatCustomers += 1;
			}
		}
		const totalCustomers = customersThisPeriod.size;
		const averageLtv =
			customerOrderMap.size > 0
				? Array.from(customerOrderMap.values()).reduce(
						(sum, row) => sum + row.revenue,
						0
				  ) / customerOrderMap.size
				: 0;
		const repeatRate =
			totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

		const cohortMap = new Map<string, { cohort: string; size: number; retained: number }>();
		for (const row of customerOrderMap.values()) {
			const cohort = row.firstOrderAt.slice(0, 7);
			const cohortRow = cohortMap.get(cohort) ?? { cohort, size: 0, retained: 0 };
			cohortRow.size += 1;

			const firstOrderDate = new Date(row.firstOrderAt);
			const firstMonthEnd = new Date(
				firstOrderDate.getFullYear(),
				firstOrderDate.getMonth() + 1,
				0,
				23,
				59,
				59,
				999
			);
			const retained = row.orderDates.some(
				(date) => new Date(date) > firstMonthEnd
			);
			if (retained) {
				cohortRow.retained += 1;
			}
			cohortMap.set(cohort, cohortRow);
		}
		const cohortRetentionRows = Array.from(cohortMap.values())
			.map((row) => ({
				...row,
				retentionRate: row.size > 0 ? (row.retained / row.size) * 100 : 0,
			}))
			.sort((a, b) => (a.cohort < b.cohort ? 1 : -1))
			.slice(0, 12);

		const eventsInRange = analyticsEvents.filter((event) =>
			isWithinRange(event.created_at, analyticsRange.start, analyticsRange.end)
		);
		const visitSessions = new Set(
			eventsInRange
				.filter((event) => event.event_name === 'visit')
				.map((event) => event.session_id)
		);
		const addToCartSessions = new Set(
			eventsInRange
				.filter((event) => event.event_name === 'add_to_cart')
				.map((event) => event.session_id)
		);
		const checkoutSessions = new Set(
			eventsInRange
				.filter((event) => event.event_name === 'checkout_started')
				.map((event) => event.session_id)
		);
		const paidOrderEvents = eventsInRange.filter(
			(event) => event.event_name === 'paid_order'
		);

		const conversionFunnel = {
			visits: visitSessions.size,
			addToCart: addToCartSessions.size,
			checkoutStarted: checkoutSessions.size || rangeOrders.length,
			paidOrders: paidOrderEvents.length || validOrders.length,
			note:
				analyticsEvents.length > 0
					? 'Funnel metrics are based on tracked live events.'
					: 'analytics_events table not detected. Run the SQL setup file to enable full funnel tracking.',
		};

		return {
			salesRevenue,
			estimatedCogs,
			grossProfit,
			netProfit,
			profitMargin,
			netProfitMargin,
			totalUnitsSold,
			avgOrderValue,
			totalStockUnits,
			outOfStockCount,
			lowStockCount,
			inventoryCostValue,
			inventorySellingValue,
			estimatedTransactionFees,
			estimatedDiscountAmount,
			estimatedShippingCost,
			refundedOrdersCount: refundedOrders.length,
			refundedAmount,
			refundImpactAmount,
			topProducts,
			leastProfitableProducts,
			categoryBreakdown,
			collectionBreakdown,
			reorderRecommendations,
			slowMovingProducts,
			deadStockProducts,
			bestTrendProducts,
			worstTrendProducts,
			totalCustomers,
			newCustomers,
			repeatCustomers,
			repeatRate,
			averageLtv,
			cohortRetentionRows,
			conversionFunnel,
		};
	}, [
		products,
		orders,
		analyticsProducts,
		analyticsOrders,
		analyticsOrderItems,
		analyticsEvents,
		analyticsRange,
		reorderPoint,
		targetStockLevel,
		slowMovingThreshold,
		paymentFeeRate,
		shippingCostPerOrder,
		averageDiscountRate,
		refundLossRate,
	]);

	const sidebarItems = [
		{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ id: 'products', label: 'Products', icon: Package },
		{ id: 'orders', label: 'Orders', icon: ShoppingCart },
		{ id: 'discounts', label: 'Discount Codes', icon: TicketPercent },
		{ id: 'analytics', label: 'Analytics', icon: BarChart3 },
		{ id: 'users', label: 'Users', icon: Users },
		{ id: 'subscribers', label: 'Subscribers', icon: Mail },
		{ id: 'settings', label: 'Settings', icon: Settings },
	];

	const currentTabLabel = sidebarItems.find((i) => i.id === activeTab)?.label ?? 'Dashboard';

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile header */}
			<header className="fixed top-0 left-0 right-0 z-40 flex md:hidden h-14 items-center gap-3 border-b border-border bg-card px-4">
				<Button
					variant="ghost"
					size="icon"
					aria-label="Open menu"
					onClick={() => setSidebarOpen(true)}
				>
					<Menu className="h-5 w-5" />
				</Button>
				<img
					src="/images/DLX.png"
					alt="Dezora Luxe"
					className="h-8 w-auto object-contain"
				/>
				<span className="text-sm font-medium text-muted-foreground truncate flex-1">
					{currentTabLabel}
				</span>
			</header>

			{/* Mobile nav sheet */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent side="left" className="w-64 p-0">
					<SheetHeader className="p-6 pb-4 text-left">
						<SheetTitle className="sr-only">Menu</SheetTitle>
					</SheetHeader>
					<div className="flex flex-col h-[calc(100%-4rem)] px-4">
						<nav className="flex-1 space-y-2">
							{sidebarItems.map((item) => {
								const Icon = item.icon;
								return (
									<button
										key={item.id}
										onClick={() => {
											setActiveTab(item.id);
											setSidebarOpen(false);
										}}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
											activeTab === item.id
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
										}`}
									>
										<Icon className="h-5 w-5 shrink-0" />
										<span className="font-medium">{item.label}</span>
									</button>
								);
							})}
						</nav>
						<Button
							variant="outline"
							className="w-full justify-start mb-6"
							onClick={() => {
								setSidebarOpen(false);
								handleLogout();
							}}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</div>
				</SheetContent>
			</Sheet>

			{/* Desktop Sidebar */}
			<div className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col bg-card border-r border-border p-6 md:flex">
				<div className="flex flex-col h-full">
					<div className="mb-8">
						<img
							src="/images/DLX.png"
							alt="Dezora Luxe"
							className="h-12 w-auto mb-2 object-contain"
						/>
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
			<div className="min-h-screen pt-14 md:pt-8 p-4 md:p-8 md:ml-64">
				{loading && activeTab === 'overview' && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				{activeTab === 'overview' && !loading && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Dashboard Overview</h2>
								<p className="text-muted-foreground text-sm sm:text-base">
									Welcome back! Here's what's happening with your store today.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={handleRefreshStats}
								disabled={isRefreshingStats}
								className="self-start"
							>
								<RefreshCw
									className={`mr-2 h-4 w-4 ${isRefreshingStats ? 'animate-spin' : ''}`}
								/>
								{isRefreshingStats ? 'Refreshing...' : 'Refresh Stats'}
							</Button>
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
									<div className="text-2xl font-bold">
										{formatPrice(stats.totalRevenue)}
									</div>
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
									<div className="text-2xl font-bold">
										{stats.totalProducts}
									</div>
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
							<CardContent className="overflow-x-auto p-0">
								<Table className="min-w-[600px]">
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
										{orders.slice(0, 10).map((order) => (
											<TableRow key={order.id}>
												<TableCell className="font-medium">
													{order.order_number}
												</TableCell>
												<TableCell>{getCustomerName(order)}</TableCell>
												<TableCell>
													{formatPrice(Number(order.total_amount))}
												</TableCell>
												<TableCell>
													<Select
														value={order.status}
														onValueChange={(v) =>
															handleUpdateOrderStatus(order.id, v as Order['status'])
														}
													>
														<SelectTrigger
															className={`h-8 w-[120px] px-2 text-xs font-medium ${
																getStatusBadgeClass(order.status)
															}`}
														>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{ORDER_STATUSES.map((s) => (
																<SelectItem key={s} value={s}>
																	{s}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell>
													{formatDate(
														order.created_at,
														settings.display.dateFormat
													)}
												</TableCell>
											</TableRow>
										))}
										{orders.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={5}
													className="text-center py-8 text-muted-foreground"
												>
													No orders found
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'products' && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Products</h2>
								<p className="text-muted-foreground text-sm sm:text-base">
									Manage your product catalog
								</p>
							</div>
							<Button variant="hero" onClick={() => setIsAddProductOpen(true)} className="w-full sm:w-auto shrink-0">
								<Plus className="mr-2 h-4 w-4" />
								Add Product
							</Button>
						</div>

						<Card className="border-border">
							<CardContent className="p-0 overflow-x-auto">
								<Table className="min-w-[640px]">
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Original Stock</TableHead>
											<TableHead>Current Stock</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={8}
													className="text-center py-8 text-muted-foreground"
												>
													No products found. Add your first product!
												</TableCell>
											</TableRow>
										) : (
											products.map((product) => (
												<TableRow key={product.id}>
													<TableCell className="font-medium">
														{product.id.slice(0, 8)}...
													</TableCell>
													<TableCell>{product.name}</TableCell>
													<TableCell>{product.category}</TableCell>
													<TableCell>
														{formatPrice(Number(product.price))}
													</TableCell>
													<TableCell>
														{product.original_stock != null
															? product.original_stock
															: '—'}
													</TableCell>
													<TableCell>{product.stock}</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																variant="ghost"
																size="icon"
																title="Edit"
																onClick={() => {
																	setEditingProduct(product);
																	setIsEditProductOpen(true);
																}}
															>
																<Edit className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive"
																onClick={() =>
																	setDeleteConfirm({
																		open: true,
																		type: 'product',
																		id: product.id,
																		order: null,
																		user: null,
																		confirmText: '',
																	})
																}
																title="Delete"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'orders' && (
					<div className="space-y-8">
						<div>
							<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Orders</h2>
							<p className="text-muted-foreground text-sm sm:text-base">
								View and manage customer orders
							</p>
						</div>

						<Card className="border-border">
							<CardContent className="p-0 overflow-x-auto">
								<Table className="min-w-[860px]">
									<TableHeader>
										<TableRow>
											<TableHead>Order ID</TableHead>
											<TableHead>Customer</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Phone</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Date</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{orders.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={8}
													className="text-center py-8 text-muted-foreground"
												>
													No orders found
												</TableCell>
											</TableRow>
										) : (
											orders.map((order) => (
												<TableRow key={order.id}>
													<TableCell className="font-medium">
														{order.order_number}
													</TableCell>
													<TableCell>{getCustomerName(order)}</TableCell>
													<TableCell>{getCustomerEmail(order)}</TableCell>
													<TableCell>{getCustomerPhone(order)}</TableCell>
													<TableCell>
														{formatPrice(Number(order.total_amount))}
													</TableCell>
													<TableCell>
														<Select
															value={order.status}
															onValueChange={(v) =>
																handleUpdateOrderStatus(order.id, v as Order['status'])
															}
														>
															<SelectTrigger
																className={`h-8 w-[120px] px-2 text-xs font-medium ${
																	getStatusBadgeClass(order.status)
																}`}
															>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{ORDER_STATUSES.map((s) => (
																	<SelectItem key={s} value={s}>
																		{s}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</TableCell>
													<TableCell>
														{formatDate(
															order.created_at,
															settings.display.dateFormat
														)}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleViewOrder(order)}
															>
																<Eye className="mr-2 h-4 w-4" />
																View
															</Button>
															<Button
																variant="ghost"
																size="sm"
																className="text-destructive"
																onClick={() =>
																	setDeleteConfirm({
																		open: true,
																		type: 'order',
																		id: order.id,
																		order,
																		user: null,
																		confirmText: '',
																	})
																}
																title="Delete"
															>
																<Trash2 className="h-4 w-4" />
																Delete
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'discounts' && <DiscountCodesManager />}

				{activeTab === 'users' && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Users</h2>
								<p className="text-muted-foreground text-sm sm:text-base">Manage user accounts</p>
							</div>
							<Button
								variant="hero"
								onClick={() => setIsAddUserOpen(true)}
								className="w-full sm:w-auto shrink-0"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add User
							</Button>
						</div>

						<Card className="border-border">
							<CardContent className="p-0 overflow-x-auto">
								<Table className="min-w-[640px]">
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Phone</TableHead>
											<TableHead>Role</TableHead>
											<TableHead>Joined</TableHead>
											{currentUserRole === 'super_admin' && (
												<TableHead className="text-right">Actions</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{users.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={currentUserRole === 'super_admin' ? 7 : 6}
													className="text-center py-8 text-muted-foreground"
												>
													No users found
												</TableCell>
											</TableRow>
										) : (
											users.map((user) => (
												<TableRow key={user.id}>
													<TableCell className="font-medium">
														{user.id.slice(0, 8)}...
													</TableCell>
													<TableCell>{user.full_name || 'N/A'}</TableCell>
													<TableCell>{user.email || 'N/A'}</TableCell>
													<TableCell>{user.phone || 'N/A'}</TableCell>
													<TableCell>
														{user.admin_role ? (
															<span
																className={`px-2 py-1 rounded-full text-xs font-medium ${
																	user.admin_role === 'super_admin'
																		? 'bg-gold/20 text-gold'
																		: 'bg-blue-500/20 text-blue-500'
																}`}
															>
																{user.admin_role === 'super_admin'
																	? 'Super Admin'
																	: 'Admin'}
															</span>
														) : (
															<span className="text-xs text-muted-foreground">
																User
															</span>
														)}
													</TableCell>
													<TableCell>
														{formatDate(
															user.created_at,
															settings.display.dateFormat
														)}
													</TableCell>
													{currentUserRole === 'super_admin' && (
														<TableCell className="text-right">
															<div className="flex justify-end gap-2 flex-wrap">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => {
																		setSelectedUser(user);
																		setIsUserModalOpen(true);
																	}}
																	title="View details"
																>
																	<Eye className="h-4 w-4" />
																</Button>
																<Button
																	variant="ghost"
																	size="sm"
																	className="text-destructive"
																	onClick={() =>
																		setDeleteConfirm({
																			open: true,
																			type: 'user',
																			id: user.id,
																			order: null,
																			user: {
																				id: user.id,
																				email: user.email,
																				full_name: user.full_name,
																			},
																			confirmText: '',
																		})
																	}
																	title="Delete user"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
																{user.admin_role ? (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => handleRemoveAdmin(user.id)}
																		disabled={adminActionsLoading[user.id]}
																		title="Remove Admin"
																	>
																		{adminActionsLoading[user.id] ? (
																			<Loader2 className="h-4 w-4 animate-spin" />
																		) : (
																			<Shield className="h-4 w-4 text-destructive" />
																		)}
																	</Button>
																) : (
																	<>
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={() =>
																				handleMakeAdmin(user.id, 'admin')
																			}
																			disabled={adminActionsLoading[user.id]}
																			title="Make Admin"
																		>
																			{adminActionsLoading[user.id] ? (
																				<Loader2 className="h-4 w-4 animate-spin" />
																			) : (
																				<Users className="h-4 w-4" />
																			)}
																		</Button>
																		<Button
																			variant="ghost"
																			size="sm"
																			onClick={() =>
																				handleMakeAdmin(user.id, 'super_admin')
																			}
																			disabled={adminActionsLoading[user.id]}
																			title="Make Super Admin"
																		>
																			{adminActionsLoading[user.id] ? (
																				<Loader2 className="h-4 w-4 animate-spin" />
																			) : (
																				<Shield className="h-4 w-4 text-gold" />
																			)}
																		</Button>
																	</>
																)}
															</div>
														</TableCell>
													)}
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'subscribers' && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Subscribers</h2>
								<p className="text-muted-foreground text-sm sm:text-base">
									Manage newsletter and email subscribers
								</p>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="text-sm text-muted-foreground">
									Total: {subscribers.length}
								</span>
							</div>
						</div>

						<Card className="border-border">
							<CardContent className="p-0 overflow-x-auto">
								<Table className="min-w-[520px]">
									<TableHeader>
										<TableRow>
											<TableHead>ID</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Subscribed At</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{subscribers.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={5}
													className="text-center py-8 text-muted-foreground"
												>
													No subscribers found
												</TableCell>
											</TableRow>
										) : (
											subscribers.map((subscriber) => (
												<TableRow key={subscriber.id}>
													<TableCell className="font-medium">
														{subscriber.id.slice(0, 8)}...
													</TableCell>
													<TableCell>{subscriber.email}</TableCell>
													<TableCell>
														{formatDate(
															subscriber.subscribed_at,
															settings.display.dateFormat
														)}
													</TableCell>
													<TableCell>
														<span
															className={`px-2 py-1 rounded-full text-xs ${
																subscriber.status === 'active'
																	? 'bg-green-500/20 text-green-500'
																	: 'bg-gray-500/20 text-gray-500'
															}`}
														>
															{subscriber.status}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																variant="ghost"
																size="icon"
																className="text-destructive"
																onClick={() =>
																	setDeleteConfirm({
																		open: true,
																		type: 'subscriber',
																		id: subscriber.id,
																		order: null,
																		user: null,
																		confirmText: '',
																	})
																}
																title="Delete"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'analytics' && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Analytics</h2>
								<p className="text-muted-foreground text-sm sm:text-base">
									Track store performance, inventory risk, profit/loss and customer behavior.
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => {
										const rows = [
											['Metric', 'Value'],
											['Sales Revenue', analytics.salesRevenue.toFixed(2)],
											['Estimated COGS', analytics.estimatedCogs.toFixed(2)],
											['Gross Profit', analytics.grossProfit.toFixed(2)],
											['Net Profit', analytics.netProfit.toFixed(2)],
											['Profit Margin %', analytics.profitMargin.toFixed(2)],
											['Net Profit Margin %', analytics.netProfitMargin.toFixed(2)],
											['Units Sold', String(analytics.totalUnitsSold)],
											['Average Order Value', analytics.avgOrderValue.toFixed(2)],
											['Total Customers', String(analytics.totalCustomers)],
											['New Customers', String(analytics.newCustomers)],
											['Repeat Customers', String(analytics.repeatCustomers)],
											['Repeat Rate %', analytics.repeatRate.toFixed(2)],
											['Average LTV', analytics.averageLtv.toFixed(2)],
										];
										const csv = rows
											.map((row) =>
												row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
											)
											.join('\n');
										const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
										const url = URL.createObjectURL(blob);
										const link = document.createElement('a');
										link.href = url;
										link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
										link.click();
										URL.revokeObjectURL(url);
									}}
								>
									<Download className="mr-2 h-4 w-4" />
									Export CSV
								</Button>
								<Button variant="outline" onClick={() => window.print()}>
									<Download className="mr-2 h-4 w-4" />
									Export PDF
								</Button>
							</div>
						</div>

						{analyticsLoading && (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								Loading analytics data...
							</div>
						)}

						<Card className="border-border">
							<CardHeader>
								<CardTitle>Date Range & Assumptions</CardTitle>
								<CardDescription>
									Control timeframe and estimated net-profit cost assumptions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
									<Button
										variant={analyticsDatePreset === 'today' ? 'default' : 'outline'}
										onClick={() => setAnalyticsDatePreset('today')}
									>
										Today
									</Button>
									<Button
										variant={analyticsDatePreset === '7d' ? 'default' : 'outline'}
										onClick={() => setAnalyticsDatePreset('7d')}
									>
										Last 7 Days
									</Button>
									<Button
										variant={analyticsDatePreset === '30d' ? 'default' : 'outline'}
										onClick={() => setAnalyticsDatePreset('30d')}
									>
										Last 30 Days
									</Button>
									<Button
										variant={analyticsDatePreset === 'custom' ? 'default' : 'outline'}
										onClick={() => setAnalyticsDatePreset('custom')}
									>
										Custom
									</Button>
								</div>
								{analyticsDatePreset === 'custom' && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="customStartDate">Start Date</Label>
											<Input
												id="customStartDate"
												type="date"
												value={customStartDate}
												onChange={(e) => setCustomStartDate(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="customEndDate">End Date</Label>
											<Input
												id="customEndDate"
												type="date"
												value={customEndDate}
												onChange={(e) => setCustomEndDate(e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
									<div className="space-y-2">
										<Label htmlFor="paymentFeeRate">Payment Fee %</Label>
										<Input
											id="paymentFeeRate"
											type="number"
											min="0"
											step="0.1"
											value={paymentFeeRate}
											onChange={(e) => setPaymentFeeRate(Number(e.target.value) || 0)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="shippingCostPerOrder">Shipping Cost / Order</Label>
										<Input
											id="shippingCostPerOrder"
											type="number"
											min="0"
											step="0.01"
											value={shippingCostPerOrder}
											onChange={(e) =>
												setShippingCostPerOrder(Number(e.target.value) || 0)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="averageDiscountRate">Discount %</Label>
										<Input
											id="averageDiscountRate"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={averageDiscountRate}
											onChange={(e) =>
												setAverageDiscountRate(Number(e.target.value) || 0)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="refundLossRate">Refund Loss %</Label>
										<Input
											id="refundLossRate"
											type="number"
											min="0"
											max="100"
											step="1"
											value={refundLossRate}
											onChange={(e) => setRefundLossRate(Number(e.target.value) || 0)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Sales Revenue
									</CardTitle>
									<DollarSign className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatPrice(analytics.salesRevenue)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										From non-cancelled order items
									</p>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Estimated COGS
									</CardTitle>
									<Package2 className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatPrice(analytics.estimatedCogs)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Using product cost price
									</p>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Gross Profit
									</CardTitle>
									<TrendingUp className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div
										className={`text-2xl font-bold ${
											analytics.grossProfit >= 0 ? 'text-green-500' : 'text-destructive'
										}`}
									>
										{formatPrice(analytics.grossProfit)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Margin: {analytics.profitMargin.toFixed(2)}%
									</p>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Net Profit
									</CardTitle>
									<DollarSign className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div
										className={`text-2xl font-bold ${
											analytics.netProfit >= 0 ? 'text-green-500' : 'text-destructive'
										}`}
									>
										{formatPrice(analytics.netProfit)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Net margin: {analytics.netProfitMargin.toFixed(2)}%
									</p>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Inventory Snapshot</CardTitle>
									<CardDescription>
										Current stock status and valuation
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Units Sold</span>
										<span className="font-medium">{analytics.totalUnitsSold}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Average Order Value</span>
										<span className="font-medium">
											{formatPrice(analytics.avgOrderValue)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Total Stock Units</span>
										<span className="font-medium">{analytics.totalStockUnits}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Low Stock Products</span>
										<span className="font-medium">{analytics.lowStockCount}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Out of Stock Products</span>
										<span className="font-medium">{analytics.outOfStockCount}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Inventory Value (Cost)</span>
										<span className="font-medium">
											{formatPrice(analytics.inventoryCostValue)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Inventory Value (Selling)</span>
										<span className="font-medium">
											{formatPrice(analytics.inventorySellingValue)}
										</span>
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader>
									<CardTitle>Net Profit Breakdown</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Gross Profit</span>
										<span className="font-medium">
											{formatPrice(analytics.grossProfit)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Transaction Fees</span>
										<span className="font-medium">
											-{formatPrice(analytics.estimatedTransactionFees)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Discounts</span>
										<span className="font-medium">
											-{formatPrice(analytics.estimatedDiscountAmount)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Shipping Cost</span>
										<span className="font-medium">
											-{formatPrice(analytics.estimatedShippingCost)}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Refund Impact</span>
										<span className="font-medium">
											-{formatPrice(analytics.refundImpactAmount)}
										</span>
									</div>
									<div className="flex items-center justify-between border-t border-border pt-2">
										<span className="font-medium">Estimated Net Profit</span>
										<span
											className={`font-semibold ${
												analytics.netProfit >= 0
													? 'text-green-500'
													: 'text-destructive'
											}`}
										>
											{formatPrice(analytics.netProfit)}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Refunded orders: {analytics.refundedOrdersCount} (
										{formatPrice(analytics.refundedAmount)})
									</p>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Profit by Category</CardTitle>
								</CardHeader>
								<CardContent className="p-0 overflow-x-auto">
									<Table className="min-w-[520px]">
										<TableHeader>
											<TableRow>
												<TableHead>Category</TableHead>
												<TableHead>Units</TableHead>
												<TableHead>Revenue</TableHead>
												<TableHead>Profit</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{analytics.categoryBreakdown.length === 0 ? (
												<TableRow>
													<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
														No category data
													</TableCell>
												</TableRow>
											) : (
												analytics.categoryBreakdown.map((row) => (
													<TableRow key={row.category}>
														<TableCell className="font-medium">{row.category}</TableCell>
														<TableCell>{row.unitsSold}</TableCell>
														<TableCell>{formatPrice(row.revenue)}</TableCell>
														<TableCell className={row.profit >= 0 ? 'text-green-500' : 'text-destructive'}>
															{formatPrice(row.profit)}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader>
									<CardTitle>Profit by Collection</CardTitle>
								</CardHeader>
								<CardContent className="p-0 overflow-x-auto">
									<Table className="min-w-[520px]">
										<TableHeader>
											<TableRow>
												<TableHead>Collection</TableHead>
												<TableHead>Units</TableHead>
												<TableHead>Revenue</TableHead>
												<TableHead>Profit</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{analytics.collectionBreakdown.length === 0 ? (
												<TableRow>
													<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
														No collection data
													</TableCell>
												</TableRow>
											) : (
												analytics.collectionBreakdown.map((row) => (
													<TableRow key={row.collection}>
														<TableCell className="font-medium">{row.collection}</TableCell>
														<TableCell>{row.unitsSold}</TableCell>
														<TableCell>{formatPrice(row.revenue)}</TableCell>
														<TableCell className={row.profit >= 0 ? 'text-green-500' : 'text-destructive'}>
															{formatPrice(row.profit)}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Top Products by Revenue</CardTitle>
								</CardHeader>
								<CardContent className="p-0 overflow-x-auto">
									<Table className="min-w-[520px]">
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead>Units</TableHead>
												<TableHead>Revenue</TableHead>
												<TableHead>Profit</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{analytics.topProducts.length === 0 ? (
												<TableRow>
													<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
														No sales data yet
													</TableCell>
												</TableRow>
											) : (
												analytics.topProducts.map((item) => (
													<TableRow key={item.productId}>
														<TableCell className="font-medium">{item.name}</TableCell>
														<TableCell>{item.unitsSold}</TableCell>
														<TableCell>{formatPrice(item.revenue)}</TableCell>
														<TableCell className={item.profit >= 0 ? 'text-green-500' : 'text-destructive'}>
															{formatPrice(item.profit)}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader>
									<CardTitle>Least Profitable Products</CardTitle>
								</CardHeader>
								<CardContent className="p-0 overflow-x-auto">
									<Table className="min-w-[520px]">
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead>Revenue</TableHead>
												<TableHead>COGS</TableHead>
												<TableHead>Profit/Loss</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{analytics.leastProfitableProducts.length === 0 ? (
												<TableRow>
													<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
														No sales data yet
													</TableCell>
												</TableRow>
											) : (
												analytics.leastProfitableProducts.map((item) => (
													<TableRow key={`least-${item.productId}`}>
														<TableCell className="font-medium">{item.name}</TableCell>
														<TableCell>{formatPrice(item.revenue)}</TableCell>
														<TableCell>{formatPrice(item.cogs)}</TableCell>
														<TableCell className={item.profit >= 0 ? 'text-green-500' : 'text-destructive'}>
															{formatPrice(item.profit)}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Product Trend (Best/Worst)</CardTitle>
									<CardDescription>
										Compares this range against the previous same-length period.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm font-medium mb-2">Best Trend</p>
										<div className="space-y-2">
											{analytics.bestTrendProducts.length === 0 ? (
												<p className="text-sm text-muted-foreground">No positive trend yet</p>
											) : (
												analytics.bestTrendProducts.map((row) => (
													<div key={`best-${row.productId}`} className="flex items-center justify-between text-sm">
														<span className="truncate max-w-[60%]">{row.name}</span>
														<span className="text-green-500">+{formatPrice(row.deltaRevenue)}</span>
													</div>
												))
											)}
										</div>
									</div>
									<div>
										<p className="text-sm font-medium mb-2">Worst Trend</p>
										<div className="space-y-2">
											{analytics.worstTrendProducts.length === 0 ? (
												<p className="text-sm text-muted-foreground">No negative trend yet</p>
											) : (
												analytics.worstTrendProducts.map((row) => (
													<div key={`worst-${row.productId}`} className="flex items-center justify-between text-sm">
														<span className="truncate max-w-[60%]">{row.name}</span>
														<span className="text-destructive">{formatPrice(row.deltaRevenue)}</span>
													</div>
												))
											)}
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader>
									<CardTitle>Customer Analytics</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 text-sm">
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Total Customers</span>
											<span className="font-medium">{analytics.totalCustomers}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">New Customers</span>
											<span className="font-medium">{analytics.newCustomers}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Repeat Customers</span>
											<span className="font-medium">{analytics.repeatCustomers}</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Repeat Rate</span>
											<span className="font-medium">{analytics.repeatRate.toFixed(2)}%</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">Average LTV</span>
											<span className="font-medium">{formatPrice(analytics.averageLtv)}</span>
										</div>
									</div>

									<div className="border-t border-border pt-3">
										<p className="text-sm font-medium mb-2">Cohort Retention</p>
										<div className="space-y-1 max-h-28 overflow-y-auto">
											{analytics.cohortRetentionRows.length === 0 ? (
												<p className="text-sm text-muted-foreground">No cohort data yet</p>
											) : (
												analytics.cohortRetentionRows.map((row) => (
													<div key={row.cohort} className="flex items-center justify-between text-sm">
														<span>{row.cohort}</span>
														<span>
															{row.retained}/{row.size} ({row.retentionRate.toFixed(1)}%)
														</span>
													</div>
												))
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<Card className="border-border">
								<CardHeader>
									<CardTitle>Reorder Recommendations</CardTitle>
									<CardDescription>
										Uses reorder point and target stock settings.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										<div className="space-y-2">
											<Label htmlFor="reorderPoint">Reorder Point</Label>
											<Input
												id="reorderPoint"
												type="number"
												min="0"
												value={reorderPoint}
												onChange={(e) => setReorderPoint(Number(e.target.value) || 0)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="targetStockLevel">Target Stock</Label>
											<Input
												id="targetStockLevel"
												type="number"
												min="0"
												value={targetStockLevel}
												onChange={(e) =>
													setTargetStockLevel(Number(e.target.value) || 0)
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="slowMovingThreshold">Slow-Moving &lt;= Units</Label>
											<Input
												id="slowMovingThreshold"
												type="number"
												min="0"
												value={slowMovingThreshold}
												onChange={(e) =>
													setSlowMovingThreshold(Number(e.target.value) || 0)
												}
											/>
										</div>
									</div>
									<div className="max-h-64 overflow-y-auto space-y-2">
										{analytics.reorderRecommendations.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												No products currently need reorder.
											</p>
										) : (
											analytics.reorderRecommendations.slice(0, 12).map((row) => (
												<div key={row.id} className="flex items-center justify-between text-sm border border-border rounded-md p-2">
													<span className="truncate max-w-[45%]">{row.name}</span>
													<span>Stock: {row.stock}</span>
													<span>Reorder: {row.recommendedQty}</span>
													<span>{formatPrice(row.reorderCost)}</span>
												</div>
											))
										)}
									</div>
								</CardContent>
							</Card>

							<Card className="border-border">
								<CardHeader>
									<CardTitle>Slow-Moving & Dead Stock</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm font-medium mb-2">
											Slow-Moving Products
										</p>
										<div className="max-h-28 overflow-y-auto space-y-1">
											{analytics.slowMovingProducts.length === 0 ? (
												<p className="text-sm text-muted-foreground">None detected</p>
											) : (
												analytics.slowMovingProducts.slice(0, 8).map((row) => (
													<div key={`slow-${row.id}`} className="flex items-center justify-between text-sm">
														<span className="truncate max-w-[65%]">{row.name}</span>
														<span>
															Sold: {row.unitsSold} | Stock: {row.stock}
														</span>
													</div>
												))
											)}
										</div>
									</div>
									<div>
										<p className="text-sm font-medium mb-2">Dead Stock</p>
										<div className="max-h-28 overflow-y-auto space-y-1">
											{analytics.deadStockProducts.length === 0 ? (
												<p className="text-sm text-muted-foreground">None detected</p>
											) : (
												analytics.deadStockProducts.slice(0, 8).map((row) => (
													<div key={`dead-${row.id}`} className="flex items-center justify-between text-sm">
														<span className="truncate max-w-[65%]">{row.name}</span>
														<span>Stock: {row.stock}</span>
													</div>
												))
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<Card className="border-border">
							<CardHeader>
								<CardTitle>Conversion Funnel</CardTitle>
								<CardDescription>
									{analytics.conversionFunnel.note}
								</CardDescription>
							</CardHeader>
							<CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="rounded-md border border-border p-3">
									<p className="text-xs text-muted-foreground">Visits</p>
									<p className="text-xl font-semibold">{analytics.conversionFunnel.visits}</p>
								</div>
								<div className="rounded-md border border-border p-3">
									<p className="text-xs text-muted-foreground">Add To Cart</p>
									<p className="text-xl font-semibold">{analytics.conversionFunnel.addToCart}</p>
								</div>
								<div className="rounded-md border border-border p-3">
									<p className="text-xs text-muted-foreground">Checkout Started</p>
									<p className="text-xl font-semibold">{analytics.conversionFunnel.checkoutStarted}</p>
								</div>
								<div className="rounded-md border border-border p-3">
									<p className="text-xs text-muted-foreground">Paid Orders</p>
									<p className="text-xl font-semibold">{analytics.conversionFunnel.paidOrders}</p>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === 'settings' && (
					<div className="space-y-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Settings</h2>
								<p className="text-muted-foreground text-sm sm:text-base">
									Manage your store settings and preferences
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Store: {settings.store.storeName} | Currency:{' '}
									{settings.store.currency}
								</p>
							</div>
							<Button
								variant="hero"
								onClick={handleSaveSettings}
								disabled={settingsLoading}
								className="w-full sm:w-auto shrink-0"
							>
								{settingsLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</div>

						{/* Notifications */}
						<Card className="border-border">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Bell className="h-5 w-5 text-gold" />
										<CardTitle>Notifications</CardTitle>
									</div>
									{!canShowNotifications() && (
										<Button
											variant="outline"
											size="sm"
											onClick={async () => {
												const permission =
													await requestNotificationPermission();
												setNotificationPermission(permission);
												if (permission === 'granted') {
													toast.success('Browser notifications enabled!');
												} else if (permission === 'denied') {
													toast.error(
														'Browser notifications blocked. Please enable in browser settings.'
													);
												}
											}}
										>
											{notificationPermission === 'default'
												? 'Enable Browser Notifications'
												: notificationPermission === 'denied'
												? 'Permission Denied'
												: 'Notifications Enabled'}
										</Button>
									)}
								</div>
								<CardDescription>
									Configure which notifications you want to receive
									{canShowNotifications() && (
										<span className="block mt-1 text-xs text-green-500">
											✓ Browser notifications enabled
										</span>
									)}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="newOrders">New Orders</Label>
										<p className="text-sm text-muted-foreground">
											Get notified when new orders are placed
										</p>
									</div>
									<Switch
										id="newOrders"
										checked={settings.notifications.newOrders}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												notifications: {
													...settings.notifications,
													newOrders: checked,
												},
											})
										}
									/>
								</div>

								<Separator />

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="lowStock">Low Stock Alerts</Label>
										<p className="text-sm text-muted-foreground">
											Receive alerts when products are running low
										</p>
									</div>
									<Switch
										id="lowStock"
										checked={settings.notifications.lowStock}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												notifications: {
													...settings.notifications,
													lowStock: checked,
												},
											})
										}
									/>
								</div>

								<Separator />

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="newUsers">New User Registrations</Label>
										<p className="text-sm text-muted-foreground">
											Get notified when new users sign up
										</p>
									</div>
									<Switch
										id="newUsers"
										checked={settings.notifications.newUsers}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												notifications: {
													...settings.notifications,
													newUsers: checked,
												},
											})
										}
									/>
								</div>

								<Separator />

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="orderUpdates">Order Status Updates</Label>
										<p className="text-sm text-muted-foreground">
											Notifications for order status changes
										</p>
									</div>
									<Switch
										id="orderUpdates"
										checked={settings.notifications.orderUpdates}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												notifications: {
													...settings.notifications,
													orderUpdates: checked,
												},
											})
										}
									/>
								</div>

								<Separator />

								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="weeklyReport">Weekly Reports</Label>
										<p className="text-sm text-muted-foreground">
											Receive weekly sales and performance reports
										</p>
									</div>
									<Switch
										id="weeklyReport"
										checked={settings.notifications.weeklyReport}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												notifications: {
													...settings.notifications,
													weeklyReport: checked,
												},
											})
										}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Store Information */}
						<Card className="border-border">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Globe className="h-5 w-5 text-gold" />
									<CardTitle>Store Information</CardTitle>
								</div>
								<CardDescription>
									Manage your store's basic information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="storeName">Store Name</Label>
										<Input
											id="storeName"
											value={settings.store.storeName}
											onChange={(e) =>
												setSettings({
													...settings,
													store: {
														...settings.store,
														storeName: e.target.value,
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="storeEmail">Store Email</Label>
										<Input
											id="storeEmail"
											type="email"
											value={settings.store.storeEmail}
											onChange={(e) =>
												setSettings({
													...settings,
													store: {
														...settings.store,
														storeEmail: e.target.value,
													},
												})
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="storePhone">Store Phone</Label>
										<Input
											id="storePhone"
											type="tel"
											value={settings.store.storePhone}
											onChange={(e) =>
												setSettings({
													...settings,
													store: {
														...settings.store,
														storePhone: e.target.value,
													},
												})
											}
											placeholder="+1 (555) 123-4567"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="currency">Currency</Label>
										<Select
											value={settings.store.currency}
											onValueChange={(value) =>
												setSettings({
													...settings,
													store: {
														...settings.store,
														currency: value,
													},
												})
											}
										>
											<SelectTrigger id="currency">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="NGN">
													NGN - Nigerian Naira
												</SelectItem>
												<SelectItem value="USD">USD - US Dollar</SelectItem>
												<SelectItem value="EUR">EUR - Euro</SelectItem>
												<SelectItem value="GBP">GBP - British Pound</SelectItem>
												<SelectItem value="CAD">
													CAD - Canadian Dollar
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="timezone">Timezone</Label>
									<Select
										value={settings.store.timezone}
										onValueChange={(value) =>
											setSettings({
												...settings,
												store: {
													...settings.store,
													timezone: value,
												},
											})
										}
									>
										<SelectTrigger id="timezone">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="America/New_York">
												Eastern Time (ET)
											</SelectItem>
											<SelectItem value="America/Chicago">
												Central Time (CT)
											</SelectItem>
											<SelectItem value="America/Denver">
												Mountain Time (MT)
											</SelectItem>
											<SelectItem value="America/Los_Angeles">
												Pacific Time (PT)
											</SelectItem>
											<SelectItem value="Europe/London">
												London (GMT)
											</SelectItem>
											<SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>

						{/* Display Preferences */}
						<Card className="border-border">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Palette className="h-5 w-5 text-gold" />
									<CardTitle>Display Preferences</CardTitle>
								</div>
								<CardDescription>
									Customize how data is displayed in the dashboard
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="itemsPerPage">Items Per Page</Label>
										<Select
											value={settings.display.itemsPerPage.toString()}
											onValueChange={(value) =>
												setSettings({
													...settings,
													display: {
														...settings.display,
														itemsPerPage: parseInt(value, 10),
													},
												})
											}
										>
											<SelectTrigger id="itemsPerPage">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="10">10 items</SelectItem>
												<SelectItem value="20">20 items</SelectItem>
												<SelectItem value="50">50 items</SelectItem>
												<SelectItem value="100">100 items</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="dateFormat">Date Format</Label>
										<Select
											value={settings.display.dateFormat}
											onValueChange={(value) =>
												setSettings({
													...settings,
													display: {
														...settings.display,
														dateFormat: value,
													},
												})
											}
										>
											<SelectTrigger id="dateFormat">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
												<SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
												<SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<Separator />

								<div className="flex items-center justify-between gap-6">
									<div className="space-y-0.5">
										<Label htmlFor="siteUnderConstruction">
											Site Under Construction
										</Label>
										<p className="text-sm text-muted-foreground">
											When enabled, shoppers see the under construction page while admin
											routes remain accessible.
										</p>
									</div>
									<Switch
										id="siteUnderConstruction"
										checked={settings.display.siteUnderConstruction}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												display: {
													...settings.display,
													siteUnderConstruction: checked,
												},
											})
										}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Security Settings */}
						<Card className="border-border">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-gold" />
									<CardTitle>Security</CardTitle>
								</div>
								<CardDescription>
									Manage your account security settings
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="twoFactorAuth">
											Two-Factor Authentication
										</Label>
										<p className="text-sm text-muted-foreground">
											Add an extra layer of security to your account
										</p>
									</div>
									<Switch
										id="twoFactorAuth"
										checked={settings.security.twoFactorAuth}
										onCheckedChange={(checked) =>
											setSettings({
												...settings,
												security: {
													...settings.security,
													twoFactorAuth: checked,
												},
											})
										}
									/>
								</div>

								<Separator />

								<div className="space-y-2">
									<Label htmlFor="sessionTimeout">
										Session Timeout (minutes)
									</Label>
									<Input
										id="sessionTimeout"
										type="number"
										min="5"
										max="480"
										value={settings.security.sessionTimeout}
										onChange={(e) =>
											setSettings({
												...settings,
												security: {
													...settings.security,
													sessionTimeout: parseInt(e.target.value, 10) || 30,
												},
											})
										}
									/>
									<p className="text-sm text-muted-foreground">
										Automatically log out after inactivity (5-480 minutes)
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Database & System */}
						<Card className="border-border">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Database className="h-5 w-5 text-gold" />
									<CardTitle>System Information</CardTitle>
								</div>
								<CardDescription>
									View system status and database information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<p className="text-sm font-medium">Database Status</p>
										<p
											className={`text-sm ${
												systemInfo.databaseStatus === 'connected'
													? 'text-green-500'
													: systemInfo.databaseStatus === 'error'
													? 'text-red-500'
													: 'text-yellow-500'
											}`}
										>
											{systemInfo.databaseStatus === 'connected'
												? 'Connected'
												: systemInfo.databaseStatus === 'error'
												? 'Error'
												: 'Disconnected'}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm font-medium">Last Backup</p>
										<p className="text-sm text-muted-foreground">
											{systemInfo.lastBackup
												? formatDate(
														systemInfo.lastBackup,
														settings.display.dateFormat
												  )
												: 'Never'}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm font-medium">Storage Used</p>
										<p className="text-sm text-muted-foreground">
											{systemInfo.storageUsed}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm font-medium">API Status</p>
										<p
											className={`text-sm ${
												systemInfo.apiStatus === 'operational'
													? 'text-green-500'
													: systemInfo.apiStatus === 'degraded'
													? 'text-yellow-500'
													: 'text-red-500'
											}`}
										>
											{systemInfo.apiStatus === 'operational'
												? 'Operational'
												: systemInfo.apiStatus === 'degraded'
												? 'Degraded'
												: 'Down'}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Add Product Modal */}
			<AddProductModal
				open={isAddProductOpen}
				onOpenChange={setIsAddProductOpen}
				onSuccess={() => {
					loadProducts();
					loadStats();
				}}
			/>

			{/* Edit Product Modal */}
			<EditProductModal
				product={editingProduct}
				open={isEditProductOpen}
				onOpenChange={(open) => {
					setIsEditProductOpen(open);
					if (!open) setEditingProduct(null);
				}}
				onSuccess={() => {
					loadProducts();
					loadStats();
				}}
			/>

			<AddUserModal
				open={isAddUserOpen}
				onOpenChange={setIsAddUserOpen}
				onSuccess={() => loadUsers()}
			/>

			{/* User details modal */}
			<Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>User details</DialogTitle>
						<DialogDescription>
							{selectedUser?.full_name || selectedUser?.email || 'User'}
						</DialogDescription>
					</DialogHeader>
					{selectedUser && (
						<div className="space-y-4 py-2">
							<div className="grid gap-2">
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="font-medium">{selectedUser.email || '—'}</p>
							</div>
							<div className="grid gap-2">
								<p className="text-sm text-muted-foreground">Full name</p>
								<p className="font-medium">{selectedUser.full_name || '—'}</p>
							</div>
							<div className="grid gap-2">
								<p className="text-sm text-muted-foreground">Phone</p>
								<p className="font-medium">{selectedUser.phone || '—'}</p>
							</div>
							<div className="grid gap-2">
								<p className="text-sm text-muted-foreground">Role</p>
								<p className="font-medium">
									{selectedUser.admin_role === 'super_admin'
										? 'Super Admin'
										: selectedUser.admin_role === 'admin'
										? 'Admin'
										: 'User'}
								</p>
							</div>
							<div className="grid gap-2">
								<p className="text-sm text-muted-foreground">Joined</p>
								<p className="font-medium">
									{formatDate(selectedUser.created_at, settings.display.dateFormat)}
								</p>
							</div>
							<div className="flex justify-end gap-2 pt-4 border-t border-border">
								<Button
									variant="outline"
									onClick={() => setIsUserModalOpen(false)}
								>
									Close
								</Button>
								<Button
									variant="destructive"
									onClick={() => {
										setIsUserModalOpen(false);
										setDeleteConfirm({
											open: true,
											type: 'user',
											id: selectedUser.id,
											order: null,
											user: {
												id: selectedUser.id,
												email: selectedUser.email,
												full_name: selectedUser.full_name,
											},
											confirmText: '',
										});
									}}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete user
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog
				open={deleteConfirm.open}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteConfirm({ open: false, type: null, id: null, order: null, user: null, confirmText: '' });
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{deleteConfirm.type === 'product' && 'Delete product'}
							{deleteConfirm.type === 'subscriber' && 'Delete subscriber'}
							{deleteConfirm.type === 'order' && 'Delete order'}
							{deleteConfirm.type === 'user' && 'Delete user'}
						</DialogTitle>
						<DialogDescription>
							{deleteConfirm.type === 'order' && deleteConfirm.order && (
								<span className="block mb-2">
									Order #{deleteConfirm.order.order_number} will be permanently removed.
								</span>
							)}
							{deleteConfirm.type === 'user' && deleteConfirm.user && (
								<span className="block mb-2">
									{deleteConfirm.user.full_name || deleteConfirm.user.email || deleteConfirm.user.id} will be removed from the app. Their auth account may still exist in Supabase.
								</span>
							)}
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() =>
								setDeleteConfirm({ open: false, type: null, id: null, order: null, user: null, confirmText: '' })
							}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => executeDeleteConfirm()}
						>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Order Details Modal */}
			<Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							Order #{selectedOrder?.order_number || 'N/A'}
						</DialogDescription>
					</DialogHeader>

					{selectedOrder && (
						<div className="space-y-6">
							{/* Order Information */}
							<div className="grid md:grid-cols-2 gap-4">
								<Card className="border-border">
									<CardHeader>
										<CardTitle className="text-lg">Order Information</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Order Number:</span>
											<span className="font-medium">{selectedOrder.order_number}</span>
										</div>
										<div className="flex justify-between items-center gap-2">
											<span className="text-muted-foreground">Status:</span>
											<Select
												value={selectedOrder.status}
												onValueChange={(v) =>
													handleUpdateOrderStatus(selectedOrder.id, v as Order['status'])
												}
											>
												<SelectTrigger
													className={`w-[130px] h-9 px-2 text-xs font-medium ${
														getStatusBadgeClass(selectedOrder.status)
													}`}
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{ORDER_STATUSES.map((s) => (
														<SelectItem key={s} value={s}>
															{s}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Date:</span>
											<span className="font-medium">
												{formatDate(
													selectedOrder.created_at,
													settings.display.dateFormat
												)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Timestamp:</span>
											<span className="font-medium">
												{new Date(
													selectedOrder.created_at
												).toLocaleString(undefined, {
													dateStyle: 'medium',
													timeStyle: 'short',
												})}
											</span>
										</div>
										{selectedOrder.payment_reference && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Payment Ref:</span>
												<span className="font-medium text-sm">
													{selectedOrder.payment_reference}
												</span>
											</div>
										)}
										{selectedOrder.delivery_method && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Delivery:</span>
												<span className="font-medium">
													{selectedOrder.delivery_method}
												</span>
											</div>
										)}
									</CardContent>
								</Card>

								<Card className="border-border">
									<CardHeader>
										<CardTitle className="text-lg">Shipping Address</CardTitle>
									</CardHeader>
									<CardContent className="space-y-1">
										<p className="text-sm text-muted-foreground">
											Email: {getCustomerEmail(selectedOrder)}
										</p>
										<p className="text-sm text-muted-foreground">
											Phone: {getCustomerPhone(selectedOrder)}
										</p>
										{typeof selectedOrder.shipping_address === 'object' &&
										selectedOrder.shipping_address ? (
											<>
												<p className="font-medium">
													{selectedOrder.shipping_address.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{selectedOrder.shipping_address.address}
												</p>
												<p className="text-sm text-muted-foreground">
													{selectedOrder.shipping_address.city},{' '}
													{selectedOrder.shipping_address.state}
												</p>
												<p className="text-sm text-muted-foreground">
													{selectedOrder.shipping_address.zip_code}
												</p>
												<p className="text-sm text-muted-foreground">
													{selectedOrder.shipping_address.country}
												</p>
											</>
										) : (
											<p className="text-sm text-muted-foreground">
												No shipping address available
											</p>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Order Items */}
							<Card className="border-border">
								<CardHeader>
									<CardTitle className="text-lg">Order Items</CardTitle>
								</CardHeader>
								<CardContent>
									{loadingOrderItems ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
										</div>
									) : orderItems.length === 0 ? (
										<p className="text-center py-8 text-muted-foreground">
											No items found for this order
										</p>
									) : (
										<div className="space-y-4">
											{orderItems.map((item) => (
												<div
													key={item.id}
													className="flex gap-4 p-4 border border-border rounded-lg"
												>
													{item.product?.images &&
													item.product.images.length > 0 ? (
														<img
															src={getOptimizedCloudinaryUrl(
																item.product.images[0],
																{
																	width: 100,
																	height: 100,
																	crop: 'fill',
																	quality: 'auto',
																}
															)}
															alt={item.product.name}
															className="w-20 h-20 object-cover rounded-sm"
														/>
													) : (
														<div className="w-20 h-20 bg-card rounded-sm flex items-center justify-center">
															<Package className="h-8 w-8 text-muted-foreground" />
														</div>
													)}
													<div className="flex-1">
														<p className="font-medium">
															{item.product?.name || 'Product not found'}
														</p>
														<p className="text-sm text-muted-foreground">
															Quantity: {item.quantity}
														</p>
														<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
															<span>
																<span className="font-medium text-foreground">Color:</span>{' '}
																{item.selected_color || '—'}
															</span>
															<span>
																<span className="font-medium text-foreground">Size:</span>{' '}
																{item.selected_size || '—'}
															</span>
														</div>
														<p className="text-sm text-muted-foreground">
															Price: {formatPrice(item.price)} each
														</p>
													</div>
													<div className="text-right">
														<p className="font-semibold text-lg">
															{formatPrice(item.price * item.quantity)}
														</p>
													</div>
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>

							{/* Order Summary */}
							<Card className="border-border">
								<CardHeader>
									<CardTitle className="text-lg">Order Summary</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Subtotal:</span>
											<span>
												{formatPrice(
													orderItems.reduce(
														(sum, item) => sum + item.price * item.quantity,
														0
													)
												)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Total:</span>
											<span className="text-lg font-bold text-gradient-gold">
												{formatPrice(Number(selectedOrder.total_amount))}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AdminDashboard;
