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
import CompressImage from "./image_pages/CompressImage";
import ImageFormatConverter from "./image_pages/ImageFormatConverter";

export const triggerAdOnce = () => {
  // const adLink = "https://flusteredexam.com/bJ3GVg0.P/3/ptvYb/mLVlJhZKDv0/2KOYT/EtyuNgzaAXxQLqTiY/5rMyTYI_3jM/DCUM";
  // const lastAd = localStorage.getItem('last_ad_time');
  // const now = Date.now();

  // // 300000 ms = 5 minutes. Change to 60000 for 1 minute to earn faster.
  // if (!lastAd || now - Number(lastAd) > 60000) { 
  //   window.open(adLink, "_blank");
  //   localStorage.setItem('last_ad_time', String(now));
  // }
  console.log("ads off");

};

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
        {/* pdf tools page */}
        <Route path="/" element={<Home searchQuery={searchQuery} />} />
        <Route path="/tool/split-pdf" element={<ToolSplit />} />
        <Route path="/tool/:toolName" element={<ToolUpload />} />
        <Route path="/tool/toolperfile/:toolName" element={<Perfileupload />} />
        <Route path="/tool/protect/:toolName" element={<PasswordProtect />} />

        {/* image tools page */}
        <Route path="/tool/compress-image" element={<CompressImage />} />
        <Route path="/tool/image-format-converter" element={<ImageFormatConverter />} />

        {/* login screen route page */}
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
