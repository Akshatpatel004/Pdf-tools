import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import ToolUpload from "./pages/ToolUpload";
import ToolSplit from "./pages/ToolSplit";
import Login from "./pages/Login";
import AiChatBot from "./component/AiChatBot";
import Navbar from "./component/Navbar"; 

const AppContent = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const isLoginPage = location.pathname === "/login";
  // Logic: Show search only if we are exactly on the home page
  const isHomePage = location.pathname === "/";

  return (
    <>
      {!isLoginPage && (
        <Navbar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          showSearch={isHomePage} // Pass visibility flag
        />
      )}

      <Routes>
        <Route path="/" element={<Home searchQuery={searchQuery} />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
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