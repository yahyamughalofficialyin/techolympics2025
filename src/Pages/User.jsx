import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [displayedUser, setDisplayedUser] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    image: null
  });

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    image: null
  });

  // Fetch users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:5000/api/user/");
        setUsers(usersRes.data);
        // Set the first user as the initially displayed user
        if (usersRes.data.length > 0) {
          setDisplayedUser(usersRes.data[0]);
        }
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update displayed user when selectedUser changes (for edit/delete)
  useEffect(() => {
    if (selectedUser) {
      const updatedUser = users.find(user => user._id === selectedUser._id);
      if (updatedUser) {
        setDisplayedUser(updatedUser);
      }
    }
  }, [users, selectedUser]);

  const handleRowClick = (user) => {
    setDisplayedUser(user);
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
      if (addForm.image) {
        formData.append('image', addForm.image);
      }

      const res = await axios.post("http://localhost:5000/api/user/create", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUsers([...users, res.data.user]);
      setShowAddModal(false);
      setAddForm({
        username: '',
        email: '',
        password: '',
        image: null
      });
      toast.success("User created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('email', editForm.email);
      if (editForm.image) {
        formData.append('image', editForm.image);
      }

      const res = await axios.put(
        `http://localhost:5000/api/user/update/${selectedUser._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUsers(users.map(user => 
        user._id === selectedUser._id ? res.data.user : user
      ));
      setShowEditModal(false);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/user/delete/${selectedUser._id}`);
      setUsers(users.filter(user => user._id !== selectedUser._id));
      setShowDeleteModal(false);
      // If we're deleting the displayed user, set the first user as displayed
      if (displayedUser?._id === selectedUser._id) {
        setDisplayedUser(users.length > 1 ? users.find(user => user._id !== selectedUser._id) : null);
      }
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      image: null
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
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
                    <button type="submit" className="btn btn-primary">Save User</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
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
                    <label htmlFor="editImage" className="form-label">Profile Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="editImage"
                      name="image"
                      onChange={handleEditInputChange}
                      accept="image/*"
                    />
                    {selectedUser?.image?.url && (
                      <div className="mt-2">
                        <small>Current Image:</small>
                        <img 
                          src={selectedUser.image.url} 
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
                <p>Are you sure you want to delete user: <strong>{selectedUser?.username}</strong>?</p>
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
                {displayedUser?.image?.url ? (
                  <img
                    src={displayedUser.image.url}
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
                <h5 className="card-title fw-semibold">{displayedUser?.username || 'No user selected'}</h5>
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
                    {displayedUser?.email || '-'}
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
                  <h5 className="card-title fw-semibold mb-4">Users Table</h5>
                </div>
                <div className="col-3"></div>
                <div className="col-2">
                  <button className="btn btn-success" onClick={() => setShowAddModal(true)}>Add User</button>
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
                        <h6 className="fw-semibold mb-0">Actions</h6>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr 
                        key={user._id}
                        onClick={() => handleRowClick(user)}
                        style={{ cursor: 'pointer' }}
                        className={displayedUser?._id === user._id ? 'table-active' : ''}
                      >
                        <td className="border-bottom-0">
                          {user.image?.url ? (
                            <img
                              src={user.image.url}
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
                          <h6 className="fw-semibold mb-1">{user.username}</h6>
                        </td>
                        <td className="border-bottom-0">
                          <p className="mb-0 fw-normal">{user.email}</p>
                        </td>
                        <td className="border-bottom-0">
                          <div className="d-flex align-items-center gap-2">
                            <button 
                              className="btn bg-warning rounded-3 fw-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(user);
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
                                handleDeleteClick(user);
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

export default User;