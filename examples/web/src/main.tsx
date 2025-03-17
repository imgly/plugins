import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import AiDemo from './pages/ai-demo.tsx';
import TestGenerationProvider from './pages/test-generation-provider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ai-demo" element={<AiDemo />} />
        <Route
          path="/test-generation-provider"
          element={<TestGenerationProvider />}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
