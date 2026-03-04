import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/database";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();
  const isOutOfStock = product.stock <= 0;
  const originalPrice = product.selling_price ?? product.price;
  const discountPercentage =
    originalPrice > 0 ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  const hasDiscount = discountPercentage > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="group relative opacity-0 animate-fade-up"
      style={{ animationDelay: `${index * 100 + 200}ms`, animationFillMode: "forwards" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-card rounded-sm mb-4">
        {hasDiscount && (
          <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-sm">
            -{discountPercentage}%
          </div>
        )}
        <img
          src={
            product.images && product.images.length > 0
              ? getOptimizedCloudinaryUrl(product.images[0], {
                  width: 600,
                  height: 600,
                  crop: 'fill',
                  quality: 'auto',
                })
              : '/placeholder.svg'
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-charcoal-deep/60 flex items-center justify-center gap-3 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full border-cream/40 bg-charcoal/50 backdrop-blur-sm hover:bg-cream hover:text-charcoal-deep hover:border-cream transition-all duration-300"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                isLiked ? "fill-primary text-primary" : ""
              }`}
            />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full border-cream/40 bg-charcoal/50 backdrop-blur-sm hover:bg-cream hover:text-charcoal-deep hover:border-cream transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product.id, 1);
            }}
          >
            <ShoppingBag className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Quick Add Button - Always visible, more prominent */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="hero" 
            className="w-full shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product.id, 1);
            }}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {product.category}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-foreground group-hover:text-gold transition-colors duration-300">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-gradient-gold">{formatPrice(product.price)}</p>
          {hasDiscount && (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
