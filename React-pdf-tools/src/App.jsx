import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";
import ToolSplit from "./pages/ToolSplit";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
