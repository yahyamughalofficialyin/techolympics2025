import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "", // Changed from username to email to match backend
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/check-session",
          { withCredentials: true }
        );
        if (response.data.isLoggedIn) {
          navigate("/");
        }
      } catch (error) {
        console.log("Not logged in");
      }
    };
    checkLoggedIn();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/login",
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.message === "Login successful!") {
        // Show success message
        toast.success(`Welcome, ${response.data.admin.username}`, {
          position: "top-right",
          autoClose: 2000,
        });

        // Redirect to dashboard after delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || 
                         "Login failed. Please try again.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" id="main-wrapper">
      <ToastContainer />
      <div className="position-relative overflow-hidden radial-gradient min-vh-100 d-flex align-items-center justify-content-center">
        <div className="d-flex align-items-center justify-content-center w-100">
          <div className="row justify-content-center w-100">
            <div className="col-md-8 col-lg-6 col-xxl-3">
              <div className="card mb-0">
                <div className="card-body">
                  <Link to="/" className="text-nowrap logo-img text-center d-block py-3 w-100">
                    <img src="/assets/images/logos/dark-logo.svg" width={180} alt="Logo" />
                  </Link>
                  <p className="text-center">Admin Dashboard Login</p>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="form-check">
                        <input
                          className="form-check-input primary"
                          type="checkbox"
                          id="flexCheckChecked"
                          name="rememberMe"
                        />
                        <label className="form-check-label text-dark" htmlFor="flexCheckChecked">
                          Remember me
                        </label>
                      </div>
                      <Link to="/forgot-password" className="text-primary fw-bold">
                        Forgot Password?
                      </Link>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-8 fs-4 mb-4 rounded-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                          <span className="ms-2">Signing In...</span>
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                    
                    <div className="d-flex align-items-center justify-content-center">
                      <p className="fs-4 mb-0 fw-bold">New to Admin Panel?</p>
                      <Link className="text-primary fw-bold ms-2" to="/register">
                        Create an account
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;