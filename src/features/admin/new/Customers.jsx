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

const Customers = () => {
  const { apiRequest } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    company: ''
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // This would be replaced with the actual API endpoint
        // const data = await apiRequest('/api/v1/customer');
        // For now, using mock data
        const mockData = [
          { id: 'CUST001', name: 'ABC Company', email: 'contact@abccompany.com', phone: '+1234567890', address: '123 Main St', company: 'ABC Company' },
          { id: 'CUST002', name: 'XYZ Corporation', email: 'info@xyzcorp.com', phone: '+1234567891', address: '456 Oak Ave', company: 'XYZ Corporation' }
        ];
        setCustomers(mockData);
        setError('');
      } catch (err) {
        setError('Failed to fetch customers');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
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
      if (editingCustomer) {
        // Update existing customer
        // await apiRequest(`/api/v1/customer/${formData.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Customer updated successfully', severity: 'success' });
      } else {
        // Add new customer
        // await apiRequest('/api/v1/customer', {
        //   method: 'POST',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Customer added successfully', severity: 'success' });
      }
      
      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        company: ''
      });
      setEditingCustomer(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save customer', severity: 'error' });
      console.error('Error saving customer:', err);
    }
  };

  const handleEditCustomer = (customer) => {
    setFormData({ ...customer });
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteCustomer = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this customer?');
    if (!confirmDelete) return;

    try {
      // await apiRequest(`/api/v1/customer/${id}`, {
      //   method: 'DELETE'
      // });
      setCustomers(customers.filter(c => c.id !== id));
      setSnackbar({ open: true, message: 'Customer deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete customer', severity: 'error' });
      console.error('Error deleting customer:', err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      id: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      company: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Customer
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
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditCustomer(customer)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteCustomer(customer.id)}
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
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Update' : 'Add'}
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

export default Customers;