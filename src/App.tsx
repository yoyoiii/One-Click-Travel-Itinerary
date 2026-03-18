import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TravelProvider } from './context/TravelContext';
import { Layout } from './components/Layout';
import { PlanPage } from './pages/PlanPage';
import { CollectionPage } from './pages/CollectionPage';
import { DetailPage } from './pages/DetailPage';

export default function App() {
  return (
    <TravelProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<PlanPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/detail" element={<DetailPage />} />
          </Routes>
        </Layout>
      </Router>
    </TravelProvider>
  );
}
