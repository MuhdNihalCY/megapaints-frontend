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

const AddUserForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        phone: "",
        department: "",
    });

    const roles = ["Admin", "Manager", "Employee", "Supervisor"];

    const departments = [
        "Sales",
        "Production",
        "Quality Control",
        "Logistics",
        "Customer Service",
    ];

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
        // Navigate back to users list
        navigate("/admin/users");
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold", mb: 3 }}
            >
                Add User
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
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
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role} value={role}>
                                            {role}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    {departments.map((department) => (
                                        <MenuItem
                                            key={department}
                                            value={department}
                                        >
                                            {department}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                                    onClick={() => navigate("/admin/users")}
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
                                    Save User
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AddUserForm;
