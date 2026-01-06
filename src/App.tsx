import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NewArrivals from "./pages/NewArrivals";
import Collections from "./pages/Collections";
import Accessories from "./pages/Accessories";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AllCategories from "./pages/AllCategories";
import AllProducts from "./pages/AllProducts";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import OrderHistory from "./pages/OrderHistory";
import AccountProfile from "./pages/AccountProfile";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/about" element={<About />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/categories" element={<AllCategories />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/profile" element={<AccountProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
