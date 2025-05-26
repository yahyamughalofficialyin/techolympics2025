import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admin = () => {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [displayedAdmin, setDisplayedAdmin] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    image: null
  });

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
    image: null
  });

  // Fetch admins and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsRes, rolesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/"),
          axios.get("http://localhost:5000/api/role/")
        ]);
        setAdmins(adminsRes.data);
        setRoles(rolesRes.data);
        // Set the first admin as the initially displayed admin
        if (adminsRes.data.length > 0) {
          setDisplayedAdmin(adminsRes.data[0]);
        }
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update displayed admin when selectedAdmin changes (for edit/delete)
  useEffect(() => {
    if (selectedAdmin) {
      const updatedAdmin = admins.find(admin => admin._id === selectedAdmin._id);
      if (updatedAdmin) {
        setDisplayedAdmin(updatedAdmin);
      }
    }
  }, [admins, selectedAdmin]);

  const handleRowClick = (admin) => {
    setDisplayedAdmin(admin);
  };

  const handleAddInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setAddForm({...addForm, [name]: files[0]});
    } else {
      setAddForm({...addForm, [name]: value});
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setEditForm({...editForm, [name]: files[0]});
    } else {
      setEditForm({...editForm, [name]: value});
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', addForm.username);
      formData.append('email', addForm.email);
      formData.append('password', addForm.password);
      formData.append('role', addForm.role);
      if (addForm.image) {
        formData.append('image', addForm.image);
      }

      const res = await axios.post("http://localhost:5000/api/admin/create", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAdmins([...admins, res.data.user]); // Note: API returns { user: newUser }
      setShowAddModal(false);
      setAddForm({
        username: '',
        email: '',
        password: '',
        role: '',
        image: null
      });
      toast.success("Admin created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create Admin");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('email', editForm.email);
      formData.append('role', editForm.role);
      if (editForm.image) {
        formData.append('image', editForm.image);
      }

      const res = await axios.put(
        `http://localhost:5000/api/admin/update/${selectedAdmin._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAdmins(admins.map(admin => 
        admin._id === selectedAdmin._id ? res.data.user : admin // Note: API returns { user: updatedUser }
      ));
      setShowEditModal(false);
      toast.success("Admin updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update Admin");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/delete/${selectedAdmin._id}`);
      setAdmins(admins.filter(admin => admin._id !== selectedAdmin._id));
      setShowDeleteModal(false);
      // If we're deleting the displayed admin, set the first admin as displayed
      if (displayedAdmin?._id === selectedAdmin._id) {
        setDisplayedAdmin(admins.length > 1 ? admins.find(admin => admin._id !== selectedAdmin._id) : null);
      }
      toast.success("Admin deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete Admin");
    }
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      username: admin.username,
      email: admin.email,
      role: admin.role._id,
      image: null
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddSubmit}>
                  <div className="mb-3">
                    <label htmlFor="addUsername" className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      id="addUsername"
                      name="username"
                      value={addForm.username}
                      onChange={handleAddInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="addEmail" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="addEmail"
                      name="email"
                      value={addForm.email}
                      onChange={handleAddInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="addPassword" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="addPassword"
                      name="password"
                      value={addForm.password}
                      onChange={handleAddInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="addRole" className="form-label">Role</label>
                    <select
                      className="form-control"
                      id="addRole"
                      name="role"
                      value={addForm.role}
                      onChange={handleAddInputChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="addImage" className="form-label">Profile Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="addImage"
                      name="image"
                      onChange={handleAddInputChange}
                      accept="image/*"
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Close</button>
                    <button type="submit" className="btn btn-primary">Save Admin</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="editUsername" className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      id="editUsername"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editEmail" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="editEmail"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editRole" className="form-label">Role</label>
                    <select
                      className="form-control"
                      id="editRole"
                      name="role"
                      value={editForm.role}
                      onChange={handleEditInputChange}
                      required
                    >
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editImage" className="form-label">Profile Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="editImage"
                      name="image"
                      onChange={handleEditInputChange}
                      accept="image/*"
                    />
                    {selectedAdmin?.image?.url && (
                      <div className="mt-2">
                        <small>Current Image:</small>
                        <img 
                          src={selectedAdmin.image.url} 
                          alt="Profile" 
                          width="50" 
                          className="d-block mt-1"
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete admin: <strong>{selectedAdmin?.username}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-4 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="mb-4">
                {displayedAdmin?.image?.url ? (
                  <img
                    src={displayedAdmin.image.url}
                    alt="Profile"
                    width={300}
                    height={300}
                    style={{objectFit: "cover"}}
                    className="rounded-circle"
                  />
                ) : (
                  <div className="rounded-circle bg-light" style={{width: 300, height: 300, objectFit: "cover" }}></div>
                )}
              </div>
              <div className="mb-4">
                <h5 className="card-title fw-semibold">{displayedAdmin?.username || 'No admin selected'}</h5>
              </div>
              <ul className="timeline-widget mb-0 position-relative mb-n5">
                <li className="timeline-item d-flex position-relative overflow-hidden">
                  <div className="timeline-time text-dark flex-shrink-0 text-end">
                    Email
                  </div>
                  <div className="timeline-badge-wrap d-flex flex-column align-items-center">
                    <span className="timeline-badge border-2 border border-primary flex-shrink-0 my-8" />
                    <span className="timeline-badge-border d-block flex-shrink-0" />
                  </div>
                  <div className="timeline-desc fs-3 text-dark mt-n1">
                    {displayedAdmin?.email || '-'}
                  </div>
                </li>
                <li className="timeline-item d-flex position-relative overflow-hidden">
                  <div className="timeline-time text-dark flex-shrink-0 text-end">
                    Role
                  </div>
                  <div className="timeline-badge-wrap d-flex flex-column align-items-center">
                    <span className="timeline-badge border-2 border border-info flex-shrink-0 my-8" />
                    <span className="timeline-badge-border d-block flex-shrink-0" />
                  </div>
                  <div className="timeline-desc fs-3 text-dark mt-n1 fw-semibold">
                    {displayedAdmin?.role?.name || '-'}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-lg-8 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
              <div className="row">
                <div className="col-6">
                  <h5 className="card-title fw-semibold mb-4">Admins Table</h5>
                </div>
                <div className="col-3"></div>
                <div className="col-2">
                  <button className="btn btn-success" onClick={() => setShowAddModal(true)}>Add Admin</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th className="border-bottom-0"></th>
                      <th className="border-bottom-0">
                        <h6 className="fw-semibold mb-0">Username</h6>
                      </th>
                      <th className="border-bottom-0">
                        <h6 className="fw-semibold mb-0">Email</h6>
                      </th>
                      <th className="border-bottom-0">
                        <h6 className="fw-semibold mb-0">Role</h6>
                      </th>
                      <th className="border-bottom-0">
                        <h6 className="fw-semibold mb-0">Actions</h6>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr 
                        key={admin._id}
                        onClick={() => handleRowClick(admin)}
                        style={{ cursor: 'pointer' }}
                        className={displayedAdmin?._id === admin._id ? 'table-active' : ''}
                      >
                        <td className="border-bottom-0">
                          {admin.image?.url ? (
                            <img
                              src={admin.image.url}
                              alt="Profile"
                              width={35}
                              height={35}
                              style={{objectFit:"cover"}}
                              className="rounded-circle"
                            />
                          ) : (
                            <div className="rounded-circle bg-light" style={{width: 35, height: 35}}></div>
                          )}
                        </td>
                        <td className="border-bottom-0">
                          <h6 className="fw-semibold mb-1">{admin.username}</h6>
                        </td>
                        <td className="border-bottom-0">
                          <p className="mb-0 fw-normal">{admin.email}</p>
                        </td>
                        <td className="border-bottom-0">
                          <span className="fw-normal">{admin.role?.name}</span>
                        </td>
                        <td className="border-bottom-0">
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn bg-warning rounded-3 fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(admin);
                              }}
                            >
                              <span>
                                <i className="ti ti-pencil"></i>
                              </span>
                            </button>
                            <button 
                              className="btn bg-danger rounded-3 fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(admin);
                              }}
                            >
                              <span>
                                <i className="ti ti-trash"></i>
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;