import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [displayedProduct, setDisplayedProduct] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    price: '',
    category: '',
    image: null
  });

  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    category: '',
    image: null
  });

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/product/"),
          axios.get("http://localhost:5000/api/category")
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        if (productsRes.data.length > 0) {
          setDisplayedProduct(productsRes.data[0]);
        }
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update displayed product when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      const updatedProduct = products.find(p => p._id === selectedProduct._id);
      if (updatedProduct) setDisplayedProduct(updatedProduct);
    }
  }, [products, selectedProduct]);

  const handleRowClick = (product) => {
    setDisplayedProduct(product);
  };

  const handleAddInputChange = (e) => {
    const { name, value, files } = e.target;
    setAddForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!addForm.image) {
        return toast.error("Product image is required");
      }

      const formData = new FormData();
      formData.append('name', addForm.name);
      formData.append('price', addForm.price);
      formData.append('category', addForm.category);
      formData.append('image', addForm.image);

      const res = await axios.post("http://localhost:5000/api/product/create", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProducts([...products, res.data.product]);
      setShowAddModal(false);
      setAddForm({
        name: '',
        price: '',
        category: '',
        image: null
      });
      toast.success("Product created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create product");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('price', editForm.price);
      formData.append('category', editForm.category);
      if (editForm.image) {
        formData.append('image', editForm.image);
      }

      const res = await axios.put(
        `http://localhost:5000/api/product/update/${selectedProduct._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setProducts(products.map(p => 
        p._id === selectedProduct._id ? res.data.product : p
      ));
      setShowEditModal(false);
      toast.success("Product updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/product/delete/${selectedProduct._id}`);
      setProducts(products.filter(p => p._id !== selectedProduct._id));
      setShowDeleteModal(false);
      if (displayedProduct?._id === selectedProduct._id) {
        setDisplayedProduct(products.length > 1 ? products.find(p => p._id !== selectedProduct._id) : null);
      }
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      category: product.category._id,
      image: null
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <div className="container-fluid">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Product</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={addForm.name}
                      onChange={handleAddInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={addForm.price}
                      onChange={handleAddInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={addForm.category}
                      onChange={handleAddInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Product Image</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      onChange={handleAddInputChange}
                      accept="image/*"
                      required
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Product</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Product</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={editForm.category}
                      onChange={handleEditInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Product Image</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      onChange={handleEditInputChange}
                      accept="image/*"
                    />
                    {selectedProduct?.image?.url && (
                      <div className="mt-2">
                        <small>Current Image:</small>
                        <img 
                          src={selectedProduct.image.url} 
                          alt="Product" 
                          width="100" 
                          className="d-block mt-1 img-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete product: <strong>{selectedProduct?.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              {displayedProduct ? (
                <>
                  <div className="text-center mb-4">
                    {displayedProduct.image?.url ? (
                      <img
                        src={displayedProduct.image.url}
                        alt={displayedProduct.name}
                        className="img-fluid rounded"
                        style={{maxHeight: '300px', objectFit: 'contain'}}
                      />
                    ) : (
                      <div className="bg-light d-flex align-items-center justify-content-center rounded" 
                           style={{height: '300px'}}>
                        <span>No Image Available</span>
                      </div>
                    )}
                  </div>
                  <h3 className="card-title">{displayedProduct.name}</h3>
                  <h4 className="text-primary">PKR. {displayedProduct.price?.toFixed(2)}</h4>
                  <div className="mt-4">
                    <h5>Category: {displayedProduct.category?.name}</h5>
                    <p>Products in this category: {displayedProduct.category?.count}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <h4>No product selected</h4>
                  <p>Select a product from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Products</h2>
                <button 
                  className="btn btn-success"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>Add Product
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map(product => (
                        <tr 
                          key={product._id}
                          onClick={() => handleRowClick(product)}
                          style={{cursor: 'pointer'}}
                          className={displayedProduct?._id === product._id ? 'table-active' : ''}
                        >
                          <td>
                            {product.image?.url ? (
                              <img
                                src={product.image.url}
                                alt={product.name}
                                width="50"
                                height="50"
                                className="rounded"
                                style={{objectFit: 'contain'}}
                              />
                            ) : (
                              <div className="bg-light rounded" style={{width: '50px', height: '50px'}}></div>
                            )}
                          </td>
                          <td>{product.name}</td>
                          <td>PKR. {product.price?.toFixed(2)}</td>
                          <td>{product.category?.name}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(product);
                                }}
                              >
                                <i className="ti ti-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(product);
                                }}
                              >
                                <i className="ti ti-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4">No products found</td>
                      </tr>
                    )}
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

export default Product;