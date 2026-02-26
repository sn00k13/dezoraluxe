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
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react';
import type { Product, Collection, Category } from '@/types/database';

const checkSupabaseConfig = () => {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) {
		return { valid: false, error: 'Missing Supabase environment variables.' };
	}
	if (!url.includes('supabase.co')) {
		return { valid: false, error: 'Invalid Supabase URL.' };
	}
	return { valid: true, error: null };
};

interface EditProductModalProps {
	product: Product | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

const EditProductModal = ({ product, open, onOpenChange, onSuccess }: EditProductModalProps) => {
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
	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
	const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
	const [collections, setCollections] = useState<Collection[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({ ...formData, [e.target.id]: e.target.value });
	};

	// Populate form when product or open changes
	useEffect(() => {
		if (open && product) {
			const existingDiscount =
				product.selling_price && product.selling_price > 0
					? Math.round(((product.selling_price - product.price) / product.selling_price) * 100)
					: 0;
			setFormData({
				name: product.name ?? '',
				description: product.description ?? '',
				color: product.color ?? '',
				size: product.size ?? '',
				category: product.category ?? '',
				collection: product.collection ?? '',
				cost_price: String(product.cost_price ?? ''),
				selling_price: String(product.selling_price ?? product.price ?? ''),
				discount: String(Math.max(0, Math.min(100, existingDiscount))),
				stock: String(product.stock ?? ''),
				featured: product.featured ?? false,
				new_arrival: product.new_arrival ?? false,
				best_seller: product.best_seller ?? false,
				on_sale: product.on_sale ?? false,
			});
			setFeatures(Array.isArray(product.features) ? product.features : []);
			setNewFeature('');
			setExistingImages(Array.isArray(product.images) ? [...product.images] : []);
			setNewImageFiles([]);
			setNewImagePreviews([]);
		}
	}, [open, product]);

	const loadCollections = async () => {
		try {
			const { data, error } = await supabase
				.from('collections')
				.select('*')
				.order('name', { ascending: true });
			if (error) {
				setCollections([]);
				return;
			}
			setCollections(data || []);
		} catch {
			setCollections([]);
		}
	};

	const loadCategories = async () => {
		try {
			const { data, error } = await supabase
				.from('categories')
				.select('*')
				.order('name', { ascending: true });
			if (error) {
				setCategories([]);
				return;
			}
			setCategories(data || []);
		} catch {
			setCategories([]);
		}
	};

	useEffect(() => {
		if (open) {
			loadCollections();
			loadCategories();
		}
	}, [open]);

	const handleRemoveExistingImage = (index: number) => {
		setExistingImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;
		const valid = files.filter(
			(f) => f.type.startsWith('image/') && f.size <= 100 * 1024 * 1024
		);
		if (valid.length < files.length) toast.error('Some files were skipped (type/size).');
		if (valid.length > 0) {
			setNewImageFiles((prev) => [...prev, ...valid]);
			valid.forEach((file) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					setNewImagePreviews((prev) => [...prev, reader.result as string]);
				};
				reader.readAsDataURL(file);
			});
		}
		e.target.value = '';
	};

	const handleRemoveNewImage = (index: number) => {
		setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
		setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!product) return;
		setLoading(true);

		try {
			const configCheck = checkSupabaseConfig();
			if (!configCheck.valid) {
				toast.error(configCheck.error || 'Supabase not configured');
				setLoading(false);
				return;
			}

			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				toast.error('You must be logged in to update products');
				setLoading(false);
				return;
			}

			const isAdmin = await checkAdminStatus();
			if (!isAdmin) {
				toast.error('Admin privileges required');
				setLoading(false);
				return;
			}

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

			const allImages = existingImages.length + newImageFiles.length;
			if (allImages === 0) {
				toast.error('Product must have at least one image');
				setLoading(false);
				return;
			}

			const finalImageUrls = [...existingImages];

			if (newImageFiles.length > 0) {
				setUploadingImages(true);
				for (const file of newImageFiles) {
					const { url, error: uploadError } = await uploadImageToCloudinary(
						file,
						'products',
						{ tags: ['product', formData.category.toLowerCase()] }
					);
					if (uploadError || !url) {
						toast.warning(`Failed to upload ${file.name}`);
						finalImageUrls.push('/placeholder.svg');
					} else {
						finalImageUrls.push(url);
					}
				}
				setUploadingImages(false);
			}

			const sellingPrice = parseFloat(formData.selling_price);
			const finalPrice = sellingPrice * (1 - discountPercentage / 100);

			const { error } = await supabase
				.from('products')
				.update({
					name: formData.name,
					description: formData.description.trim() || null,
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
					features: features.filter((f) => f.trim() !== ''),
					updated_at: new Date().toISOString(),
				})
				.eq('id', product.id);

			if (error) {
				toast.error(error.message || 'Failed to update product');
				throw error;
			}

			toast.success('Product updated successfully');
			onOpenChange(false);
			onSuccess();
		} catch (err) {
			console.error('Error updating product:', err);
		} finally {
			setLoading(false);
		}
	};

	if (!product) return null;

	const allPreviews = [
		...existingImages.map((url) => ({ type: 'url' as const, src: url })),
		...newImagePreviews.map((src) => ({ type: 'preview' as const, src })),
	];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Product</DialogTitle>
					<DialogDescription>
						Update product details. All fields marked with * are required.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Product Images */}
					<div className="space-y-2">
						<Label>Product Images *</Label>
						<p className="text-sm text-muted-foreground mb-3">
							Existing images below. Remove or add new ones. First image is the main display.
						</p>
						{allPreviews.length > 0 && (
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
								{allPreviews.map((item, index) => (
									<div key={index} className="relative group">
										<img
											src={item.src}
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
											onClick={() => {
												if (index < existingImages.length) {
													handleRemoveExistingImage(index);
												} else {
													handleRemoveNewImage(index - existingImages.length);
												}
											}}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
						<div className="border-2 border-dashed border-border rounded-md p-6 text-center">
							<Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
							<Label htmlFor="edit-new-images" className="cursor-pointer">
								<span className="text-sm font-medium text-gold hover:text-gold-muted">
									Add more images
								</span>
							</Label>
							<Input
								id="edit-new-images"
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={handleNewImageChange}
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
							<Label htmlFor="category">Category *</Label>
							<Select
								value={formData.category}
								onValueChange={(value) => setFormData({ ...formData, category: value })}
								required
							>
								<SelectTrigger id="category">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat.id} value={cat.name}>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="collection">Collection</Label>
							<Select
								value={formData.collection || 'none'}
								onValueChange={(value) =>
									setFormData({ ...formData, collection: value === 'none' ? '' : value })
								}
							>
								<SelectTrigger id="collection">
									<SelectValue placeholder="Select collection (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{collections.map((col) => (
										<SelectItem key={col.id} value={col.name}>
											{col.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Cost, Selling Price & Discount */}
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
						<Label>Product Features</Label>
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
											onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
						<div className="flex items-center gap-2">
							<Input
								value={newFeature}
								onChange={(e) => setNewFeature(e.target.value)}
								placeholder="Add a feature"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (newFeature.trim()) {
											setFeatures((prev) => [...prev, newFeature.trim()]);
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
										setFeatures((prev) => [...prev, newFeature.trim()]);
										setNewFeature('');
									}
								}}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Toggles */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[
							{ id: 'featured', label: 'Featured Product', key: 'featured' as const },
							{ id: 'new_arrival', label: 'New Arrival', key: 'new_arrival' as const },
							{ id: 'best_seller', label: 'Best Seller', key: 'best_seller' as const },
							{ id: 'on_sale', label: 'On Sale', key: 'on_sale' as const },
						].map(({ id, label, key }) => (
							<div
								key={id}
								className="flex items-center justify-between space-x-2 rounded-md border border-border p-4"
							>
								<Label htmlFor={id} className="text-base">
									{label}
								</Label>
								<Switch
									id={id}
									checked={formData[key]}
									onCheckedChange={(checked) =>
										setFormData({ ...formData, [key]: checked })
									}
								/>
							</div>
						))}
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
									{uploadingImages ? 'Uploading...' : 'Saving...'}
								</>
							) : (
								'Save Changes'
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EditProductModal;
