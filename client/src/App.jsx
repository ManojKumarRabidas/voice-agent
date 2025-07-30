import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "./pages/Chatbot";
import Layout from "./components/Layout";
import Dashboard from './pages/admin/dashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/admin/stats" element={<Dashboard />} /> */}
        <Route path="/" element={<Layout />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


