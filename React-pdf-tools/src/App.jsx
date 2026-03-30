import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react"; // Added useEffect
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";
import Perfileupload from "./pages/Perfileupload";
import ToolSplit from "./pages/ToolSplit";
import Login from "./pages/Login";
import PasswordProtect from "./pages/PasswordProtect";
import AiChatBot from "./component/AiChatBot";
import Navbar from "./component/Navbar";

const AppContent = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const isLoginPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";

  // --- HILLTOPADS IMPLEMENTATION ---
  useEffect(() => {
    // This tells the script to look for new buttons/elements 
    // every time the URL changes (Home -> Tool)
    try {
      if (window._hta) {
        window._hta(); // Re-initializes the HilltopAds listener if available
      }
    } catch (e) {
      console.log("Ad script refreshing...");
    }
  }, [location]); // Runs every time the route changes
  // ---------------------------------

  return (
    <>
      {!isLoginPage && (
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={isHomePage}
        />
      )}

      <Routes>
        <Route path="/" element={<Home searchQuery={searchQuery} />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
        <Route path="/tool/toolperfile/:toolName" element={<Perfileupload />} />        
        <Route path="/tool/protect/:toolName" element={<PasswordProtect />} />
        <Route path="/login" element={<Login />} />
      </Routes>
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
