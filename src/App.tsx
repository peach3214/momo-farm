import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { ProfileSetup } from './pages/ProfileSetup';

function App() {
  const { user, loading } = useAuth();

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 認証済みの場合 */}
        {user ? (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* 未認証の場合 */
          <>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
