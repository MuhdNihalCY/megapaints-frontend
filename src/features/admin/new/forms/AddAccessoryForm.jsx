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
    Chip,
    OutlinedInput,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AddAccessoryForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price: "",
        description: "",
        compatibleWith: [],
    });

    const accessoryCategories = [
        "Brushes",
        "Rollers",
        "Trays",
        "Tapes",
        "Drop Cloths",
        "Tools",
    ];

    const compatibleProducts = [
        "Interior Paint",
        "Exterior Paint",
        "Primer",
        "Stains",
        "Clear Coats",
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleCompatibleWithChange = (e) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            compatibleWith:
                typeof value === "string" ? value.split(",") : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Form submission logic would go here
        // Navigate back to accessories list
        navigate("/admin/accessories");
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold", mb: 3 }}
            >
                Add Accessory
            </Typography>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Accessory Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                type="number"
                                InputProps={{
                                    startAdornment: <span>$</span>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    {accessoryCategories.map((category) => (
                                        <MenuItem
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Compatible With</InputLabel>
                                <Select
                                    multiple
                                    value={formData.compatibleWith}
                                    onChange={handleCompatibleWithChange}
                                    input={
                                        <OutlinedInput label="Compatible With" />
                                    }
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 0.5,
                                            }}
                                        >
                                            {selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={value}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {compatibleProducts.map((product) => (
                                        <MenuItem key={product} value={product}>
                                            {product}
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
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 2,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        navigate("/admin/accessories")
                                    }
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
                                    Save Accessory
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AddAccessoryForm;
