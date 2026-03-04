import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Heart,
	ShoppingBag,
	Minus,
	Plus,
	Star,
	Check,
	ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductVariant } from '@/types/database';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { useCart } from '@/contexts/CartContext';

const ProductDetail = () => {
	const { id } = useParams<{ id: string }>();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [isFavorite, setIsFavorite] = useState(false);
	const [selectedImage, setSelectedImage] = useState(0);
	const [variants, setVariants] = useState<ProductVariant[]>([]);
	const [selectedColor, setSelectedColor] = useState<string>('');
	const [selectedSize, setSelectedSize] = useState<string>('');
	const { addToCart } = useCart();

	useEffect(() => {
		const loadProduct = async () => {
			if (!id) {
				setLoading(false);
				return;
			}

			try {
				const { data, error } = await supabase
					.from('products')
					.select('*')
					.eq('id', id)
					.single();

				if (error) {
					console.error('Error loading product:', error);
					setProduct(null);
				} else {
					setProduct(data);
					const { data: variantRows } = await supabase
						.from('product_variants')
						.select('*')
						.eq('product_id', data.id)
						.order('color', { ascending: true })
						.order('size', { ascending: true });
					setVariants(variantRows || []);
				}
			} catch (error) {
				console.error('Error loading product:', error);
				setProduct(null);
			} finally {
				setLoading(false);
			}
		};

		loadProduct();
	}, [id]);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const hasVariantInventory = variants.length > 0;
	const uniqueColors = Array.from(new Set(variants.map((variant) => variant.color))).filter(Boolean);
	const relevantVariants = selectedColor
		? variants.filter((variant) => variant.color === selectedColor)
		: variants;
	const uniqueSizes = Array.from(new Set(relevantVariants.map((variant) => variant.size))).filter(Boolean);
	const selectedVariant =
		variants.find(
			(variant) => variant.color === selectedColor && variant.size === selectedSize
		) ?? null;
	const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
	const displayedMainImage =
		selectedVariant?.image_url || product?.images?.[selectedImage] || '/placeholder.svg';

	useEffect(() => {
		if (!hasVariantInventory) return;
		if (!selectedColor && uniqueColors.length > 0) {
			setSelectedColor(uniqueColors[0]);
		}
	}, [hasVariantInventory, selectedColor, uniqueColors]);

	useEffect(() => {
		if (!hasVariantInventory || !selectedColor) return;
		const colorSizes = variants
			.filter((variant) => variant.color === selectedColor)
			.map((variant) => variant.size);
		if (!colorSizes.includes(selectedSize)) {
			setSelectedSize(colorSizes[0] ?? '');
		}
	}, [hasVariantInventory, selectedColor, selectedSize, variants]);

	useEffect(() => {
		if (quantity > currentStock) {
			setQuantity(Math.max(1, currentStock));
		}
	}, [currentStock, quantity]);

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<main className="pt-20">
					<div className="container mx-auto px-6 py-24">
						<div className="grid lg:grid-cols-2 gap-12">
							<div className="aspect-square bg-card rounded-sm animate-pulse" />
							<div className="space-y-4">
								<div className="h-8 bg-card rounded animate-pulse" />
								<div className="h-4 bg-card rounded animate-pulse w-3/4" />
								<div className="h-12 bg-card rounded animate-pulse" />
							</div>
						</div>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!product) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<main className="pt-20">
					<div className="container mx-auto px-6 py-24 text-center">
						<h1 className="text-2xl font-bold mb-4">Product not found</h1>
						<Link to="/products">
							<Button>Back to Products</Button>
						</Link>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	// Use product images array, or fallback to placeholder
	const images = product.images && product.images.length > 0 
		? product.images 
		: ['/placeholder.svg'];
	const selectedUnitPrice = selectedVariant?.price ?? product.price;
	const originalPrice = product.selling_price ?? product.price;
	const discountPercentage =
		originalPrice > 0 ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
	const hasDiscount = discountPercentage > 0;

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Breadcrumb */}
				<section className="py-6 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Link
								to="/"
								className="hover:text-foreground transition-colors"
							>
								Home
							</Link>
							<span>/</span>
							<Link
								to="/products"
								className="hover:text-foreground transition-colors"
							>
								Products
							</Link>
							<span>/</span>
							<Link
								to={`/collections/${product.category.toLowerCase()}`}
								className="hover:text-foreground transition-colors"
							>
								{product.category}
							</Link>
							<span>/</span>
							<span className="text-foreground">{product.name}</span>
						</div>
					</div>
				</section>

				{/* Product Detail */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						<Link
							to="/products"
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Products
						</Link>

						<div className="grid lg:grid-cols-2 gap-12">
							{/* Product Images */}
							<div className="space-y-4">
								<div className="relative aspect-square overflow-hidden rounded-sm bg-card">
									{hasDiscount && (
										<div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-sm">
											-{discountPercentage}%
										</div>
									)}
									<img
										src={
											displayedMainImage
												? getOptimizedCloudinaryUrl(displayedMainImage, {
														width: 800,
														height: 800,
														crop: 'fill',
														quality: 'auto',
													})
												: '/placeholder.svg'
										}
										alt={product.name}
										className="w-full h-full object-cover"
									/>
								</div>
								{images.length > 1 && (
									<div className="grid grid-cols-3 gap-4">
										{images.map((img, index) => (
											<button
												key={index}
												onClick={() => setSelectedImage(index)}
												className={`aspect-square overflow-hidden rounded-sm border-2 transition-all ${
													selectedImage === index
														? 'border-gold'
														: 'border-border hover:border-gold/50'
												}`}
											>
												<img
													src={getOptimizedCloudinaryUrl(img, {
														width: 200,
														height: 200,
														crop: 'fill',
														quality: 'auto',
													})}
													alt={`${product.name} view ${index + 1}`}
													className="w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Product Info */}
							<div className="space-y-6">
								<div>
									<p className="text-sm uppercase tracking-wider text-gold mb-2">
										{product.category}
									</p>
									<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
										{product.name}
									</h1>
									{/* Rating removed - not in database schema */}
									<div className="flex items-center gap-3">
										<p className="text-3xl font-bold text-gradient-gold">
											{formatPrice(selectedUnitPrice)}
										</p>
										{hasDiscount && (
											<p className="text-lg text-muted-foreground line-through">
												{formatPrice(originalPrice)}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-4">
									{product.description && (
										<p className="text-muted-foreground leading-relaxed">
											{product.description}
										</p>
									)}

									{product.features && product.features.length > 0 && (
										<div className="space-y-2">
											<h3 className="font-semibold">Features:</h3>
											<ul className="space-y-2">
												{product.features.map((feature, index) => (
													<li key={index} className="flex items-center gap-2">
														<Check className="h-4 w-4 text-gold flex-shrink-0" />
														<span className="text-sm">{feature}</span>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>

								{/* Quantity and Actions */}
								<div className="space-y-4 pt-4 border-t border-border">
									{hasVariantInventory && (
										<div className="space-y-4">
											<div>
												<p className="text-sm font-medium mb-2">Color</p>
												<div className="flex flex-wrap gap-2">
													{uniqueColors.map((color) => (
														<Button
															key={color}
															type="button"
															size="sm"
															variant={selectedColor === color ? 'default' : 'outline'}
															onClick={() => setSelectedColor(color)}
														>
															{color}
														</Button>
													))}
												</div>
											</div>
											<div>
												<p className="text-sm font-medium mb-2">Size</p>
												<div className="flex flex-wrap gap-2">
													{uniqueSizes.map((size) => {
														const sizeVariant = variants.find(
															(variant) =>
																variant.color === selectedColor && variant.size === size
														);
														const isOut = (sizeVariant?.stock ?? 0) <= 0;
														return (
															<Button
																key={size}
																type="button"
																size="sm"
																variant={selectedSize === size ? 'default' : 'outline'}
																onClick={() => setSelectedSize(size)}
																disabled={isOut}
															>
																{size}
															</Button>
														);
													})}
												</div>
											</div>
										</div>
									)}
									<div className="flex items-center gap-4">
										<span className="text-sm font-medium">Quantity:</span>
										<div className="flex items-center gap-3">
											<Button
												variant="outline"
												size="icon"
												onClick={() => setQuantity(Math.max(1, quantity - 1))}
											>
												<Minus className="h-4 w-4" />
											</Button>
											<span className="w-12 text-center font-medium">
												{quantity}
											</span>
											<Button
												variant="outline"
												size="icon"
												onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
												disabled={quantity >= currentStock}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									</div>

									<div className="flex gap-4">
										<Button
											variant="hero"
											className="flex-1"
											size="lg"
											disabled={currentStock <= 0 || (hasVariantInventory && !selectedVariant)}
											onClick={() =>
												addToCart(product.id, quantity, {
													variantId: selectedVariant?.id ?? null,
													selectedColor: selectedVariant?.color ?? null,
													selectedSize: selectedVariant?.size ?? null,
												})
											}
										>
											<ShoppingBag className="mr-2 h-5 w-5" />
											Add to Cart
										</Button>
										<Button
											variant="outline"
											size="icon"
											className="h-12 w-12"
											onClick={() => setIsFavorite(!isFavorite)}
										>
											<Heart
												className={`h-5 w-5 ${
													isFavorite
														? 'fill-primary text-primary'
														: ''
												}`}
											/>
										</Button>
									</div>

									{currentStock <= 0 && (
										<p className="text-sm text-destructive">
											This item is currently out of stock
										</p>
									)}
									{currentStock > 0 && currentStock < 10 && (
										<p className="text-sm text-gold">
											Only {currentStock} left in stock
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default ProductDetail;

