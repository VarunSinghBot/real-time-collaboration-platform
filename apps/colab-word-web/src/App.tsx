import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@repo/auth';
import { authService } from './lib/auth';
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import OAuthCallback from './components/auth/OAuthCallback';
import DocumentEditor from './components/DocumentEditor';
import CollabDocument from './components/CollabDocument';
import Dashboard from './components/Dashboard';
import ErrPage from './components/ErrPage';

function App() {
  return (
    <AuthProvider authService={authService}>
      <Router>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Private document editor */}
          <Route path="/document" element={<DocumentEditor />} />

          {/* Collaborative document route */}
          <Route path="/document/:roomCode" element={<CollabDocument />} />

          {/* Catch all error page */}
          <Route path="*" element={<ErrPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
