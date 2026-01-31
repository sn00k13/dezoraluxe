import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
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
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types/database';

const AllProducts = () => {
	const [searchParams] = useSearchParams();
	const searchQuery = searchParams.get('search') || '';
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [sortBy, setSortBy] = useState<string>('featured');
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				// Load categories
				const { data: categoriesData } = await supabase
					.from('categories')
					.select('*')
					.order('name', { ascending: true });

				setCategories(categoriesData || []);

				// Load products
				let query = supabase.from('products').select('*');

				// Apply category filter
				if (selectedCategory !== 'all') {
					query = query.eq('category', selectedCategory);
				}

				// Apply search filter
				if (searchQuery) {
					query = query.or(
						`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
					);
				} else {
					// If no search query, just get all products (or filtered by category)
				}

				// Apply sorting
				switch (sortBy) {
					case 'price-low':
						query = query.order('price', { ascending: true });
						break;
					case 'price-high':
						query = query.order('price', { ascending: false });
						break;
					case 'name':
						query = query.order('name', { ascending: true });
						break;
					case 'featured':
					default:
						query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
						break;
				}

				const { data: productsData, error } = await query;

				if (error) {
					console.error('Error loading products:', error);
					setProducts([]);
				} else {
					setProducts(productsData || []);
				}
			} catch (error) {
				console.error('Error loading data:', error);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [selectedCategory, sortBy, searchQuery]);

	// Filter products (client-side filtering for search is already done in query)
	const filteredProducts = products;

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
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category.id} value={category.name}>
											{category.name}
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
								{loading ? (
									<>Loading products...</>
								) : searchQuery ? (
									<>
										Showing {filteredProducts.length} results for "{searchQuery}"
									</>
								) : (
									<>
										Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
										{selectedCategory !== 'all' && ` in ${selectedCategory}`}
									</>
								)}
							</p>
						</div>

						{loading ? (
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
								{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
									<div
										key={i}
										className="aspect-square bg-card rounded-sm animate-pulse"
									/>
								))}
							</div>
						) : filteredProducts.length > 0 ? (
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
								{filteredProducts.map((product, index) => (
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

