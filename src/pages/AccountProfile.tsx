import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';

const AccountProfile = () => {
	const [isEditing, setIsEditing] = useState(false);
	const [profile, setProfile] = useState({
		firstName: 'John',
		lastName: 'Doe',
		email: 'john.doe@example.com',
		phone: '+1 (555) 123-4567',
		address: '123 Main Street',
		city: 'New York',
		state: 'NY',
		zipCode: '10001',
		country: 'United States',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setProfile({
			...profile,
			[e.target.id]: e.target.value,
		});
	};

	const handleSave = () => {
		// Handle save logic here
		setIsEditing(false);
	};

	const handleCancel = () => {
		// Reset to original values
		setIsEditing(false);
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
								My Profile
							</h1>
							<p className="text-muted-foreground">
								Manage your account information and preferences
							</p>
						</div>
					</div>
				</section>

				{/* Profile Content */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6 max-w-4xl">
						<div className="grid md:grid-cols-3 gap-8">
							{/* Sidebar */}
							<div className="md:col-span-1">
								<Card className="border-border">
									<CardContent className="p-6">
										<div className="flex flex-col items-center text-center space-y-4">
											<div className="w-24 h-24 rounded-full bg-card border-2 border-gold flex items-center justify-center">
												<User className="h-12 w-12 text-gold" />
											</div>
											<div>
												<h2 className="text-xl font-bold">
													{profile.firstName} {profile.lastName}
												</h2>
												<p className="text-sm text-muted-foreground">
													{profile.email}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Main Content */}
							<div className="md:col-span-2">
								<Card className="border-border">
									<CardHeader className="flex flex-row items-center justify-between">
										<CardTitle>Personal Information</CardTitle>
										{!isEditing ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setIsEditing(true)}
											>
												<Edit2 className="mr-2 h-4 w-4" />
												Edit
											</Button>
										) : (
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={handleCancel}
												>
													<X className="mr-2 h-4 w-4" />
													Cancel
												</Button>
												<Button
													variant="default"
													size="sm"
													onClick={handleSave}
												>
													<Save className="mr-2 h-4 w-4" />
													Save
												</Button>
											</div>
										)}
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="grid md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="firstName">First Name</Label>
												<Input
													id="firstName"
													value={profile.firstName}
													onChange={handleChange}
													disabled={!isEditing}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="lastName">Last Name</Label>
												<Input
													id="lastName"
													value={profile.lastName}
													onChange={handleChange}
													disabled={!isEditing}
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="email" className="flex items-center gap-2">
												<Mail className="h-4 w-4" />
												Email
											</Label>
											<Input
												id="email"
												type="email"
												value={profile.email}
												onChange={handleChange}
												disabled={!isEditing}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="phone" className="flex items-center gap-2">
												<Phone className="h-4 w-4" />
												Phone
											</Label>
											<Input
												id="phone"
												type="tel"
												value={profile.phone}
												onChange={handleChange}
												disabled={!isEditing}
											/>
										</div>

										<div className="pt-4 border-t border-border">
											<h3 className="font-semibold mb-4 flex items-center gap-2">
												<MapPin className="h-4 w-4" />
												Address
											</h3>
											<div className="space-y-4">
												<div className="space-y-2">
													<Label htmlFor="address">Street Address</Label>
													<Input
														id="address"
														value={profile.address}
														onChange={handleChange}
														disabled={!isEditing}
													/>
												</div>
												<div className="grid md:grid-cols-3 gap-4">
													<div className="space-y-2">
														<Label htmlFor="city">City</Label>
														<Input
															id="city"
															value={profile.city}
															onChange={handleChange}
															disabled={!isEditing}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="state">State</Label>
														<Input
															id="state"
															value={profile.state}
															onChange={handleChange}
															disabled={!isEditing}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="zipCode">Zip Code</Label>
														<Input
															id="zipCode"
															value={profile.zipCode}
															onChange={handleChange}
															disabled={!isEditing}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label htmlFor="country">Country</Label>
													<Input
														id="country"
														value={profile.country}
														onChange={handleChange}
														disabled={!isEditing}
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default AccountProfile;

