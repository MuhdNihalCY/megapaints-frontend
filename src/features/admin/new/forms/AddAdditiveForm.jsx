import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AddAdditiveForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    concentration: '',
    description: '',
    applications: [],
  });

  const additiveTypes = [
    'Pigment',
    'Solvent',
    'Binder',
    'Additive',
    'Extender',
  ];

  const applications = [
    'Interior Paint',
    'Exterior Paint',
    'Primer',
    'Wood Finish',
    'Metal Coating',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleApplicationsChange = (e) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      applications: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic would go here
    // Navigate back to additives list
    navigate('/admin/additives');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Add Additive
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Additive Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Concentration (%)"
                name="concentration"
                value={formData.concentration}
                onChange={handleChange}
                required
                type="number"
                InputProps={{
                  endAdornment: <span>%</span>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Additive Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  {additiveTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Applications</InputLabel>
                <Select
                  multiple
                  value={formData.applications}
                  onChange={handleApplicationsChange}
                  input={<OutlinedInput label="Applications" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {applications.map((application) => (
                    <MenuItem key={application} value={application}>
                      {application}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/additives')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }}
                >
                  Save Additive
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AddAdditiveForm;