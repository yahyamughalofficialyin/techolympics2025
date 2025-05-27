import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Header = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch admin data on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // First check session to get adminId
        const sessionResponse = await axios.get(
          'http://localhost:5000/api/admin/check-session',
          { withCredentials: true }
        );
        
        if (sessionResponse.data.isLoggedIn && sessionResponse.data.adminId) {
          // Then fetch full admin details using the ID
          const adminResponse = await axios.get(
            `http://localhost:5000/api/admin/${sessionResponse.data.adminId}`,
            { withCredentials: true }
          );
          
          setAdminData(adminResponse.data);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/admin/logout',
        {},
        { withCredentials: true }
      );
      
      toast.success('Logged out successfully');
      setAdminData(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <header className="app-header">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="navbar-collapse justify-content-end px-0">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <>
      {/* Header Start */}
      <header className="app-header">
        <nav className="navbar navbar-expand-lg navbar-light">
          <ul className="navbar-nav">
            <li className="nav-item d-block d-xl-none">
              <Link
                className="nav-link sidebartoggler nav-icon-hover"
                id="headerCollapse"
                to="#"
              >
                <i className="ti ti-menu-2" />
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link nav-icon-hover" to="#">
                <i className="ti ti-bell-ringing" />
                <div className="notification bg-primary rounded-circle" />
              </Link>
            </li>
          </ul>
          <div className="navbar-collapse justify-content-end px-0" id="navbarNav">
            <ul className="navbar-nav flex-row ms-auto align-items-center justify-content-end">
              <Link
                to="https://adminmart.com/product/modernize-free-bootstrap-admin-dashboard/"
                target="_blank"
                className="btn btn-primary"
              >
                Download Free
              </Link>
              <li className="nav-item dropdown">
                <Link
                  className="nav-link nav-icon-hover"
                  to="#"
                  id="drop2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={adminData?.image?.url || 'assets/images/profile/user-1.jpg'}
                    alt={adminData?.username || 'User'}
                    width={35}
                    height={35}
                    className="rounded-circle"
                    style={{objectFit: "cover"}}
                    onError={(e) => {
                      e.target.src = 'assets/images/profile/user-1.jpg';
                    }}
                  />
                </Link>
                <div
                  className="dropdown-menu dropdown-menu-end dropdown-menu-animate-up"
                  aria-labelledby="drop2"
                >
                  <div className="message-body">
                    <Link
                      to="/profile"
                      className="d-flex align-items-center gap-2 dropdown-item"
                    >
                      <i className="ti ti-user fs-6" />
                      <p className="mb-0 fs-3">
                        {adminData?.username || 'Username'}
                      </p>
                    </Link>
                    <Link
                      to="/account"
                      className="d-flex align-items-center gap-2 dropdown-item"
                    >
                      <i className="ti ti-mail fs-6" />
                      <p className="mb-0 fs-3">My Account</p>
                    </Link>
                    <Link
                      to="/tasks"
                      className="d-flex align-items-center gap-2 dropdown-item"
                    >
                      <i className="ti ti-list-check fs-6" />
                      <p className="mb-0 fs-3">My Task</p>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline-primary mx-3 mt-2 d-block"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      {/* Header End */}
    </>
  );
};

export default Header;