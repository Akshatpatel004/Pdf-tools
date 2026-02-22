import React, { useState, useEffect, useRef } from "react";
import Card from "../component/Card";
import tools from "../data/tools.json";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase-config.js";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPop, setShowPop] = useState(false);
  const popoverRef = useRef(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowPop(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
      <nav className="navbar navbar-light bg-white border-bottom py-3 sticky-top shadow-sm">
        <div className="container-fluid px-md-5">
          <a className="navbar-brand d-flex align-items-center fw-bold text-dark" href="#">
            <img src="/icons/logo.JPEG" alt="Logo" width="35" className="me-2 rounded" />
            <span>FlexXPDF</span>
          </a>

          {/* Profile Section */}
          <div className="position-relative" ref={popoverRef}>
            <img 
              src={user?.photoURL || "/icons/sign in.jpeg"} 
              alt="profile" 
              width="35" 
              height="35"
              className="rounded-circle"
              style={{ cursor: "pointer", objectFit: "cover" }} 
              onClick={() => user ? setShowPop(!showPop) : navigate("/login")} 
              onError={(e) => { e.target.src = "/icons/sign in.jpeg"; }}
            />

            {/* Mini Popover Screen */}
            {showPop && user && (
              <div className="position-absolute end-0 mt-3 p-4 shadow-lg rounded-4 bg-white border" 
                   style={{ width: "280px", zIndex: 1050 }}>
                <div className="text-center ">
                  <img 
                    src={user.photoURL || "/icons/sign in.jpeg"} 
                    className="rounded-circle mb-3 border " 
                    width="60" 
                    height="60" 
                    alt="Avatar"
                    onError={(e) => { e.target.src = "/icons/sign in.jpeg"; }} 
                  />
                  <h6 className="fw-bold mb-0 text-dark">{user.displayName || "User"}</h6>
                  <p className="text-muted small mb-3 text-truncate">{user.email}</p>
                  <hr className="my-3" />
                  <button 
                    onClick={handleLogout}
                    className="btn btn-outline-danger btn-sm w-100 rounded-pill fw-bold"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container-fluid py-5 px-md-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold">EVERY tool you need to work with PDF's in one place.</h1>
          <p className="text-secondary mx-auto" style={{ maxWidth: "800px" }}>
            Every tools you need to use PDF's. All are 100% FREE and easy to use Merge, Image, Docx, Convert to PDF with just few click.
          </p>
        </div>

        <div className="row g-4">
          {tools.map((tool, index) => (
            <div key={index} className="tv-grid col-md-6 col-sm-12" onClick={() => navigate(`/tool/${tool.route}`)}>
              <Card img={tool.img} title={tool.title} disc={tool.disc} routes={tool.route} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;