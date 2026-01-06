import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';
import productSunglasses from '@/assets/product-sunglasses.jpg';

const allProducts = [
	{
		id: 1,
		name: 'Signature Timepiece',
		category: 'Watches',
		price: 2499,
		image: productWatch,
	},
	{
		id: 2,
		name: 'Executive Tote',
		category: 'Bags',
		price: 899,
		image: productBag,
	},
	{
		id: 3,
		name: 'Studio Pro Max',
		category: 'Audio',
		price: 549,
		image: productHeadphones,
	},
	{
		id: 4,
		name: 'Aviator Classic',
		category: 'Eyewear',
		price: 329,
		image: productSunglasses,
	},
	{
		id: 5,
		name: 'Elite Chronograph',
		category: 'Watches',
		price: 3299,
		image: productWatch,
	},
	{
		id: 6,
		name: 'Minimalist Backpack',
		category: 'Bags',
		price: 649,
		image: productBag,
	},
	{
		id: 7,
		name: 'Wireless Studio',
		category: 'Audio',
		price: 449,
		image: productHeadphones,
	},
	{
		id: 8,
		name: 'Retro Shades',
		category: 'Eyewear',
		price: 279,
		image: productSunglasses,
	},
	{
		id: 9,
		name: 'Luxury Watch Collection',
		category: 'Watches',
		price: 1899,
		image: productWatch,
	},
	{
		id: 10,
		name: 'Designer Handbag',
		category: 'Bags',
		price: 1299,
		image: productBag,
	},
	{
		id: 11,
		name: 'Premium Headphones',
		category: 'Audio',
		price: 699,
		image: productHeadphones,
	},
	{
		id: 12,
		name: 'Sunglasses Pro',
		category: 'Eyewear',
		price: 399,
		image: productSunglasses,
	},
	{
		id: 13,
		name: 'Classic Timepiece',
		category: 'Watches',
		price: 1599,
		image: productWatch,
	},
	{
		id: 14,
		name: 'Travel Bag',
		category: 'Bags',
		price: 799,
		image: productBag,
	},
	{
		id: 15,
		name: 'Wireless Earbuds',
		category: 'Audio',
		price: 349,
		image: productHeadphones,
	},
	{
		id: 16,
		name: 'Aviator Pro',
		category: 'Eyewear',
		price: 459,
		image: productSunglasses,
	},
];

const AllProducts = () => {
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [sortBy, setSortBy] = useState<string>('featured');

	const categories = ['all', 'Watches', 'Bags', 'Audio', 'Eyewear'];

	const filteredProducts =
		selectedCategory === 'all'
			? allProducts
			: allProducts.filter((product) => product.category === selectedCategory);

	const sortedProducts = [...filteredProducts].sort((a, b) => {
		switch (sortBy) {
			case 'price-low':
				return a.price - b.price;
			case 'price-high':
				return b.price - a.price;
			case 'name':
				return a.name.localeCompare(b.name);
			default:
				return 0;
		}
	});

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Hero Section */}
				<section className="py-16 md:py-24 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="text-center space-y-4">
							<p className="text-sm uppercase tracking-[0.3em] text-gold">
								Complete Collection
							</p>
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
								All Products
							</h1>
							<p className="text-muted-foreground max-w-md mx-auto">
								Browse our complete collection of premium products, carefully curated
								for quality and style.
							</p>
						</div>
					</div>
				</section>

				{/* Filters and Sort */}
				<section className="py-8 border-b border-border bg-card">
					<div className="container mx-auto px-6">
						<div className="flex flex-col md:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
								<span className="text-sm font-medium text-foreground">Filters:</span>
								<Select value={selectedCategory} onValueChange={setSelectedCategory}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((category) => (
											<SelectItem key={category} value={category}>
												{category === 'all' ? 'All Categories' : category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center gap-4">
								<span className="text-sm font-medium text-foreground">Sort by:</span>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Sort" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="featured">Featured</SelectItem>
										<SelectItem value="price-low">Price: Low to High</SelectItem>
										<SelectItem value="price-high">Price: High to Low</SelectItem>
										<SelectItem value="name">Name: A to Z</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</section>

				{/* Products Grid */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						<div className="mb-8">
							<p className="text-sm text-muted-foreground">
								Showing {sortedProducts.length} of {allProducts.length} products
								{selectedCategory !== 'all' && ` in ${selectedCategory}`}
							</p>
						</div>

						{sortedProducts.length > 0 ? (
							<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
								{sortedProducts.map((product, index) => (
									<ProductCard
										key={product.id}
										product={product}
										index={index}
									/>
								))}
							</div>
						) : (
							<div className="text-center py-16">
								<p className="text-lg text-muted-foreground">
									No products found in this category.
								</p>
								<Button
									variant="outline"
									className="mt-4"
									onClick={() => setSelectedCategory('all')}
								>
									View All Products
								</Button>
							</div>
						)}
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default AllProducts;

