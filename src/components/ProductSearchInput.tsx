import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProductSearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	debounceMs?: number;
}

/**
 * Reusable search input for product listing pages.
 * Syncs with URL search param when used with useSearchParams.
 */
const ProductSearchInput = ({
	value,
	onChange,
	placeholder = 'Search products...',
	className,
	debounceMs = 300,
}: ProductSearchInputProps) => {
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		if (localValue.trim() === value) return;
		const timer = setTimeout(() => onChange(localValue.trim()), debounceMs);
		return () => clearTimeout(timer);
	}, [localValue, debounceMs, onChange, value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value;
		setLocalValue(v);
		// Immediate update for empty (clear filter right away)
		if (v.trim() === '') onChange('');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			onChange(localValue.trim());
		}
	};

	return (
		<div className={cn('relative', className)}>
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder={placeholder}
				value={localValue}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				className="pl-9"
			/>
		</div>
	);
};

export default ProductSearchInput;
