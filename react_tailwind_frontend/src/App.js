import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { QueuePage } from "./pages/QueuePage";
import { UploadPage } from "./pages/UploadPage";
import { ClaimsPage } from "./pages/ClaimsPage";

// PUBLIC_INTERFACE
function App() {
  /** App entry: sets up routes for Dashboard, Queue, Upload (and Claims). */
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/claims" element={<ClaimsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
