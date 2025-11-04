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

const Accessories = () => {
  const { apiRequest } = useAuth();
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    unit: ''
  });

  // Fetch accessories
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        // This would be replaced with the actual API endpoint
        // const data = await apiRequest('/api/v1/accessory');
        // For now, using mock data
        const mockData = [
          { id: 'ACC001', name: 'Paint Brush Set', description: 'Set of 5 premium brushes', price: '25.99', unit: 'set' },
          { id: 'ACC002', name: 'Roller Kit', description: 'Professional paint roller with tray', price: '15.50', unit: 'kit' }
        ];
        setAccessories(mockData);
        setError('');
      } catch (err) {
        setError('Failed to fetch accessories');
        console.error('Error fetching accessories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessories();
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
      if (editingAccessory) {
        // Update existing accessory
        // await apiRequest(`/api/v1/accessory/${formData.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Accessory updated successfully', severity: 'success' });
      } else {
        // Add new accessory
        // await apiRequest('/api/v1/accessory', {
        //   method: 'POST',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Accessory added successfully', severity: 'success' });
      }
      
      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        description: '',
        price: '',
        unit: ''
      });
      setEditingAccessory(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save accessory', severity: 'error' });
      console.error('Error saving accessory:', err);
    }
  };

  const handleEditAccessory = (accessory) => {
    setFormData({ ...accessory });
    setEditingAccessory(accessory);
    setOpenDialog(true);
  };

  const handleDeleteAccessory = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this accessory?');
    if (!confirmDelete) return;

    try {
      // await apiRequest(`/api/v1/accessory/${id}`, {
      //   method: 'DELETE'
      // });
      setAccessories(accessories.filter(a => a.id !== id));
      setSnackbar({ open: true, message: 'Accessory deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete accessory', severity: 'error' });
      console.error('Error deleting accessory:', err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccessory(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      unit: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Accessories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Accessory
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
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessories.map((accessory) => (
              <TableRow key={accessory.id}>
                <TableCell>{accessory.id}</TableCell>
                <TableCell>{accessory.name}</TableCell>
                <TableCell>{accessory.description}</TableCell>
                <TableCell>{accessory.price}</TableCell>
                <TableCell>{accessory.unit}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditAccessory(accessory)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteAccessory(accessory.id)}
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
          {editingAccessory ? 'Edit Accessory' : 'Add New Accessory'}
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
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            multiline
            rows={3}
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
            label="Unit"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAccessory ? 'Update' : 'Add'}
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

export default Accessories;