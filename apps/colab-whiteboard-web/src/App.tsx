import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "@repo/auth";
import { authService } from "./lib/auth";
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import OAuthCallback from './components/auth/OAuthCallback';
import Whiteboard from './components/Whiteboard';
import PrivateWhiteboard from './components/PrivateWhiteboard';
import CollabWhiteboard from './components/CollabWhiteboard';
import ErrPage from './ErrPage';

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

          {/* Whiteboard route - handles auth internally */}
          <Route path="/whiteboard" element={<Whiteboard />} />

          {/* Private whiteboard route with auto-save */}
          <Route path="/private-board" element={<PrivateWhiteboard />} />

          {/* Collaborative whiteboard route */}
          <Route path="/collab/:roomId" element={<CollabWhiteboard />} />

          {/* Catch all error page */}
          <Route path="*" element={<ErrPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

