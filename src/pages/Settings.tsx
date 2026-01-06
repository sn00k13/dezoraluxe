import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
	Bell,
	Shield,
	CreditCard,
	Globe,
	Moon,
	Mail,
	Lock,
	Trash2,
} from 'lucide-react';

const Settings = () => {
	const [notifications, setNotifications] = useState({
		email: true,
		push: false,
		sms: false,
		marketing: true,
	});
	const [preferences, setPreferences] = useState({
		currency: 'USD',
		language: 'en',
		theme: 'dark',
	});

	const handleNotificationChange = (key: string, value: boolean) => {
		setNotifications({ ...notifications, [key]: value });
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
								Settings
							</h1>
							<p className="text-muted-foreground">
								Manage your account settings and preferences
							</p>
						</div>
					</div>
				</section>

				{/* Settings Content */}
				<section className="py-16 md:py-24">
					<div className="container mx-auto px-6 max-w-4xl space-y-6">
						{/* Notifications */}
						<Card className="border-border">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="h-5 w-5" />
									Notifications
								</CardTitle>
								<CardDescription>
									Manage how you receive notifications
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="email-notifications">Email Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Receive updates via email
										</p>
									</div>
									<Switch
										id="email-notifications"
										checked={notifications.email}
										onCheckedChange={(checked) =>
											handleNotificationChange('email', checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="push-notifications">Push Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Receive push notifications
										</p>
									</div>
									<Switch
										id="push-notifications"
										checked={notifications.push}
										onCheckedChange={(checked) =>
											handleNotificationChange('push', checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="sms-notifications">SMS Notifications</Label>
										<p className="text-sm text-muted-foreground">
											Receive updates via SMS
										</p>
									</div>
									<Switch
										id="sms-notifications"
										checked={notifications.sms}
										onCheckedChange={(checked) =>
											handleNotificationChange('sms', checked)
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="marketing-notifications">Marketing Emails</Label>
										<p className="text-sm text-muted-foreground">
											Receive promotional emails
										</p>
									</div>
									<Switch
										id="marketing-notifications"
										checked={notifications.marketing}
										onCheckedChange={(checked) =>
											handleNotificationChange('marketing', checked)
										}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Preferences */}
						<Card className="border-border">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Globe className="h-5 w-5" />
									Preferences
								</CardTitle>
								<CardDescription>
									Customize your experience
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="currency">Currency</Label>
									<Select
										value={preferences.currency}
										onValueChange={(value) =>
											setPreferences({ ...preferences, currency: value })
										}
									>
										<SelectTrigger id="currency">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="USD">USD - US Dollar</SelectItem>
											<SelectItem value="EUR">EUR - Euro</SelectItem>
											<SelectItem value="GBP">GBP - British Pound</SelectItem>
											<SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="language">Language</Label>
									<Select
										value={preferences.language}
										onValueChange={(value) =>
											setPreferences({ ...preferences, language: value })
										}
									>
										<SelectTrigger id="language">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="en">English</SelectItem>
											<SelectItem value="es">Spanish</SelectItem>
											<SelectItem value="fr">French</SelectItem>
											<SelectItem value="de">German</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="theme">Theme</Label>
									<Select
										value={preferences.theme}
										onValueChange={(value) =>
											setPreferences({ ...preferences, theme: value })
										}
									>
										<SelectTrigger id="theme">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="dark">Dark</SelectItem>
											<SelectItem value="light">Light</SelectItem>
											<SelectItem value="system">System</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>

						{/* Security */}
						<Card className="border-border">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
									Security
								</CardTitle>
								<CardDescription>
									Manage your account security
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Button variant="outline" className="w-full justify-start">
									<Lock className="mr-2 h-4 w-4" />
									Change Password
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<CreditCard className="mr-2 h-4 w-4" />
									Payment Methods
								</Button>
								<Button variant="outline" className="w-full justify-start">
									<Mail className="mr-2 h-4 w-4" />
									Two-Factor Authentication
								</Button>
							</CardContent>
						</Card>

						{/* Danger Zone */}
						<Card className="border-border border-destructive/50">
							<CardHeader>
								<CardTitle className="text-destructive">Danger Zone</CardTitle>
								<CardDescription>
									Irreversible actions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button
									variant="destructive"
									className="w-full justify-start"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Account
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
};

export default Settings;

