import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";
import ToolSplit from "./pages/ToolSplit";
import Login from "./pages/Login";
import AiChatBot from "./component/AiChatBot";

// Create a wrapper component to handle location-based logic
const AppContent = () => {
  const location = useLocation();
  // Check if current path is login
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      {/* Floating chatbot: Hidden on login page */}
      {!isLoginPage && <AiChatBot />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;