import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Root from './pages/root.tsx';
import AiDemo from './pages/ai-demo.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/ai-demo" element={<AiDemo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
