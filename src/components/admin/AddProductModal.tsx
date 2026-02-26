import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/text-area';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { checkAdminStatus } from '@/lib/admin';
import { toast } from 'sonner';

// Helper to check Supabase configuration
const checkSupabaseConfig = () => {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	
	if (!url || !key) {
		return {
			valid: false,
			error: 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file',
		};
	}
	
	if (!url.includes('supabase.co')) {
		return {
			valid: false,
			error: 'Invalid Supabase URL. URL should end with .supabase.co',
		};
	}
	
	return { valid: true, error: null };
};

const getErrorMessage = (error: unknown) =>
	error instanceof Error ? error.message : 'An unexpected error occurred';
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Collection, Category } from '@/types/database';

interface AddProductModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const AddProductModal = ({ open, onOpenChange, onSuccess }: AddProductModalProps) => {
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		color: '',
		size: '',
		category: '',
		collection: '',
		cost_price: '',
		selling_price: '',
		discount: '',
		stock: '',
		featured: false,
		new_arrival: false,
		best_seller: false,
		on_sale: false,
	});
	const [features, setFeatures] = useState<string[]>([]);
	const [newFeature, setNewFeature] = useState('');
	const [collections, setCollections] = useState<Collection[]>([]);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [newCollectionDescription, setNewCollectionDescription] = useState('');
	const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
	const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
	const [newCollectionImage, setNewCollectionImage] = useState<File | null>(null);
	const [newCollectionImagePreview, setNewCollectionImagePreview] = useState<string | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
	const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
	const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
	const [newCategoryImagePreview, setNewCategoryImagePreview] = useState<string | null>(null);
	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({
			...formData,
			[e.target.id]: e.target.value,
		});
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const validFiles: File[] = [];
		const invalidFiles: string[] = [];

		files.forEach((file) => {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				invalidFiles.push(`${file.name} is not an image file`);
				return;
			}

			// Validate file size (max 100MB)
			if (file.size > 100 * 1024 * 1024) {
				invalidFiles.push(`${file.name} is larger than 100MB`);
				return;
			}

			validFiles.push(file);
		});

		if (invalidFiles.length > 0) {
			toast.error(invalidFiles.join(', '));
		}

		if (validFiles.length > 0) {
			const newFiles = [...imageFiles, ...validFiles];
			setImageFiles(newFiles);

			// Create previews for new files
			validFiles.forEach((file) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					setImagePreviews((prev) => [...prev, reader.result as string]);
				};
				reader.readAsDataURL(file);
			});
		}

		// Reset input
		e.target.value = '';
	};

	const handleRemoveImage = (index: number) => {
		const newFiles = imageFiles.filter((_, i) => i !== index);
		const newPreviews = imagePreviews.filter((_, i) => i !== index);
		setImageFiles(newFiles);
		setImagePreviews(newPreviews);
	};

	// Load collections when modal opens
	const loadCollections = async () => {
		try {
			const { data, error } = await supabase
				.from('collections')
				.select('*')
				.order('name', { ascending: true });

			if (error) {
				console.error('Error loading collections:', error);
				// If table doesn't exist, use empty array
				setCollections([]);
				return;
			}

			setCollections(data || []);
		} catch (error) {
			console.error('Error loading collections:', error);
			setCollections([]);
		}
	};

	// Handle collection image selection
	const handleCollectionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Please select an image file');
				return;
			}

			// Validate file size (100MB max)
			if (file.size > 100 * 1024 * 1024) {
				toast.error('Image size must be less than 100MB');
				return;
			}

			setNewCollectionImage(file);

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setNewCollectionImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}

		// Reset input
		e.target.value = '';
	};

	// Create new collection
	const handleCreateCollection = async () => {
		if (!newCollectionName.trim()) {
			toast.error('Please enter a collection name');
			return;
		}

		try {
			let imageUrl: string | null = null;

			// Upload image if provided
			if (newCollectionImage) {
				const { url, error: uploadError } = await uploadImageToCloudinary(
					newCollectionImage,
					'collections',
					{
						tags: ['collection'],
					}
				);

				if (uploadError || !url) {
					toast.warning('Failed to upload collection image. Collection will be created without image.');
				} else {
					imageUrl = url;
				}
			}

			const { data, error } = await supabase
				.from('collections')
				.insert({ 
					name: newCollectionName.trim(),
					description: newCollectionDescription.trim() || null,
					image_url: imageUrl
				})
				.select()
				.single();

			if (error) {
				if (error.code === '23505' || error.message.includes('duplicate')) {
					toast.error('Collection name already exists');
				} else {
					throw error;
				}
				return;
			}

			toast.success('Collection created successfully');
			setCollections([...collections, data]);
			setFormData({ ...formData, collection: data.name });
			setNewCollectionName('');
			setNewCollectionDescription('');
			setNewCollectionImage(null);
			setNewCollectionImagePreview(null);
			setShowNewCollectionInput(false);
		} catch (error: unknown) {
			console.error('Error creating collection:', error);
			toast.error(getErrorMessage(error) || 'Failed to create collection');
		}
	};

	// Delete collection
	const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
		try {
			// Use the RPC function to delete collection and update products
			const { error } = await supabase.rpc('delete_collection_and_update_products', {
				collection_id: collectionId
			});

			if (error) {
				// Fallback to manual delete if function doesn't exist
				if (error.message.includes('function') || error.message.includes('does not exist')) {
					// Update products first
					await supabase
						.from('products')
						.update({ collection: null })
						.eq('collection', collectionName);

					// Then delete collection
					const { error: deleteError } = await supabase
						.from('collections')
						.delete()
						.eq('id', collectionId);

					if (deleteError) throw deleteError;
				} else {
					throw error;
				}
			}

			toast.success('Collection deleted successfully');
			setCollections(collections.filter(c => c.id !== collectionId));
			
			// Clear collection selection if it was deleted
			if (formData.collection === collectionName) {
				setFormData({ ...formData, collection: '' });
			}
			
			setDeleteCollectionId(null);
		} catch (error: unknown) {
			console.error('Error deleting collection:', error);
			toast.error(getErrorMessage(error) || 'Failed to delete collection');
		}
	};

	// Load categories when modal opens
	const loadCategories = async () => {
		try {
			const { data, error } = await supabase
				.from('categories')
				.select('*')
				.order('name', { ascending: true });

			if (error) {
				console.error('Error loading categories:', error);
				// If table doesn't exist, use empty array
				setCategories([]);
				return;
			}

			setCategories(data || []);
		} catch (error) {
			console.error('Error loading categories:', error);
			setCategories([]);
		}
	};

	// Handle category image selection
	const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Please select an image file');
				return;
			}

			// Validate file size (100MB max)
			if (file.size > 100 * 1024 * 1024) {
				toast.error('Image size must be less than 100MB');
				return;
			}

			setNewCategoryImage(file);

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setNewCategoryImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}

		// Reset input
		e.target.value = '';
	};

	// Create new category
	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) {
			toast.error('Please enter a category name');
			return;
		}

		try {
			let imageUrl: string | null = null;

			// Upload image if provided
			if (newCategoryImage) {
				const { url, error: uploadError } = await uploadImageToCloudinary(
					newCategoryImage,
					'categories',
					{
						tags: ['category'],
					}
				);

				if (uploadError || !url) {
					toast.warning('Failed to upload category image. Category will be created without image.');
				} else {
					imageUrl = url;
				}
			}

			const { data, error } = await supabase
				.from('categories')
				.insert({ 
					name: newCategoryName.trim(),
					image_url: imageUrl
				})
				.select()
				.single();

			if (error) {
				if (error.code === '23505' || error.message.includes('duplicate')) {
					toast.error('Category name already exists');
				} else {
					throw error;
				}
				return;
			}

			toast.success('Category created successfully');
			setCategories([...categories, data]);
			setFormData({ ...formData, category: data.name });
			setNewCategoryName('');
			setNewCategoryImage(null);
			setNewCategoryImagePreview(null);
			setShowNewCategoryInput(false);
		} catch (error: unknown) {
			console.error('Error creating category:', error);
			toast.error(getErrorMessage(error) || 'Failed to create category');
		}
	};

	// Delete category
	const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
		try {
			// Use the RPC function to delete category and check for products
			const { error } = await supabase.rpc('delete_category_and_update_products', {
				category_id: categoryId
			});

			if (error) {
				// Fallback to manual delete if function doesn't exist
				if (error.message.includes('function') || error.message.includes('does not exist')) {
					// Check if any products use this category
					const { data: productsData } = await supabase
						.from('products')
						.select('id')
						.eq('category', categoryName)
						.limit(1);

					if (productsData && productsData.length > 0) {
						toast.error('Cannot delete category: products still exist with this category');
						return;
					}

					// Then delete category
					const { error: deleteError } = await supabase
						.from('categories')
						.delete()
						.eq('id', categoryId);

					if (deleteError) throw deleteError;
				} else if (error.message.includes('Cannot delete category')) {
					toast.error(error.message);
					return;
				} else {
					throw error;
				}
			}

			toast.success('Category deleted successfully');
			setCategories(categories.filter(c => c.id !== categoryId));
			
			// Clear category selection if it was deleted
			if (formData.category === categoryName) {
				setFormData({ ...formData, category: '' });
			}
			
			setDeleteCategoryId(null);
		} catch (error: unknown) {
			console.error('Error deleting category:', error);
			toast.error(getErrorMessage(error) || 'Failed to delete category');
		}
	};

	// Load collections and categories when modal opens
	useEffect(() => {
		if (open) {
			loadCollections();
			loadCategories();
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Check Supabase configuration
			const configCheck = checkSupabaseConfig();
			if (!configCheck.valid) {
				toast.error(configCheck.error || 'Supabase not configured');
				setLoading(false);
				return;
			}

			// Check if user is authenticated and is an admin
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session) {
				toast.error('You must be logged in to create products');
				setLoading(false);
				return;
			}

			const isAdmin = await checkAdminStatus();
			if (!isAdmin) {
				toast.error('Admin privileges required to create products');
				setLoading(false);
				return;
			}

			// Validate required fields
			if (!formData.name || !formData.category || !formData.cost_price || !formData.selling_price || !formData.stock) {
				toast.error('Please fill in all required fields');
				setLoading(false);
				return;
			}

			if (Number(formData.selling_price) < Number(formData.cost_price)) {
				toast.error('Selling price cannot be lower than cost price');
				setLoading(false);
				return;
			}

			const discountPercentage = Number(formData.discount || 0);
			if (Number.isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
				toast.error('Discount must be a percentage between 0 and 100');
				setLoading(false);
				return;
			}

			if (imageFiles.length === 0) {
				toast.error('Please upload at least one product image');
				setLoading(false);
				return;
			}

			// Upload all images to Cloudinary
			setUploadingImages(true);
			const imageUrls: string[] = [];
			
			for (const file of imageFiles) {
				const { url, error: uploadError } = await uploadImageToCloudinary(
					file,
					'products', // Store in 'products' folder
					{
						tags: ['product', formData.category.toLowerCase()],
					}
				);

				if (uploadError || !url) {
					toast.warning(`Failed to upload ${file.name}. Using placeholder.`);
					imageUrls.push('/placeholder.svg');
				} else {
					imageUrls.push(url);
				}
			}

			setUploadingImages(false);

			// Use uploaded URLs or fallback to placeholder if all failed
			const finalImageUrls = imageUrls.length > 0 ? imageUrls : ['/placeholder.svg'];
			const sellingPrice = parseFloat(formData.selling_price);
			const finalPrice = sellingPrice * (1 - discountPercentage / 100);

			// Create product in Supabase
			const { data, error } = await supabase
				.from('products')
				.insert({
					name: formData.name,
					description: formData.description || null,
					color: formData.color.trim() || null,
					size: formData.size.trim() || null,
					category: formData.category,
					collection: formData.collection || null,
					price: finalPrice,
					cost_price: parseFloat(formData.cost_price),
					selling_price: sellingPrice,
					stock: parseInt(formData.stock, 10),
					images: finalImageUrls,
					featured: formData.featured,
					new_arrival: formData.new_arrival,
					best_seller: formData.best_seller,
					on_sale: formData.on_sale,
					features: features.filter(f => f.trim() !== ''),
				})
				.select()
				.single();

			if (error) {
				console.error('Supabase error details:', error);
				console.error('Error code:', error.code);
				console.error('Error message:', error.message);
				console.error('Error details:', error.details);
				console.error('Error hint:', error.hint);

				// Check if it's a CORS or network error
				if (
					error.message?.includes('fetch') ||
					error.message?.includes('CORS') ||
					error.message?.includes('NetworkError') ||
					error.message?.includes('Failed to fetch')
				) {
					toast.error(
						'Network error. Check: 1) Supabase project is active, 2) URL is correct, 3) Products table exists. See console for details.'
					);
					const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
					throw new Error(
						'Network/CORS error. Please check:\n' +
						'1. Supabase project is active (not paused) - Check Supabase Dashboard\n' +
						'2. VITE_SUPABASE_URL is correct in .env file\n' +
						'3. Products table exists - Run SUPABASE_PRODUCTS_SETUP.sql\n' +
						'4. RLS policies allow admin access - Check TROUBLESHOOTING_CORS.md\n' +
						`Current URL: ${supabaseUrl || 'NOT SET'}`
					);
				}
				// Check if table doesn't exist
				if (error.message?.includes('relation') || error.code === '42P01' || error.code === 'PGRST116') {
					toast.error('Products table not found. Please run SUPABASE_PRODUCTS_SETUP.sql in Supabase SQL Editor.');
					throw new Error(
						'Products table does not exist. Please run SUPABASE_PRODUCTS_SETUP.sql in your Supabase SQL Editor.'
					);
				}
				// Check if RLS is blocking
				if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
					toast.error('Permission denied. Ensure you are an admin and RLS policies are set up correctly.');
					throw new Error(
						'Permission denied by RLS policy. Please ensure:\n' +
						'1. You are logged in as an admin user\n' +
						'2. Admin roles are set up (run SUPABASE_ADMIN_SETUP.sql)\n' +
						'3. RLS policies allow admin inserts (run SUPABASE_PRODUCTS_SETUP.sql)'
					);
				}
				// Generic error
				toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
				throw error;
			}

			toast.success('Product created successfully!');
			
			// Reset form
			setFormData({
				name: '',
				description: '',
				color: '',
				size: '',
				category: '',
				collection: '',
				cost_price: '',
				selling_price: '',
				discount: '',
				stock: '',
				featured: false,
				new_arrival: false,
				best_seller: false,
				on_sale: false,
			});
			setFeatures([]);
			setNewFeature('');
			setImageFiles([]);
			setImagePreviews([]);
			onOpenChange(false);
			onSuccess();
		} catch (error) {
			console.error('Error creating product:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to create product');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add New Product</DialogTitle>
					<DialogDescription>
						Fill in the product details below. All fields marked with * are required.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Product Images */}
					<div className="space-y-2">
						<Label htmlFor="images">Product Images *</Label>
						<p className="text-sm text-muted-foreground mb-3">
							Upload one or more product images (first image will be used as the main display image)
						</p>
						
						{/* Image Previews */}
						{imagePreviews.length > 0 && (
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
								{imagePreviews.map((preview, index) => (
									<div key={index} className="relative group">
										<img
											src={preview}
											alt={`Preview ${index + 1}`}
											className="w-full h-32 object-cover rounded-md border border-border"
										/>
										{index === 0 && (
											<div className="absolute top-1 left-1 bg-gold text-charcoal-deep text-xs px-2 py-1 rounded font-medium">
												Main
											</div>
										)}
										<Button
											type="button"
											variant="destructive"
											size="icon"
											className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() => handleRemoveImage(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Upload Area */}
						<div className="border-2 border-dashed border-border rounded-md p-8 text-center">
							<Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<Label htmlFor="images" className="cursor-pointer">
								<span className="text-sm font-medium text-gold hover:text-gold-muted">
									Click to upload images
								</span>
								<span className="text-xs text-muted-foreground block mt-2">
									PNG, JPG up to 100MB each (multiple selection allowed)
								</span>
							</Label>
							<Input
								id="images"
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={handleImageChange}
							/>
						</div>
					</div>

					{/* Product Name */}
					<div className="space-y-2">
						<Label htmlFor="name">Product Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={handleChange}
							placeholder="e.g., Signature Timepiece"
							required
						/>
					</div>

					{/* Color and Size */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<Input
								id="color"
								value={formData.color}
								onChange={handleChange}
								placeholder="e.g., Black, Gold"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="size">Size</Label>
							<Input
								id="size"
								value={formData.size}
								onChange={handleChange}
								placeholder="e.g., 42mm, One Size"
							/>
						</div>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={handleChange}
							placeholder="Product description..."
							rows={4}
						/>
					</div>

					{/* Category and Collection */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="category">Category *</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-xs"
									onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
								>
									<Plus className="h-3 w-3 mr-1" />
									New
								</Button>
							</div>
							{showNewCategoryInput ? (
								<div className="space-y-3">
									<div className="flex gap-2">
										<Input
											placeholder="Category name"
											value={newCategoryName}
											onChange={(e) => setNewCategoryName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													handleCreateCategory();
												} else if (e.key === 'Escape') {
													setShowNewCategoryInput(false);
													setNewCategoryName('');
													setNewCategoryImage(null);
													setNewCategoryImagePreview(null);
												}
											}}
											autoFocus
										/>
									</div>
									
									{/* Category Image Upload */}
									<div className="space-y-2">
										<Label htmlFor="category-image" className="text-sm">Category Image (Optional)</Label>
										{newCategoryImagePreview ? (
											<div className="relative">
												<img
													src={newCategoryImagePreview}
													alt="Category preview"
													className="w-full h-32 object-cover rounded-md border border-border"
												/>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													className="absolute top-1 right-1"
													onClick={() => {
														setNewCategoryImage(null);
														setNewCategoryImagePreview(null);
													}}
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
										) : (
											<div className="border-2 border-dashed border-border rounded-md p-4 text-center">
												<Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
												<Label htmlFor="category-image" className="cursor-pointer">
													<span className="text-xs text-gold hover:text-gold-muted">
														Click to upload image
													</span>
												</Label>
												<Input
													id="category-image"
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleCategoryImageChange}
												/>
											</div>
										)}
									</div>

									<div className="flex gap-2">
										<Button
											type="button"
											size="sm"
											onClick={handleCreateCategory}
										>
											Add
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setShowNewCategoryInput(false);
												setNewCategoryName('');
												setNewCategoryImage(null);
												setNewCategoryImagePreview(null);
											}}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Select
										value={formData.category}
										onValueChange={(value) =>
											setFormData({ ...formData, category: value })
										}
										required
									>
										<SelectTrigger id="category" className="flex-1">
											<SelectValue placeholder="Select category" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category.id} value={category.name}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{categories.length > 0 && (
										<Popover>
											<PopoverTrigger asChild>
												<Button type="button" variant="outline" size="icon" className="flex-shrink-0">
													<Trash2 className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												<div className="space-y-2">
													<h4 className="font-medium text-sm mb-2">Manage Categories</h4>
													<div className="space-y-1 max-h-60 overflow-y-auto">
														{categories.map((category) => (
															<div key={category.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
																<span className="text-sm">{category.name}</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-destructive hover:text-destructive"
																	onClick={() => setDeleteCategoryId(category.id)}
																>
																	<Trash2 className="h-3 w-3" />
																</Button>
															</div>
														))}
													</div>
												</div>
											</PopoverContent>
										</Popover>
									)}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="collection">Collection</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-xs"
									onClick={() => setShowNewCollectionInput(!showNewCollectionInput)}
								>
									<Plus className="h-3 w-3 mr-1" />
									New
								</Button>
							</div>
							{showNewCollectionInput ? (
								<div className="space-y-3">
									<div className="flex gap-2">
										<Input
											placeholder="Collection name"
											value={newCollectionName}
											onChange={(e) => setNewCollectionName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && e.ctrlKey) {
													e.preventDefault();
													handleCreateCollection();
												} else if (e.key === 'Escape') {
													setShowNewCollectionInput(false);
													setNewCollectionName('');
													setNewCollectionDescription('');
													setNewCollectionImage(null);
													setNewCollectionImagePreview(null);
												}
											}}
											autoFocus
										/>
									</div>
									
									{/* Collection Description */}
									<div className="space-y-2">
										<Label htmlFor="collection-description" className="text-sm">Description (Optional)</Label>
										<Textarea
											id="collection-description"
											placeholder="Enter collection description..."
											value={newCollectionDescription}
											onChange={(e) => setNewCollectionDescription(e.target.value)}
											rows={3}
										/>
									</div>
									
									{/* Collection Image Upload */}
									<div className="space-y-2">
										<Label htmlFor="collection-image" className="text-sm">Collection Image (Optional)</Label>
										{newCollectionImagePreview ? (
											<div className="relative">
												<img
													src={newCollectionImagePreview}
													alt="Collection preview"
													className="w-full h-32 object-cover rounded-md border border-border"
												/>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													className="absolute top-1 right-1"
													onClick={() => {
														setNewCollectionImage(null);
														setNewCollectionImagePreview(null);
													}}
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
										) : (
											<div className="border-2 border-dashed border-border rounded-md p-4 text-center">
												<Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
												<Label htmlFor="collection-image" className="cursor-pointer">
													<span className="text-xs text-gold hover:text-gold-muted">
														Click to upload image
													</span>
												</Label>
												<Input
													id="collection-image"
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleCollectionImageChange}
												/>
											</div>
										)}
									</div>

									<div className="flex gap-2">
										<Button
											type="button"
											size="sm"
											onClick={handleCreateCollection}
										>
											Add
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setShowNewCollectionInput(false);
												setNewCollectionName('');
												setNewCollectionDescription('');
												setNewCollectionImage(null);
												setNewCollectionImagePreview(null);
											}}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Select
										value={formData.collection || 'none'}
										onValueChange={(value) =>
											setFormData({ ...formData, collection: value === 'none' ? '' : value })
										}
									>
										<SelectTrigger id="collection" className="flex-1">
											<SelectValue placeholder="Select collection (optional)" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">None</SelectItem>
											{collections.map((collection) => (
												<SelectItem key={collection.id} value={collection.name}>
													{collection.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{collections.length > 0 && (
										<Popover>
											<PopoverTrigger asChild>
												<Button type="button" variant="outline" size="icon" className="flex-shrink-0">
													<Trash2 className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-64">
												<div className="space-y-2">
													<h4 className="font-medium text-sm mb-2">Manage Collections</h4>
													<div className="space-y-1 max-h-60 overflow-y-auto">
														{collections.map((collection) => (
															<div key={collection.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
																<span className="text-sm">{collection.name}</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6 text-destructive hover:text-destructive"
																	onClick={() => setDeleteCollectionId(collection.id)}
																>
																	<Trash2 className="h-3 w-3" />
																</Button>
															</div>
														))}
													</div>
												</div>
											</PopoverContent>
										</Popover>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Cost, Selling Price and Discount */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="cost_price">Cost Price (₦) *</Label>
							<Input
								id="cost_price"
								type="number"
								step="0.01"
								min="0"
								value={formData.cost_price}
								onChange={handleChange}
								placeholder="0.00"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="selling_price">Selling Price (₦) *</Label>
							<Input
								id="selling_price"
								type="number"
								step="0.01"
								min="0"
								value={formData.selling_price}
								onChange={handleChange}
								placeholder="0.00"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="discount">Discount (%)</Label>
							<Input
								id="discount"
								type="number"
								min="0"
								max="100"
								step="1"
								value={formData.discount}
								onChange={handleChange}
								placeholder="0"
							/>
						</div>
					</div>

					{/* Stock */}
					<div className="space-y-2">
						<Label htmlFor="stock">Stock Quantity *</Label>
						<Input
							id="stock"
							type="number"
							min="0"
							value={formData.stock}
							onChange={handleChange}
							placeholder="0"
							required
						/>
					</div>

					{/* Features */}
					<div className="space-y-2">
						<Label htmlFor="features">Product Features</Label>
						<p className="text-sm text-muted-foreground mb-3">
							Add unique features or specifications for this product (e.g., "Swiss Automatic Movement", "Water Resistant 100m")
						</p>
						
						{/* Existing Features List */}
						{features.length > 0 && (
							<div className="space-y-2 mb-3">
								{features.map((feature, index) => (
									<div key={index} className="flex items-center gap-2">
										<div className="flex-1 px-3 py-2 bg-secondary border border-border rounded-sm text-sm">
											{feature}
										</div>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => {
												const updatedFeatures = features.filter((_, i) => i !== index);
												setFeatures(updatedFeatures);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Add New Feature */}
						<div className="flex items-center gap-2">
							<Input
								id="newFeature"
								value={newFeature}
								onChange={(e) => setNewFeature(e.target.value)}
								placeholder="Enter a feature (e.g., Water Resistant 100m)"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (newFeature.trim()) {
											setFeatures([...features, newFeature.trim()]);
											setNewFeature('');
										}
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => {
									if (newFeature.trim()) {
										setFeatures([...features, newFeature.trim()]);
										setNewFeature('');
									}
								}}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Product Tags Toggles */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Featured */}
						<div className="flex items-center justify-between space-x-2 rounded-md border border-border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="featured" className="text-base">
									Featured Product
								</Label>
								<p className="text-sm text-muted-foreground">
									Show this product in the featured section
								</p>
							</div>
							<Switch
								id="featured"
								checked={formData.featured}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, featured: checked })
								}
							/>
						</div>

						{/* New Arrival */}
						<div className="flex items-center justify-between space-x-2 rounded-md border border-border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="new_arrival" className="text-base">
									New Arrival
								</Label>
								<p className="text-sm text-muted-foreground">
									Mark this product as a new arrival
								</p>
							</div>
							<Switch
								id="new_arrival"
								checked={formData.new_arrival}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, new_arrival: checked })
								}
							/>
						</div>

						{/* Best Seller */}
						<div className="flex items-center justify-between space-x-2 rounded-md border border-border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="best_seller" className="text-base">
									Best Seller
								</Label>
								<p className="text-sm text-muted-foreground">
									Mark this product as a best seller
								</p>
							</div>
							<Switch
								id="best_seller"
								checked={formData.best_seller}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, best_seller: checked })
								}
							/>
						</div>

						{/* On Sale */}
						<div className="flex items-center justify-between space-x-2 rounded-md border border-border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="on_sale" className="text-base">
									On Sale
								</Label>
								<p className="text-sm text-muted-foreground">
									Mark this product as on sale
								</p>
							</div>
							<Switch
								id="on_sale"
								checked={formData.on_sale}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, on_sale: checked })
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" variant="hero" disabled={loading || uploadingImages}>
							{(loading || uploadingImages) ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{uploadingImages ? 'Uploading images...' : 'Creating...'}
								</>
							) : (
								'Create Product'
							)}
						</Button>
					</DialogFooter>
				</form>

				{/* Delete Collection Confirmation Dialog */}
				<AlertDialog open={deleteCollectionId !== null} onOpenChange={(open) => !open && setDeleteCollectionId(null)}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Collection</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete this collection? All products with this collection will have their collection set to null.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									if (deleteCollectionId) {
										const collection = collections.find(c => c.id === deleteCollectionId);
										if (collection) {
											handleDeleteCollection(deleteCollectionId, collection.name);
										}
									}
								}}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Delete Category Confirmation Dialog */}
				<AlertDialog open={deleteCategoryId !== null} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Category</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete this category? This action cannot be undone if products exist with this category. Products must be reassigned to another category before deletion.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									if (deleteCategoryId) {
										const category = categories.find(c => c.id === deleteCategoryId);
										if (category) {
											handleDeleteCategory(deleteCategoryId, category.name);
										}
									}
								}}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</DialogContent>
		</Dialog>
	);
};

export default AddProductModal;

