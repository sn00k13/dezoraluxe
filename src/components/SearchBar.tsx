import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';

interface Product {
	id: number | string;
	name: string;
	category: string;
	price: number;
	image: string;
}

import productWatch from '@/assets/product-watch.jpg';
import productBag from '@/assets/product-bag.jpg';
import productHeadphones from '@/assets/product-headphones.jpg';
import productSunglasses from '@/assets/product-sunglasses.jpg';

// Mock products for search (until Supabase is fully set up)
const mockProducts: Product[] = [
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

const SearchBar = () => {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Product[]>([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		const searchProducts = async () => {
			if (searchQuery.trim().length < 2) {
				setSearchResults([]);
				return;
			}

			setLoading(true);

			try {
				// Try to search from Supabase first
				const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
				if (supabaseUrl) {
					const { data, error } = await supabase
						.from('products')
						.select('id, name, category, price, images')
						.or(
							`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
						)
						.limit(10);

					if (!error && data) {
						const formattedResults = data.map((product: { id: string; name: string; category: string; price: number; images?: string[] }) => ({
							id: product.id,
							name: product.name,
							category: product.category,
							price: product.price,
							image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
						}));
						setSearchResults(formattedResults);
						setLoading(false);
						return;
					}
				}

				// Fallback to mock data
				const filtered = mockProducts.filter(
					(product) =>
						product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						product.category.toLowerCase().includes(searchQuery.toLowerCase())
				);
				setSearchResults(filtered);
			} catch (error) {
				console.error('Search error:', error);
				// Fallback to mock data on error
				const filtered = mockProducts.filter(
					(product) =>
						product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						product.category.toLowerCase().includes(searchQuery.toLowerCase())
				);
				setSearchResults(filtered);
			} finally {
				setLoading(false);
			}
		};

		const debounceTimer = setTimeout(() => {
			searchProducts();
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [searchQuery]);

	const handleSelectProduct = (productId: number | string) => {
		setOpen(false);
		setSearchQuery('');
		navigate(`/product/${productId}`);
	};

	const handleViewAll = () => {
		setOpen(false);
		navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon">
					<Search className="h-5 w-5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="end">
				<Command shouldFilter={false}>
					<div className="flex items-center border-b border-border px-3">
						<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
						<Input
							ref={inputRef}
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
						{searchQuery && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => {
									setSearchQuery('');
									setSearchResults([]);
								}}
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
					<CommandList>
						{loading && (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Searching...
							</div>
						)}
						{!loading && searchQuery.length < 2 && (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Type at least 2 characters to search
							</div>
						)}
						{!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
							<CommandEmpty>No products found.</CommandEmpty>
						)}
						{!loading && searchResults.length > 0 && (
							<>
								<CommandGroup heading="Products">
									{searchResults.slice(0, 5).map((product) => (
										<CommandItem
											key={product.id}
											value={product.id.toString()}
											onSelect={() => handleSelectProduct(product.id)}
											className="flex items-center gap-3 cursor-pointer"
										>
											<img
												src={product.image}
												alt={product.name}
												className="w-10 h-10 object-cover rounded-sm"
											/>
											<div className="flex-1">
												<p className="text-sm font-medium">{product.name}</p>
												<p className="text-xs text-muted-foreground">
													{product.category}
												</p>
											</div>
											<p className="text-sm font-semibold text-gradient-gold">
												${product.price}
											</p>
										</CommandItem>
									))}
								</CommandGroup>
								{searchResults.length > 5 && (
									<div className="border-t border-border p-2">
										<Button
											variant="ghost"
											className="w-full justify-center"
											onClick={handleViewAll}
										>
											View all {searchResults.length} results
										</Button>
									</div>
								)}
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default SearchBar;

