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

const Auxiliaries = () => {
  const { apiRequest } = useAuth();
  const [auxiliaries, setAuxiliaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAuxiliary, setEditingAuxiliary] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    density: '',
    unit: ''
  });

  // Fetch auxiliaries
  useEffect(() => {
    const fetchAuxiliaries = async () => {
      try {
        setLoading(true);
        // This would be replaced with the actual API endpoint
        // const data = await apiRequest('/api/v1/auxilary');
        // For now, using mock data
        const mockData = [
          { id: 'AUX001', name: 'Thinner', description: 'Paint thinner solvent', density: '0.8', unit: 'Ltr' },
          { id: 'AUX002', name: 'Hardener', description: 'Epoxy hardener', density: '1.1', unit: 'kg' }
        ];
        setAuxiliaries(mockData);
        setError('');
      } catch (err) {
        setError('Failed to fetch auxiliaries');
        console.error('Error fetching auxiliaries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuxiliaries();
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
      if (editingAuxiliary) {
        // Update existing auxiliary
        // await apiRequest(`/api/v1/auxilary/${formData.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Auxiliary updated successfully', severity: 'success' });
      } else {
        // Add new auxiliary
        // await apiRequest('/api/v1/auxilary', {
        //   method: 'POST',
        //   body: JSON.stringify(formData)
        // });
        setSnackbar({ open: true, message: 'Auxiliary added successfully', severity: 'success' });
      }
      
      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        description: '',
        density: '',
        unit: ''
      });
      setEditingAuxiliary(null);
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save auxiliary', severity: 'error' });
      console.error('Error saving auxiliary:', err);
    }
  };

  const handleEditAuxiliary = (auxiliary) => {
    setFormData({ ...auxiliary });
    setEditingAuxiliary(auxiliary);
    setOpenDialog(true);
  };

  const handleDeleteAuxiliary = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this auxiliary?');
    if (!confirmDelete) return;

    try {
      // await apiRequest(`/api/v1/auxilary/${id}`, {
      //   method: 'DELETE'
      // });
      setAuxiliaries(auxiliaries.filter(a => a.id !== id));
      setSnackbar({ open: true, message: 'Auxiliary deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete auxiliary', severity: 'error' });
      console.error('Error deleting auxiliary:', err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAuxiliary(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      density: '',
      unit: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Auxiliaries</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add New Auxiliary
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
              <TableCell>Density</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auxiliaries.map((auxiliary) => (
              <TableRow key={auxiliary.id}>
                <TableCell>{auxiliary.id}</TableCell>
                <TableCell>{auxiliary.name}</TableCell>
                <TableCell>{auxiliary.description}</TableCell>
                <TableCell>{auxiliary.density}</TableCell>
                <TableCell>{auxiliary.unit}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditAuxiliary(auxiliary)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteAuxiliary(auxiliary.id)}
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
          {editingAuxiliary ? 'Edit Auxiliary' : 'Add New Auxiliary'}
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
            label="Density"
            name="density"
            value={formData.density}
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
            {editingAuxiliary ? 'Update' : 'Add'}
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

export default Auxiliaries;