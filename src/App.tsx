import { Routes, Route, Navigate } from "react-router-dom";
import Zahlenpyramide from "./exercises/Zahlenpyramide";
import ExampleExercise from "./exercises/ExampleExercise";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Zahlenpyramide />} />
      <Route path="/zahlenpyramide" element={<Zahlenpyramide />} />
      <Route path="/example-exercise" element={<ExampleExercise />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
