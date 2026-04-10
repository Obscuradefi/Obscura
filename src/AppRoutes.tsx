import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AppPage from './pages/AppPage';
import DocsPage from './pages/DocsPage';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/app" element={<AppPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/docs/:section/:page" element={<DocsPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
