import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const AdminPage = lazy(() => import("./routes/admin-page").then((module) => ({ default: module.AdminPage })));
const JoinPage = lazy(() => import("./routes/join-page").then((module) => ({ default: module.JoinPage })));
const LandingPage = lazy(() => import("./routes/landing-page").then((module) => ({ default: module.LandingPage })));
const WallPage = lazy(() => import("./routes/wall-page").then((module) => ({ default: module.WallPage })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="route-loading"><span>87K WINDOWS</span><p>Lighting the room…</p></main>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join/:roomCode" element={<JoinPage />} />
          <Route path="/wall/:roomCode" element={<WallPage />} />
          <Route path="/admin/:roomCode" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
