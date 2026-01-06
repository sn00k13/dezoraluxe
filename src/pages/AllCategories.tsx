import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowUpRight } from 'lucide-react';
import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';
import productSunglasses from '@/assets/product-sunglasses.jpg';

const categories = [
	{
		name: 'Watches',
		count: 48,
		description: 'Masterfully crafted timepieces for the discerning individual',
		gradient: 'from-amber-900/40 to-charcoal-deep',
		image: productWatch,
	},
	{
		name: 'Bags',
		count: 36,
		description: 'Sophisticated bags and accessories for modern life',
		gradient: 'from-stone-800/40 to-charcoal-deep',
		image: productBag,
	},
	{
		name: 'Audio',
		count: 24,
		description: 'Premium sound systems for immersive experiences',
		gradient: 'from-zinc-800/40 to-charcoal-deep',
		image: productHeadphones,
	},
	{
		name: 'Eyewear',
		count: 32,
		description: 'Elegant eyewear that combines style and function',
		gradient: 'from-yellow-900/40 to-charcoal-deep',
		image: productSunglasses,
	},
	{
		name: 'Accessories',
		count: 28,
		description: 'Essential accessories to complete your look',
		gradient: 'from-purple-900/40 to-charcoal-deep',
		image: productBag,
	},
	{
		name: 'Wallets',
		count: 18,
		description: 'Premium leather wallets and card holders',
		gradient: 'from-orange-900/40 to-charcoal-deep',
		image: productBag,
	},
	{
		name: 'Belts',
		count: 22,
		description: 'Classic and contemporary belt designs',
		gradient: 'from-red-900/40 to-charcoal-deep',
		image: productBag,
	},
	{
		name: 'Jewelry',
		count: 35,
		description: 'Fine jewelry pieces for special occasions',
		gradient: 'from-blue-900/40 to-charcoal-deep',
		image: productWatch,
	},
];

const AllCategories = () => {
	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				{/* Hero Section */}
				<section className="py-16 md:py-24 border-b border-border">
					<div className="container mx-auto px-6">
						<div className="text-center space-y-4">
							<p className="text-sm uppercase tracking-[0.3em] text-gold">
								Browse All
							</p>
							<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
								All Categories
							</h1>
							<p className="text-muted-foreground max-w-md mx-auto">
								Explore our complete range of premium categories, each curated with
								uncompromising quality and style.
							</p>
						</div>
					</div>
				</section>

				{/* Categories Grid */}
				<section className="py-16 md:py-32 bg-charcoal">
					<div className="container mx-auto px-6">
						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
							{categories.map((category, index) => (
								<Link
									key={category.name}
									to={`/collections/${category.name.toLowerCase()}`}
									className="group relative h-80 overflow-hidden rounded-sm opacity-0 animate-fade-up"
									style={{
										animationDelay: `${index * 100}ms`,
										animationFillMode: 'forwards',
									}}
								>
									{/* Background Image */}
									<div className="absolute inset-0">
										<img
											src={category.image}
											alt={category.name}
											className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
										/>
										<div
											className={`absolute inset-0 bg-gradient-to-b ${category.gradient}`}
										/>
									</div>

									{/* Content */}
									<div className="relative h-full flex flex-col justify-between p-6">
										<div className="flex justify-end">
											<div className="w-10 h-10 rounded-full border border-cream/20 flex items-center justify-center group-hover:bg-cream group-hover:border-cream transition-all duration-300">
												<ArrowUpRight className="h-5 w-5 text-cream group-hover:text-charcoal-deep transition-colors duration-300" />
											</div>
										</div>

										<div>
											<p className="text-sm text-cream/60 mb-1">
												{category.count} Products
											</p>
											<h3 className="text-2xl font-bold text-cream group-hover:text-gold transition-colors duration-300 mb-2">
												{category.name}
											</h3>
											<p className="text-sm text-cream/80 line-clamp-2">
												{category.description}
											</p>
										</div>
									</div>

									{/* Hover overlay */}
									<div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								</Link>
							))}
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default AllCategories;

