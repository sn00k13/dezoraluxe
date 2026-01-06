import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import SignInForm from '@/components/auth/SignInForm';

const Navbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const navLinks = [
		{ name: 'New Arrivals', href: '/new-arrivals' },
		{ name: 'Collections', href: '/collections' },
		{ name: 'Accessories', href: '/accessories' },
		{ name: 'About', href: '/about' },
	];

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
			<div className="container mx-auto px-6">
				<div className="flex items-center justify-between h-16 md:h-20">
					{/* Logo */}
					<Link to="/" className="flex items-center">
						<img
							src="/images/DLX.png"
							alt="Dezora Luxe"
							className="h-10 w-auto object-contain"
						/>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-8">
						{navLinks.map((link) => (
							<Link
								key={link.name}
								to={link.href}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
							>
								{link.name}
							</Link>
						))}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" className="hidden md:flex">
							<Search className="h-5 w-5" />
						</Button>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon">
									<User className="h-5 w-5" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80" align="end">
								<SignInForm />
							</PopoverContent>
						</Popover>
						<Link to="/cart">
							<Button variant="ghost" size="icon" className="relative">
								<ShoppingBag className="h-5 w-5" />
								<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
									3
								</span>
							</Button>
						</Link>
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
						>
							{isMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			{isMenuOpen && (
				<div className="md:hidden bg-background border-t border-border animate-fade-up">
					<div className="container mx-auto px-6 py-6">
						<div className="flex flex-col gap-4">
							{navLinks.map((link) => (
								<Link
									key={link.name}
									to={link.href}
									className="text-lg font-medium text-foreground hover:text-primary transition-colors"
									onClick={() => setIsMenuOpen(false)}
								>
									{link.name}
								</Link>
							))}
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
