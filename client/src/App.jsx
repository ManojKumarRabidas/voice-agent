import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "./pages/Chatbot";
import Home from "./pages/Home";
import Dashboard from './pages/admin/dashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


