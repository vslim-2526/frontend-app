import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Record from "./pages/Record";
import "./App.css";
import "./styles.css";

function App() {
  // ✅ Lấy base path từ import.meta.env.BASE_URL (Vite tự động set)
  // Hoặc có thể hardcode '/frontend-app' cho GitHub Pages
  const basename = import.meta.env.BASE_URL || '/frontend-app';

  return (
    <BrowserRouter basename={basename}>
      <header className="navbar">
        <div className="nav-inner">
          <div className="brand">Smart Expense tracker</div>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Home page</NavLink>
            <NavLink to="/chat" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Chat</NavLink>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/record" element={<Record />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
