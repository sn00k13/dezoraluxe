import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.id]: e.target.value,
		});
		setError('');
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Basic validation - in production, this would call an API
		if (formData.email === 'admin@dezoraluxe.com' && formData.password === 'admin123') {
			// Store admin session (in production, use proper auth)
			localStorage.setItem('adminAuthenticated', 'true');
			navigate('/admin/dashboard');
		} else {
			setError('Invalid email or password');
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<Card className="border-border shadow-card">
					<CardHeader className="text-center space-y-4">
						<div className="mx-auto w-16 h-16 rounded-full bg-card border-2 border-gold flex items-center justify-center">
							<Shield className="h-8 w-8 text-gold" />
						</div>
						<div>
							<CardTitle className="text-2xl">Admin Login</CardTitle>
							<CardDescription>
								Access the admin dashboard to manage your store
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
									{error}
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="admin@dezoraluxe.com"
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
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleChange}
									required
								/>
							</div>
							<Button type="submit" variant="hero" className="w-full" size="lg">
								Sign In
							</Button>
						</form>
						<div className="mt-4 text-center text-xs text-muted-foreground">
							<p>Demo: admin@dezoraluxe.com / admin123</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AdminLogin;

