import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { CartProvider } from "./context/CartContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import ContactPage from "./pages/ContactPage";
import CorporateGiftsPage from "./pages/CorporateGiftsPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import MiniaturesPage from "./pages/MiniaturesPage";
import Order3DModelPage from "./pages/Order3DModelPage";
import OrderAvailableModelsPage from "./pages/OrderAvailableModelsPage";
import OrderGiftPage from "./pages/OrderGiftPage";
import OrderPortraitPage from "./pages/OrderPortraitPage";
import OrderStatusPage from "./pages/OrderStatusPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ReadyToShipPage from "./pages/ReadyToShipPage";
import ReturnPolicyPage from "./pages/ReturnPolicyPage";
import ReviewsPage from "./pages/ReviewsPage";
import ShopPage from "./pages/ShopPage";
import TeamPortalPage from "./pages/TeamPortalPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import UnifiedCheckoutPage from "./pages/UnifiedCheckoutPage";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: Layout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const orderPortraitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-portrait",
  component: OrderPortraitPage,
});

const orderGiftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-gift",
  component: OrderGiftPage,
});

const order3DModelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-3d-model",
  component: Order3DModelPage,
});

const orderAvailableModelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-available-models",
  component: OrderAvailableModelsPage,
});

const orderStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-status/$orderId",
  component: OrderStatusPage,
  validateSearch: (search: Record<string, unknown>) => ({
    paid: search.paid ? String(search.paid) : undefined,
  }),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/team",
  component: TeamPortalPage,
});
const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPolicyPage,
});
const returnPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/return-policy",
  component: ReturnPolicyPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reviews",
  component: ReviewsPage,
});

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop",
  component: ShopPage,
});

const miniaturesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/miniatures",
  component: MiniaturesPage,
});

const corporateGiftsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/corporate-gifts",
  component: CorporateGiftsPage,
});

const readyToShipRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ready-to-ship",
  component: ReadyToShipPage,
});

const trackOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track-order",
  component: TrackOrderPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product/$id",
  component: ProductDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: UnifiedCheckoutPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || "cart",
    item: (search.item as string) || undefined,
  }),
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: AccountPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  orderPortraitRoute,
  orderGiftRoute,
  order3DModelRoute,
  orderAvailableModelsRoute,
  orderStatusRoute,
  adminRoute,
  teamRoute,
  privacyRoute,
  returnPolicyRoute,
  galleryRoute,
  reviewsRoute,
  shopRoute,
  miniaturesRoute,
  corporateGiftsRoute,
  readyToShipRoute,
  trackOrderRoute,
  aboutRoute,
  contactRoute,
  productDetailRoute,
  cartRoute,
  checkoutRoute,
  accountRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </CustomerAuthProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}
