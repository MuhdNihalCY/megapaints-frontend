import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const Products = () => {
  const { apiRequest } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    Product_Name: '',
    Product_Id: '',
    Product_Density: '',
    Abbreviation: '',
    GroupName: '',
    Price: '',
    PriceUnit: 'kg',
    coefficient: '',
    StandardQuatity: '',
    StandardQuantityUnit: 'kg',
    VOC: '',
    SolidContent: '',
    Category: '',
    SubCategory: ''
  });

  // Fetch products and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products, categories, and subcategories from the backend API
        const [productsResponse, categoriesResponse, subCategoriesResponse] = await Promise.all([
          apiRequest('/v1/product'),
          apiRequest('/v1/category'),
          apiRequest('/v1/subcategory')
        ]);
        
        if (productsResponse.success) {
          setProducts(productsResponse.products || []);
        } else {
          throw new Error(productsResponse.error || 'Failed to fetch products');
        }
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories || []);
        } else {
          throw new Error(categoriesResponse.error || 'Failed to fetch categories');
        }
        
        if (subCategoriesResponse.success) {
          setSubCategories(subCategoriesResponse.subcategories || []);
        } else {
          throw new Error(subCategoriesResponse.error || 'Failed to fetch subcategories');
        }
        
        setError('');
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFormData({
      ...formData,
      Category: categoryId,
      SubCategory: '' // Reset subcategory when category changes
    });
  };

  const handleSubmit = async () => {
    try {
      let response;
      if (editingProduct) {
        // Update existing product
        response = await apiRequest(`/v1/product/${formData._id || formData.Product_Id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        
        if (response.Status === true || response._id) {
          // Update successful, refresh the list
          const updatedProducts = products.map(prod => 
            (prod._id === (editingProduct._id || editingProduct.Product_Id)) ? { ...prod, ...formData } : prod
          );
          setProducts(updatedProducts);
          setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
        } else {
          throw new Error(response.error || 'Failed to update product');
        }
      } else {
        // Add new product
        response = await apiRequest('/v1/product', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        if (response.Status === true || response._id) {
          // Add successful, refresh the list
          const newProduct = response.Status ? { ...formData } : response;
          setProducts([...products, newProduct]);
          setSnackbar({ open: true, message: 'Product added successfully', severity: 'success' });
        } else {
          throw new Error(response.error || 'Failed to add product');
        }
      }
      
      // Reset form and close dialog
      setFormData({
        Product_Name: '',
        Product_Id: '',
        Product_Density: '',
        Abbreviation: '',
        GroupName: '',
        Price: '',
        PriceUnit: 'kg',
        coefficient: '',
        StandardQuatity: '',
        StandardQuantityUnit: 'kg',
        VOC: '',
        SolidContent: '',
        Category: '',
        SubCategory: ''
      });
      setEditingProduct(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to save product', severity: 'error' });
      console.error('Error saving product:', err);
    }
  };

  const handleEditProduct = (product) => {
    setFormData({ ...product });
    setEditingProduct(product);
    setOpenDialog(true);
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const response = await apiRequest(`/v1/product/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.message) {
        // Delete successful
        setProducts(products.filter(p => p._id !== productId && p.Product_Id !== productId));
        setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
      } else {
        throw new Error(response.error || 'Failed to delete product');
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete product', severity: 'error' });
      console.error('Error deleting product:', err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      Product_Name: '',
      Product_Id: '',
      Product_Density: '',
      Abbreviation: '',
      GroupName: '',
      Price: '',
      PriceUnit: 'kg',
      coefficient: '',
      StandardQuatity: '',
      StandardQuantityUnit: 'kg',
      VOC: '',
      SolidContent: '',
      Category: '',
      SubCategory: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter subcategories based on selected category
  const filteredSubCategories = subCategories.filter(
    sc => sc.Category_Id === formData.Category
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id || product.Product_Id}>
                <TableCell>{product.Product_Id || product._id}</TableCell>
                <TableCell>{product.Product_Name}</TableCell>
                <TableCell>{product.Price} {product.PriceUnit}</TableCell>
                <TableCell>
                  {categories.find(c => c._id === product.Category || c.Category_Id === product.Category)?.name || 
                   categories.find(c => c._id === product.Category || c.Category_Id === product.Category)?.Category || 
                   'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditProduct(product)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteProduct(product._id || product.Product_Id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="Product_Name"
                value={formData.Product_Name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product ID"
                name="Product_Id"
                value={formData.Product_Id}
                onChange={handleInputChange}
                required
                disabled={!!editingProduct}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value={formData.Category}
                  onChange={handleCategoryChange}
                  label="Select Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id || category.Category_Id} value={category._id || category.Category_Id}>
                      {category.name || category.Category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!formData.Category}>
                <InputLabel>Select Sub Category</InputLabel>
                <Select
                  value={formData.SubCategory}
                  onChange={handleInputChange}
                  name="SubCategory"
                  label="Select Sub Category"
                >
                  {filteredSubCategories.map((subCategory) => (
                    <MenuItem key={subCategory._id || subCategory.SubCategory_Id} value={subCategory._id || subCategory.SubCategory_Id}>
                      {subCategory.name || subCategory.SubCategory}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Density (ml/1000g)"
                name="Product_Density"
                value={formData.Product_Density}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Abbreviation"
                name="Abbreviation"
                value={formData.Abbreviation}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                name="Price"
                value={formData.Price}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Price Unit</InputLabel>
                <Select
                  value={formData.PriceUnit}
                  onChange={handleInputChange}
                  name="PriceUnit"
                  label="Price Unit"
                >
                  <MenuItem value="kg">Kilogram</MenuItem>
                  <MenuItem value="Ltr">Liter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VOC"
                name="VOC"
                value={formData.VOC}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Solid Content"
                name="SolidContent"
                value={formData.SolidContent}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Products;