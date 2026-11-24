// Category icon helper renderer
"use client";

import {
  Utensils,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Film,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Laptop,
  TrendingUp,
  Tag,
  CreditCard,
  Smartphone,
  Wallet,
  Users,
  Compass,
} from "lucide-react";

interface CategoryIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({
  icon,
  size = 16,
  className = "",
}: CategoryIconProps) {
  switch (icon) {
    case "Utensils":
      return <Utensils size={size} className={className} />;
    case "Home":
      return <Home size={size} className={className} />;
    case "ShoppingCart":
      return <ShoppingCart size={size} className={className} />;
    case "Car":
      return <Car size={size} className={className} />;
    case "Zap":
      return <Zap size={size} className={className} />;
    case "Film":
      return <Film size={size} className={className} />;
    case "HeartPulse":
      return <HeartPulse size={size} className={className} />;
    case "ShoppingBag":
      return <ShoppingBag size={size} className={className} />;
    case "Briefcase":
      return <Briefcase size={size} className={className} />;
    case "Laptop":
      return <Laptop size={size} className={className} />;
    case "TrendingUp":
      return <TrendingUp size={size} className={className} />;
    case "CreditCard":
      return <CreditCard size={size} className={className} />;
    case "Smartphone":
      return <Smartphone size={size} className={className} />;
    case "Wallet":
      return <Wallet size={size} className={className} />;
    case "Users":
      return <Users size={size} className={className} />;
    case "Compass":
      return <Compass size={size} className={className} />;
    default:
      return <Tag size={size} className={className} />;
  }
}
