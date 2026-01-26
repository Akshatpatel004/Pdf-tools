import Card from "../component/Card";
import tools from "../data/tools.json";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar navbar-light bg-white border-bottom py-3 sticky-top shadow-sm">
        <div className="container-fluid px-md-5">
          <a className="navbar-brand d-flex align-items-center fw-bold text-dark" href="#">
            <img src="https://play-lh.googleusercontent.com/IkcyuPcrQlDsv62dwGqteL_0K_Rt2BUTXfV3_vR4VmAGo-WSCfT2FgHdCBUsMw3TPGU" alt="Logo" width="35" className="me-2 rounded" />
            <span>PDF-TOOLS</span>
          </a>
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
