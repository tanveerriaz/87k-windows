import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "./routes/admin-page";
import { JoinPage } from "./routes/join-page";
import { LandingPage } from "./routes/landing-page";
import { WallPage } from "./routes/wall-page";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join/:roomCode" element={<JoinPage />} />
        <Route path="/wall/:roomCode" element={<WallPage />} />
        <Route path="/admin/:roomCode" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
