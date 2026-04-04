import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DeliveryOption } from '@/types/database';
import { toast } from 'sonner';

const formatPrice = (price: number) =>
	new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: 'NGN',
		minimumFractionDigits: 0,
	}).format(price);

const num = (v: string) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
};

const DeliveryOptionsManager = () => {
	const [rows, setRows] = useState<DeliveryOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [actionId, setActionId] = useState<string | null>(null);

	const [newName, setNewName] = useState('');
	const [newCompany, setNewCompany] = useState('');
	const [newPrice, setNewPrice] = useState('');
	const [newEstimated, setNewEstimated] = useState('');
	const [newActive, setNewActive] = useState(true);

	const [editOpen, setEditOpen] = useState(false);
	const [editing, setEditing] = useState<DeliveryOption | null>(null);
	const [editName, setEditName] = useState('');
	const [editCompany, setEditCompany] = useState('');
	const [editPrice, setEditPrice] = useState('');
	const [editEstimated, setEditEstimated] = useState('');
	const [editSort, setEditSort] = useState('');
	const [editActive, setEditActive] = useState(true);

	const loadRows = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from('delivery_options')
				.select('*')
				.order('sort_order', { ascending: true });

			if (error) throw error;
			setRows((data as DeliveryOption[]) || []);
		} catch (error) {
			console.error('Error loading delivery options:', error);
			toast.error('Failed to load delivery options. Apply the delivery_options migration if this is a new setup.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadRows();
	}, []);

	const resetCreateForm = () => {
		setNewName('');
		setNewCompany('');
		setNewPrice('');
		setNewEstimated('');
		setNewActive(true);
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		const price = num(newPrice);
		if (!newName.trim()) {
			toast.error('Name is required');
			return;
		}
		if (!Number.isFinite(price) || price < 0) {
			toast.error('Enter a valid price (0 or greater)');
			return;
		}

		const nextOrder =
			rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;

		setSubmitting(true);
		try {
			const { error } = await supabase.from('delivery_options').insert({
				name: newName.trim(),
				company: newCompany.trim(),
				price,
				estimated_days: newEstimated.trim(),
				sort_order: nextOrder,
				is_active: newActive,
			});
			if (error) throw error;
			toast.success('Delivery option added');
			resetCreateForm();
			await loadRows();
		} catch (error) {
			console.error('Error creating delivery option:', error);
			toast.error('Failed to add delivery option');
		} finally {
			setSubmitting(false);
		}
	};

	const openEdit = (row: DeliveryOption) => {
		setEditing(row);
		setEditName(row.name);
		setEditCompany(row.company);
		setEditPrice(String(row.price));
		setEditEstimated(row.estimated_days);
		setEditSort(String(row.sort_order));
		setEditActive(row.is_active);
		setEditOpen(true);
	};

	const handleSaveEdit = async () => {
		if (!editing) return;
		const price = num(editPrice);
		const sort = Math.trunc(num(editSort));
		if (!editName.trim()) {
			toast.error('Name is required');
			return;
		}
		if (!Number.isFinite(price) || price < 0) {
			toast.error('Enter a valid price');
			return;
		}
		if (!Number.isFinite(sort)) {
			toast.error('Sort order must be a number');
			return;
		}

		setSubmitting(true);
		try {
			const { error } = await supabase
				.from('delivery_options')
				.update({
					name: editName.trim(),
					company: editCompany.trim(),
					price,
					estimated_days: editEstimated.trim(),
					sort_order: sort,
					is_active: editActive,
					updated_at: new Date().toISOString(),
				})
				.eq('id', editing.id);
			if (error) throw error;
			toast.success('Delivery option updated');
			setEditOpen(false);
			setEditing(null);
			await loadRows();
		} catch (error) {
			console.error('Error updating delivery option:', error);
			toast.error('Failed to update');
		} finally {
			setSubmitting(false);
		}
	};

	const toggleActive = async (row: DeliveryOption, next: boolean) => {
		setActionId(row.id);
		try {
			const { error } = await supabase
				.from('delivery_options')
				.update({ is_active: next, updated_at: new Date().toISOString() })
				.eq('id', row.id);
			if (error) throw error;
			setRows((prev) =>
				prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r))
			);
			toast.success(next ? 'Activated' : 'Deactivated');
		} catch (error) {
			console.error('Error toggling delivery option:', error);
			toast.error('Failed to update status');
		} finally {
			setActionId(null);
		}
	};

	const handleDelete = async (row: DeliveryOption) => {
		if (!confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
		setActionId(row.id);
		try {
			const { error } = await supabase.from('delivery_options').delete().eq('id', row.id);
			if (error) throw error;
			setRows((prev) => prev.filter((r) => r.id !== row.id));
			toast.success('Deleted');
		} catch (error) {
			console.error('Error deleting delivery option:', error);
			toast.error('Failed to delete');
		} finally {
			setActionId(null);
		}
	};

	const moveRow = async (index: number, direction: -1 | 1) => {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= rows.length) return;
		const a = rows[index];
		const b = rows[nextIndex];
		setActionId('reorder');
		try {
			const { error: e1 } = await supabase
				.from('delivery_options')
				.update({ sort_order: b.sort_order, updated_at: new Date().toISOString() })
				.eq('id', a.id);
			if (e1) throw e1;
			const { error: e2 } = await supabase
				.from('delivery_options')
				.update({ sort_order: a.sort_order, updated_at: new Date().toISOString() })
				.eq('id', b.id);
			if (e2) throw e2;
			await loadRows();
		} catch (error) {
			console.error('Error reordering:', error);
			toast.error('Failed to reorder');
		} finally {
			setActionId(null);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-bold mb-2 sm:text-3xl">Delivery &amp; shipping</h2>
				<p className="text-muted-foreground text-sm sm:text-base">
					These options appear on checkout. Customers only see active options. Drag order is controlled by sort order (use arrows).
				</p>
			</div>

			<Card className="border-border">
				<CardHeader>
					<CardTitle>Add delivery option</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleCreate} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="doName">Display name</Label>
								<Input
									id="doName"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="e.g. GIG Logistics"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="doCompany">Carrier / label</Label>
								<Input
									id="doCompany"
									value={newCompany}
									onChange={(e) => setNewCompany(e.target.value)}
									placeholder="e.g. GIG Logistics"
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="doPrice">Price (NGN)</Label>
								<Input
									id="doPrice"
									type="number"
									min={0}
									step={1}
									value={newPrice}
									onChange={(e) => setNewPrice(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="doEst">Description (e.g. timeline)</Label>
								<Input
									id="doEst"
									value={newEstimated}
									onChange={(e) => setNewEstimated(e.target.value)}
									placeholder="Standard delivery"
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Switch id="doActive" checked={newActive} onCheckedChange={setNewActive} />
							<Label htmlFor="doActive">Active</Label>
						</div>
						<Button type="submit" variant="hero" disabled={submitting}>
							{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
							Add option
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="border-border">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>All options</CardTitle>
					<Button type="button" variant="outline" size="sm" onClick={() => void loadRows()}>
						Refresh
					</Button>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[100px]">Order</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Carrier</TableHead>
									<TableHead>Details</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>Active</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center text-muted-foreground py-8">
											No delivery options yet. Add one above, or run the database migration to seed defaults.
										</TableCell>
									</TableRow>
								) : (
									rows.map((row, index) => (
										<TableRow key={row.id}>
											<TableCell>
												<div className="flex items-center gap-1">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														disabled={actionId === 'reorder' || index === 0}
														onClick={() => void moveRow(index, -1)}
														aria-label="Move up"
													>
														<ChevronUp className="h-4 w-4" />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														disabled={actionId === 'reorder' || index === rows.length - 1}
														onClick={() => void moveRow(index, 1)}
														aria-label="Move down"
													>
														<ChevronDown className="h-4 w-4" />
													</Button>
													<span className="text-xs text-muted-foreground tabular-nums">
														{row.sort_order}
													</span>
												</div>
											</TableCell>
											<TableCell className="font-medium">{row.name}</TableCell>
											<TableCell className="text-muted-foreground">{row.company}</TableCell>
											<TableCell className="text-muted-foreground max-w-[200px] truncate">
												{row.estimated_days}
											</TableCell>
											<TableCell>{formatPrice(Number(row.price))}</TableCell>
											<TableCell>
												<Switch
													checked={row.is_active}
													disabled={actionId === row.id}
													onCheckedChange={(v) => void toggleActive(row, v)}
												/>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => openEdit(row)}
														aria-label="Edit"
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														disabled={actionId === row.id}
														onClick={() => void handleDelete(row)}
														aria-label="Delete"
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit delivery option</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="edName">Display name</Label>
							<Input
								id="edName"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edCo">Carrier / label</Label>
							<Input
								id="edCo"
								value={editCompany}
								onChange={(e) => setEditCompany(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edPrice">Price (NGN)</Label>
								<Input
									id="edPrice"
									type="number"
									min={0}
									step={1}
									value={editPrice}
									onChange={(e) => setEditPrice(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edSort">Sort order</Label>
								<Input
									id="edSort"
									type="number"
									step={1}
									value={editSort}
									onChange={(e) => setEditSort(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edEst">Description</Label>
							<Input
								id="edEst"
								value={editEstimated}
								onChange={(e) => setEditEstimated(e.target.value)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch id="edAct" checked={editActive} onCheckedChange={setEditActive} />
							<Label htmlFor="edAct">Active</Label>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
							Cancel
						</Button>
						<Button type="button" variant="hero" onClick={() => void handleSaveEdit()} disabled={submitting}>
							{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default DeliveryOptionsManager;
