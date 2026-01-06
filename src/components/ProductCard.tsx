import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
        <img
          src={product.image}
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
          >
            <ShoppingBag className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Quick Add Button (appears on hover) */}
        <div
          className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${
            isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Button variant="hero" className="w-full">
            Add to Cart
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
        <p className="text-lg font-semibold text-gradient-gold">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
