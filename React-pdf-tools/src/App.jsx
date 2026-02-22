import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";
import ToolSplit from "./pages/ToolSplit";
import Login from "./pages/Login";
import AiChatBot from "./component/AiChatBot";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
        <Route path="/login" element={<Login />} />
      </Routes>

            {/* Floating chatbot */}
      <AiChatBot />
      
    </BrowserRouter>
  );
}

export default App;
