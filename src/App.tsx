import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TravelProvider } from './context/TravelContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { PlanPage } from './pages/PlanPage';
import { CollectionPage } from './pages/CollectionPage';
import { DetailPage } from './pages/DetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <TravelProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/" element={
                <AuthGuard>
                  <PlanPage />
                </AuthGuard>
              } />
              <Route path="/collection" element={
                <AuthGuard>
                  <CollectionPage />
                </AuthGuard>
              } />
              <Route path="/detail" element={
                <AuthGuard>
                  <DetailPage />
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              } />
            </Routes>
          </Layout>
        </Router>
      </TravelProvider>
    </AuthProvider>
  );
}
