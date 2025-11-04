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
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const PurchasedItems = () => {
  const { apiRequest } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    supplier: '',
    quantity: '',
    unit: '',
    price: '',
    date: ''
  });

  // Fetch purchased items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // This would be replaced with the actual API endpoint
        // const data = await apiRequest('/api/v1/purchasedItem');
        // For now, using mock data
        const mockData = [
          { id: 'PI001', name: 'White Paint', category: 'Paint', supplier: 'Supplier A', quantity: '100', unit: 'Ltr', price: '2500.00', date: '2023-01-15' },
          { id: 'PI002', name: 'Blue Paint', category: 'Paint', supplier: 'Supplier B', quantity: '50', unit: 'Ltr', price: '1500.00', date: '2023-01-20' }
        ];
        setItems(mockData);
        setError('');
      } catch (err) {
        setError('Failed to fetch purchased items');
        console.error('Error fetching purchased items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        // Update existing item
        // await apiRequest(`/api/v1/purchasedItem/${formData.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Item updated successfully', severity: 'success' });
      } else {
        // Add new item
        // await apiRequest('/api/v1/purchasedItem', {
        //   method: 'POST',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Item added successfully', severity: 'success' });
      }
      
      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        category: '',
        supplier: '',
        quantity: '',
        unit: '',
        price: '',
        date: ''
      });
      setEditingItem(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save item', severity: 'error' });
      console.error('Error saving item:', err);
    }
  };

  const handleEditItem = (item) => {
    setFormData({ ...item });
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this item?');
    if (!confirmDelete) return;

    try {
      // await apiRequest(`/api/v1/purchasedItem/${id}`, {
      //   method: 'DELETE'
      // });
      setItems(items.filter(i => i.id !== id));
      setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
      console.error('Error deleting item:', err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      id: '',
      name: '',
      category: '',
      supplier: '',
      quantity: '',
      unit: '',
      price: '',
      date: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Purchased Items</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Item
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
              <TableCell>Category</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditItem(item)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Supplier"
            name="supplier"
            value={formData.supplier}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Unit"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Add'}
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

export default PurchasedItems;