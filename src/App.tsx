import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { CookieBanner } from "@/components/CookieBanner";
import { CookiePreferencesDialog } from "@/components/CookiePreferences";
import {
  ADMIN_SETTINGS_UPDATED_EVENT,
  getSiteUnderConstruction,
} from "@/lib/settings";
import Index from "./pages/Index";
import NewArrivals from "./pages/NewArrivals";
import BestSellers from "./pages/BestSellers";
import Sale from "./pages/Sale";
import Collections from "./pages/Collections";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import PressReleases from "./pages/PressReleases";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AuthCallback from "./pages/AuthCallback";
import AllCategories from "./pages/AllCategories";
import AllProducts from "./pages/AllProducts";
import CollectionDetail from "./pages/CollectionDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import OrderHistory from "./pages/OrderHistory";
import AccountProfile from "./pages/AccountProfile";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiesPolicy from "./pages/CookiesPolicy";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
  }, [navigationType, pathname]);

  return null;
};

const AppRoutes = () => {
  const [siteUnderConstruction, setSiteUnderConstruction] = useState(true);

  useEffect(() => {
    const syncSiteMode = async () => {
      const value = await getSiteUnderConstruction();
      setSiteUnderConstruction(value);
    };

    const handleSettingsUpdated: EventListener = () => {
      syncSiteMode();
    };

    syncSiteMode();
    window.addEventListener("storage", handleSettingsUpdated);
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdated);
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, []);

  return (
    <Routes>
      {siteUnderConstruction ? (
        <>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<ComingSoon />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Index />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/best-sellers" element={<BestSellers />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press-releases" element={<PressReleases />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/categories" element={<AllCategories />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/collections/:categoryName" element={<CollectionDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/profile" element={<AccountProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookies-policy" element={<CookiesPolicy />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <CookieConsentProvider>
          <AuthProvider>
            <CartProvider>
              <CookieBanner />
              <CookiePreferencesDialog />
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
