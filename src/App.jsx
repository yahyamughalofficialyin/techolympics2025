import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import User from "./Pages/User";
import Product from "./Pages/Product";
import Admin from "./Pages/Admin";
import axios from "axios";

// Auth Context for global authentication state
const AuthContext = React.createContext();

// Custom hook to use auth context
const useAuth = () => React.useContext(AuthContext);

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  const checkSession = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/check-session",
        { withCredentials: true }
      );
      
      setAuthState({
        isAuthenticated: response.data.isLoggedIn,
        isLoading: false,
        user: response.data.admin || null
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        credentials,
        { withCredentials: true }
      );
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: response.data.admin
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/admin/logout",
        {},
        { withCredentials: true }
      );
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && (!user || !requiredRoles.includes(user.role?.name))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Auth Route Component (for login/signup when already authenticated)
const AuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function LayoutWrapper() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Sidebar />}
      {!isAuthPage ? (
        <div className="body-wrapper">
          <Header />
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/user" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <User />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/product" element={
              <ProtectedRoute>
                <Product />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          <Route path="/signup" element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          } />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LayoutWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;