import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';
import productSunglasses from '@/assets/product-sunglasses.jpg';

const favoriteProducts = [
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
];

const Favorites = () => {
	const [favorites, setFavorites] = useState(favoriteProducts);

	const removeFavorite = (id: number) => {
		setFavorites((items) => items.filter((item) => item.id !== id));
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
								My Favorites
							</h1>
							<p className="text-muted-foreground">
								Your saved items and wishlist
							</p>
						</div>
					</div>
				</section>

				{/* Favorites Grid */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						{favorites.length > 0 ? (
							<>
								<div className="mb-8 flex items-center justify-between">
									<p className="text-sm text-muted-foreground">
										{favorites.length} item{favorites.length !== 1 ? 's' : ''} saved
									</p>
									<Button
										variant="outline"
										onClick={() => setFavorites([])}
										className="text-sm"
									>
										Clear All
									</Button>
								</div>

								<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
									{favorites.map((product, index) => (
										<div key={product.id} className="relative group">
											<ProductCard product={product} index={index} />
											<Button
												variant="ghost"
												size="icon"
												className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
												onClick={() => removeFavorite(product.id)}
											>
												<Heart className="h-5 w-5 fill-primary text-primary" />
											</Button>
										</div>
									))}
								</div>
							</>
						) : (
							<div className="text-center py-16">
								<Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
								<p className="text-muted-foreground mb-6">
									Start adding items to your favorites
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

export default Favorites;

