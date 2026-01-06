import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SignUp = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.id]: e.target.value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Validate passwords match
		if (formData.password !== formData.confirmPassword) {
			alert('Passwords do not match');
			return;
		}
		// Handle sign up logic here
		console.log('Sign up:', formData);
	};

	const handleGoogleSignUp = () => {
		// Handle Google sign up
		console.log('Google sign up');
	};

	const handleFacebookSignUp = () => {
		// Handle Facebook sign up
		console.log('Facebook sign up');
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-20">
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6">
						<div className="max-w-md mx-auto">
							<div className="bg-card border border-border rounded-sm p-8 shadow-card">
								<div className="space-y-6">
									<div className="space-y-2 text-center">
										<h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
										<p className="text-sm text-muted-foreground">
											Join Dezora Luxe and discover premium essentials
										</p>
									</div>

									<form onSubmit={handleSubmit} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="name">Full Name</Label>
											<Input
												id="name"
												type="text"
												placeholder="John Doe"
												value={formData.name}
												onChange={handleChange}
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												placeholder="name@example.com"
												value={formData.email}
												onChange={handleChange}
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="password">Password</Label>
											<Input
												id="password"
												type="password"
												placeholder="Create a password"
												value={formData.password}
												onChange={handleChange}
												required
												minLength={8}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="confirmPassword">Confirm Password</Label>
											<Input
												id="confirmPassword"
												type="password"
												placeholder="Confirm your password"
												value={formData.confirmPassword}
												onChange={handleChange}
												required
												minLength={8}
											/>
										</div>

										<Button type="submit" className="w-full" variant="default">
											Sign Up
										</Button>
									</form>

									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<span className="w-full border-t border-border" />
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span className="bg-card px-2 text-muted-foreground">
												Or continue with
											</span>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<Button
											type="button"
											variant="outline"
											className="w-full"
											onClick={handleGoogleSignUp}
										>
											<svg
												className="mr-2 h-4 w-4"
												aria-hidden="true"
												focusable="false"
												data-prefix="fab"
												data-icon="google"
												role="img"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 488 512"
											>
												<path
													fill="currentColor"
													d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 52.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
												></path>
											</svg>
											Google
										</Button>
										<Button
											type="button"
											variant="outline"
											className="w-full"
											onClick={handleFacebookSignUp}
										>
											<svg
												className="mr-2 h-4 w-4"
												aria-hidden="true"
												focusable="false"
												data-prefix="fab"
												data-icon="facebook"
												role="img"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
											>
												<path
													fill="currentColor"
													d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"
												></path>
											</svg>
											Facebook
										</Button>
									</div>

									<div className="text-center text-sm">
										<span className="text-muted-foreground">Already have an account? </span>
										<Link
											to="/signin"
											className="text-gold hover:text-gold-muted font-medium transition-colors"
										>
											Sign In
										</Link>
									</div>
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

export default SignUp;

