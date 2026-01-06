import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
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
import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';
import productSunglasses from '@/assets/product-sunglasses.jpg';

const products = [
	{
		id: 1,
		name: 'Signature Timepiece',
		category: 'Watches',
		price: 2499,
		image: productWatch,
		description:
			'A masterfully crafted timepiece that combines precision engineering with timeless elegance. Features a premium stainless steel case, sapphire crystal, and Swiss movement.',
		features: [
			'Swiss Automatic Movement',
			'Sapphire Crystal',
			'Water Resistant 100m',
			'Stainless Steel Case',
			'2-Year Warranty',
		],
		rating: 4.9,
		reviews: 127,
		inStock: true,
	},
	{
		id: 2,
		name: 'Executive Tote',
		category: 'Bags',
		price: 899,
		image: productBag,
		description:
			'Premium leather tote designed for the modern professional. Spacious interior with multiple compartments, perfect for work and travel.',
		features: [
			'Genuine Leather',
			'Multiple Compartments',
			'Adjustable Strap',
			'Laptop Sleeve Included',
			'Lifetime Warranty',
		],
		rating: 4.8,
		reviews: 89,
		inStock: true,
	},
	{
		id: 3,
		name: 'Studio Pro Max',
		category: 'Audio',
		price: 549,
		image: productHeadphones,
		description:
			'Professional-grade headphones with exceptional sound quality. Perfect for music production, gaming, or immersive listening experiences.',
		features: [
			'Active Noise Cancellation',
			'30-Hour Battery Life',
			'Premium Drivers',
			'Comfortable Memory Foam',
			'Wireless & Wired',
		],
		rating: 4.7,
		reviews: 203,
		inStock: true,
	},
	{
		id: 4,
		name: 'Aviator Classic',
		category: 'Eyewear',
		price: 329,
		image: productSunglasses,
		description:
			'Classic aviator sunglasses with UV protection and polarized lenses. Timeless design that never goes out of style.',
		features: [
			'100% UV Protection',
			'Polarized Lenses',
			'Lightweight Frame',
			'Scratch Resistant',
			'Case Included',
		],
		rating: 4.6,
		reviews: 156,
		inStock: true,
	},
];

const ProductDetail = () => {
	const { id } = useParams<{ id: string }>();
	const product = products.find((p) => p.id === Number(id));
	const [quantity, setQuantity] = useState(1);
	const [isFavorite, setIsFavorite] = useState(false);
	const [selectedImage, setSelectedImage] = useState(0);

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

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
		}).format(price);
	};

	const images = [product.image, product.image, product.image];

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
								<div className="aspect-square overflow-hidden rounded-sm bg-card">
									<img
										src={images[selectedImage]}
										alt={product.name}
										className="w-full h-full object-cover"
									/>
								</div>
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
												src={img}
												alt={`${product.name} view ${index + 1}`}
												className="w-full h-full object-cover"
											/>
										</button>
									))}
								</div>
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
									<div className="flex items-center gap-4 mb-4">
										<div className="flex items-center gap-1">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													className={`h-5 w-5 ${
														i < Math.floor(product.rating)
															? 'fill-gold text-gold'
															: 'text-muted-foreground'
													}`}
												/>
											))}
										</div>
										<span className="text-sm text-muted-foreground">
											{product.rating} ({product.reviews} reviews)
										</span>
									</div>
									<p className="text-3xl font-bold text-gradient-gold">
										{formatPrice(product.price)}
									</p>
								</div>

								<div className="space-y-4">
									<p className="text-muted-foreground leading-relaxed">
										{product.description}
									</p>

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
								</div>

								{/* Quantity and Actions */}
								<div className="space-y-4 pt-4 border-t border-border">
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
												onClick={() => setQuantity(quantity + 1)}
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
											disabled={!product.inStock}
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

									{!product.inStock && (
										<p className="text-sm text-destructive">
											This item is currently out of stock
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

