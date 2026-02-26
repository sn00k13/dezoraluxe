/**
 * Cloudinary Image Upload Utility
 * 
 * To use Cloudinary:
 * 1. Sign up at https://cloudinary.com
 * 2. Get your Cloud Name from Dashboard
 * 3. Create an unsigned upload preset for client-side uploads
 * 4. Add them to your .env file
 * 
 * Documentation: https://cloudinary.com/documentation
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Upload an image to Cloudinary using unsigned upload preset
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'products', 'users')
 * @param metadata - Optional metadata/tags for the image
 * @returns The uploaded image URL or error
 */
export const uploadImageToCloudinary = async (
	file: File,
	folder?: string,
	metadata?: { tags?: string[]; publicId?: string }
): Promise<{ url: string | null; error: string | null; publicId?: string }> => {
	if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
		return {
			url: null,
			error: 'Cloudinary credentials not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file',
		};
	}

	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
		
		if (folder) {
			formData.append('folder', folder);
		}
		
		if (metadata?.tags && metadata.tags.length > 0) {
			formData.append('tags', metadata.tags.join(','));
		}
		
		if (metadata?.publicId) {
			formData.append('public_id', metadata.publicId);
		}

		// Note: Transformation parameters are NOT allowed with unsigned uploads
		// Transformations should be applied when requesting the image URL (see getCloudinaryImageUrl)
		// The upload preset can be configured with default transformations in Cloudinary Dashboard

		const response = await fetch(
			`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
			{
				method: 'POST',
				body: formData,
			}
		);

		const data = await response.json();

		if (!response.ok || data.error) {
			return {
				url: null,
				error: data.error?.message || 'Failed to upload image to Cloudinary',
			};
		}

		return {
			url: data.secure_url,
			publicId: data.public_id,
			error: null,
		};
	} catch (error) {
		return {
			url: null,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
};

/**
 * Get optimized image URL from Cloudinary
 * @param imageUrl - The full Cloudinary URL or public ID
 * @param transformations - Cloudinary transformation string (e.g., 'w_500,h_500,c_fill')
 * @returns The optimized image URL
 */
export const getCloudinaryImageUrl = (
	imageUrl: string,
	transformations?: string
): string => {
	if (!imageUrl) return '';
	
	// If it's already a full Cloudinary URL
	if (imageUrl.includes('res.cloudinary.com')) {
		if (transformations) {
			// Insert transformations before the version number
			const urlParts = imageUrl.split('/');
			const uploadIndex = urlParts.indexOf('upload');
			if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
				urlParts.splice(uploadIndex + 1, 0, transformations);
				return urlParts.join('/');
			}
		}
		return imageUrl;
	}

	// If it's a public ID, construct the URL
	if (CLOUDINARY_CLOUD_NAME) {
		const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
		const transformStr = transformations ? `${transformations}/` : '';
		return `${baseUrl}/${transformStr}${imageUrl}`;
	}

	// Fallback to original URL if Cloudinary not configured
	return imageUrl;
};

/**
 * Generate a responsive image URL with transformations
 * @param imageUrl - The Cloudinary URL or public ID
 * @param width - Desired width in pixels
 * @param height - Optional height in pixels
 * @param crop - Crop mode (fill, scale, fit, etc.)
 * @param quality - Image quality (auto, best, good, eco, low)
 * @returns Optimized image URL
 */
export const getOptimizedCloudinaryUrl = (
	imageUrl: string,
	options: {
		width?: number;
		height?: number;
		crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'pad';
		quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
		format?: 'auto' | 'webp' | 'jpg' | 'png';
	}
): string => {
	const transforms: string[] = [];

	if (options.width) transforms.push(`w_${options.width}`);
	if (options.height) transforms.push(`h_${options.height}`);
	if (options.crop) transforms.push(`c_${options.crop}`);
	if (options.quality) transforms.push(`q_${options.quality}`);
	if (options.format) transforms.push(`f_${options.format}`);

	const transformStr = transforms.length > 0 ? transforms.join(',') : 'f_auto,q_auto';
	return getCloudinaryImageUrl(imageUrl, transformStr);
};

/**
 * Delete an image from Cloudinary
 * Note: This requires server-side implementation with API secret for security
 * Client-side deletion should be handled via your backend API
 * @param publicId - The public ID of the image to delete
 * @returns Success status and error if any
 */
export const deleteCloudinaryImage = async (
	publicId: string
): Promise<{ success: boolean; error: string | null }> => {
	// For security, image deletion should be done server-side
	// This is a placeholder that would need to call your backend API
	return {
		success: false,
		error: 'Image deletion must be handled server-side. Please implement a backend endpoint that uses Cloudinary Admin API.',
	};
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Full Cloudinary URL
 * @returns Public ID or original URL if not a Cloudinary URL
 */
export const extractPublicId = (url: string): string => {
	if (!url.includes('cloudinary.com')) {
		return url;
	}

	try {
		const urlParts = url.split('/upload/');
		if (urlParts.length > 1) {
			// Remove version number if present and file extension
			const pathPart = urlParts[1].split('/').slice(1).join('/'); // Skip version
			return pathPart.split('.')[0]; // Remove extension
		}
	} catch (error) {
		console.error('Error extracting public ID:', error);
	}

	return url;
};

