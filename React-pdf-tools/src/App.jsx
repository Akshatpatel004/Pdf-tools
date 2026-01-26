import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
