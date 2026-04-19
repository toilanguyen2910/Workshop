/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WorkshopDetail from './pages/WorkshopDetail';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import About from './pages/About';
import Chatbot from './components/Chatbot';
import CustomCursor from './components/CustomCursor';

export default function App() {
  return (
    <AuthProvider>
      <Router basename="/Workshop/">
        <CustomCursor />
        <div className="min-h-screen bg-[#f5f5f0] font-sans text-[#1a1a1a] flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/workshop/:id" element={<WorkshopDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}
