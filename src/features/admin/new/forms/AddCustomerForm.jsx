import React, { useState } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AddCustomerForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        phone: "",
        email: "",
        address: "",
        customerType: "",
    });

    const customerTypes = ["Individual", "Business", "Contractor", "Retailer"];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Form submission logic would go here
        // Navigate back to customers list
        navigate("/admin/customers");
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold", mb: 3 }}
            >
                Add Customer
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Customer Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Company"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                type="email"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Customer Type</InputLabel>
                                <Select
                                    name="customerType"
                                    value={formData.customerType}
                                    onChange={handleChange}
                                    required
                                >
                                    {customerTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 2,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate("/admin/customers")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    type="submit"
                                    sx={{
                                        backgroundColor: "#1976d2",
                                        "&:hover": {
                                            backgroundColor: "#1565c0",
                                        },
                                    }}
                                >
                                    Save Customer
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AddCustomerForm;
