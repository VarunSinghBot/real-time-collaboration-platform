import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@repo/auth";
import { authService } from "./lib/auth";
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import OAuthCallback from './components/auth/OAuthCallback';
import Whiteboard from './components/Whiteboard';
import ErrPage from './ErrPage';

function App() {
  return (
    <AuthProvider authService={authService}>
      <Router>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Whiteboard route - handles auth internally */}
          <Route path="/whiteboard" element={<Whiteboard />} />
          
          {/* Catch all error page */}
          <Route path="*" element={<ErrPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

