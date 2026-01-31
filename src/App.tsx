import { Routes, Route, Navigate } from "react-router-dom";
import Zahlenpyramide from "./exercises/Zahlenpyramide";
import Zehner from "./exercises/Zehner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Zahlenpyramide />} />
      <Route path="/zahlenpyramide" element={<Zahlenpyramide />} />
      <Route path="/zehner" element={<Zehner />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
