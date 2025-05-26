import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import User from "./Pages/User";
import Product from "./Pages/Product";
import Admin from "./Pages/Admin";

function LayoutWrapper() {
  const location = useLocation();
  const isAuthPage = ['/Login', '/Signup'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Sidebar />}
      {!isAuthPage ? (
        <div className="body-wrapper">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/User" element={<User />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/Product" element={<Product />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Signup" element={<Signup />} />
          </Routes>
        </div>
      ) : (
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  );
}

export default App;