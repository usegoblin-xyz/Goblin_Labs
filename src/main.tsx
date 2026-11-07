import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route, useSearchParams } from "react-router";
import Home from "./app/routes/Home.tsx";
import { Toaster } from "./app/components/ui/sonner";
import "./styles/index.css";
import { initAnalytics } from "./app/lib/analytics";
import { AnalyticsIdentity } from "./app/lib/auth";
import { CookieBanner } from "./app/lib/CookieBanner";
import { PageLoader } from "./app/components/ui/gecko-loader";

initAnalytics();

// Heavy routes load only when visited.
// Previous Goblin Labs homepage (personas), kept reachable during the pivot.
const LabsHome = lazy(() => import("./app/App.tsx"));
const Studio = lazy(() => import("./app/routes/Studio.tsx"));
const Talk = lazy(() => import("./app/routes/Talk.tsx"));
const Login = lazy(() => import("./app/routes/Login.tsx"));
const Personas = lazy(() => import("./app/routes/Personas.tsx"));
const Account = lazy(() => import("./app/routes/Account.tsx"));
const Docs = lazy(() => import("./app/routes/Docs.tsx"));
const SupportDemo = lazy(() => import("./app/routes/SupportDemo.tsx"));
const LeadGenDemo = lazy(() => import("./app/routes/LeadGenDemo.tsx"));
const Privacy = lazy(() => import("./app/routes/Legal.tsx").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./app/routes/Legal.tsx").then((m) => ({ default: m.Terms })));

function CreateRedirect() {
  const [params] = useSearchParams();
  const t = params.get("t");
  return <Navigate to={t ? `/?t=${encodeURIComponent(t)}` : "/"} replace />;
}

createRoot(document.getElementById("root")!).render(
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Home />} />
        <Route path="/library/:section" element={<Home />} />
        {/* The old Create page: its links now open the template in the chat. */}
        <Route path="/create" element={<CreateRedirect />} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
        <Route
          path="/labs"
          element={
            <Suspense fallback={<PageLoader />}>
              <LabsHome />
            </Suspense>
          }
        />
        <Route
          path="/studio"
          element={
            <Suspense fallback={<PageLoader />}>
              <Studio />
            </Suspense>
          }
        />
        <Route
          path="/p/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <Talk />
            </Suspense>
          }
        />
        <Route
          path="/embed/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <Talk embed />
            </Suspense>
          }
        />
        <Route
          path="/login/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/demo/leadgen"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeadGenDemo />
            </Suspense>
          }
        />
        <Route
          path="/demo/support"
          element={
            <Suspense fallback={<PageLoader />}>
              <SupportDemo />
            </Suspense>
          }
        />
        <Route
          path="/docs"
          element={
            <Suspense fallback={<PageLoader />}>
              <Docs />
            </Suspense>
          }
        />
        <Route
          path="/personas"
          element={
            <Suspense fallback={<PageLoader />}>
              <Personas />
            </Suspense>
          }
        />
        <Route
          path="/account/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <Account />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
    <Toaster />
    <AnalyticsIdentity />
    <CookieBanner />
  </>,
);
