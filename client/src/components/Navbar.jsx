import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">Dezy Clinic</h1>
      <div className="space-x-4">
        <Link to="/chatbot" className="text-gray-700 hover:text-blue-500">Chatbot</Link>
        <Link to="/dashboard" className="text-gray-700 hover:text-blue-500">Dashboard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
