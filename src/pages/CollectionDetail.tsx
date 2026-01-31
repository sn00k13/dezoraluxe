import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const CollectionDetail = () => {
	const { categoryName } = useParams<{ categoryName: string }>();
	const [products, setProducts] = useState<Product[]>([]);
	const [category, setCategory] = useState<Category | null>(null);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<string>('featured');

	useEffect(() => {
		const loadData = async () => {
			if (!categoryName) {
				setLoading(false);
				return;
			}

			try {
				// Convert URL param to proper category name (capitalize first letter)
				const categoryNameFormatted = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

				// Load category info
				const { data: categoryData } = await supabase
					.from('categories')
					.select('*')
					.eq('name', categoryNameFormatted)
					.single();

				setCategory(categoryData || null);

				// Load products for this category
				let query = supabase
					.from('products')
					.select('*')
					.eq('category', categoryNameFormatted);

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
	}, [categoryName, sortBy]);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Hero Section */}
				<section className="py-16 md:py-24 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="text-center space-y-4">
							<p className="text-sm uppercase tracking-[0.3em] text-gold">
								{category?.name || categoryName}
							</p>
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
								{category?.name || categoryName} Collection
							</h1>
							{category?.description && (
								<p className="text-muted-foreground max-w-md mx-auto">
									{category.description}
								</p>
							)}
						</div>
					</div>
				</section>

				{/* Sort */}
				<section className="py-8 border-b border-border bg-card">
					<div className="container mx-auto px-6">
						<div className="flex items-center justify-end gap-4">
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
				</section>

				{/* Products Grid */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						<div className="mb-8">
							<p className="text-sm text-muted-foreground">
								{loading ? (
									<>Loading products...</>
								) : (
									<>
										Showing {products.length} product{products.length !== 1 ? 's' : ''}
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
						) : products.length === 0 ? (
							<div className="text-center py-16">
								<p className="text-lg text-muted-foreground mb-4">
									No products found in this category.
								</p>
								<Link to="/products">
									<Button variant="outline">View All Products</Button>
								</Link>
							</div>
						) : (
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
								{products.map((product, index) => (
									<ProductCard
										key={product.id}
										product={product}
										index={index}
									/>
								))}
							</div>
						)}
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default CollectionDetail;

