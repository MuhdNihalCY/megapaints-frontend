import { useState, useEffect } from "react";
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
    Snackbar,
    IconButton,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Category as CategoryIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";

const Categories = () => {
    const { apiRequest } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        name: "",
        // Add other fields as needed based on the backend schema
    });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                // Fetch categories from the backend API
                const response = await apiRequest("/v1/category");
                if (response.success) {
                    setCategories(response.categories || []);
                    setError("");
                } else {
                    setError(response.error || "Failed to fetch categories");
                }
            } catch (err) {
                setError("Failed to fetch categories: " + err.message);
                console.error("Error fetching categories:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async () => {
        try {
            if (editingCategory) {
                // Update existing category
                const response = await apiRequest(
                    `/v1/category/${editingCategory._id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(formData),
                    },
                );

                if (response._id) {
                    // Update successful, refresh the list
                    const updatedCategories = categories.map((cat) =>
                        cat._id === editingCategory._id
                            ? { ...cat, ...formData }
                            : cat,
                    );
                    setCategories(updatedCategories);
                    setSnackbar({
                        open: true,
                        message: "Category updated successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(
                        response.error || "Failed to update category",
                    );
                }
            } else {
                // Add new category
                const response = await apiRequest("/v1/category", {
                    method: "POST",
                    body: JSON.stringify(formData),
                });

                if (response._id) {
                    // Add successful
                    setCategories([...categories, response]);
                    setSnackbar({
                        open: true,
                        message: "Category added successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(response.error || "Failed to add category");
                }
            }

            // Reset form and close dialog
            setFormData({
                name: "",
                // Reset other fields as needed
            });
            setEditingCategory(null);
            setOpenDialog(false);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to save category",
                severity: "error",
            });
            console.error("Error saving category:", err);
        }
    };

    const handleEditCategory = (category) => {
        setFormData({
            name: category.name || category.Category || "",
            // Populate other fields as needed
        });
        setEditingCategory(category);
        setOpenDialog(true);
    };

    const handleDeleteCategory = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this category?",
        );
        if (!confirmDelete) return;

        try {
            const response = await apiRequest(`/v1/category/${id}`, {
                method: "DELETE",
            });

            if (response.message) {
                // Delete successful
                setCategories(categories.filter((c) => c._id !== id));
                setSnackbar({
                    open: true,
                    message: "Category deleted successfully",
                    severity: "success",
                });
            } else {
                throw new Error(response.error || "Failed to delete category");
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to delete category",
                severity: "error",
            });
            console.error("Error deleting category:", err);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
        setFormData({
            name: "",
            // Reset other fields as needed
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Page Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                        Category Management
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ color: "text.secondary" }}
                    >
                        Organize your products by creating and managing
                        categories
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{
                        backgroundColor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                        padding: "10px 20px",
                        boxShadow: 2,
                        "&:hover": {
                            backgroundColor: "primary.dark",
                            boxShadow: 4,
                        },
                    }}
                >
                    Add New Category
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Categories Overview Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Categories Overview
                </Typography>

                {categories.length === 0 ? (
                    // Empty State
                    <Card
                        sx={{
                            textAlign: "center",
                            p: 6,
                            backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                    ? "rgba(255,255,255,0.05)"
                                    : "rgba(0, 0, 0, 0.02)",
                            border: (theme) =>
                                `1px dashed ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <CategoryIcon
                                sx={{
                                    fontSize: 60,
                                    color: "primary.main",
                                    mb: 2,
                                    opacity: 0.7,
                                }}
                            />
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 600, mb: 1 }}
                            >
                                No Categories Found
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: "text.secondary", mb: 3 }}
                            >
                                Start by creating your first category to
                                organize products
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenDialog(true)}
                                sx={{
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                    padding: "8px 16px",
                                    boxShadow: 2,
                                    "&:hover": {
                                        backgroundColor: "primary.dark",
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                Create First Category
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    // Categories Table
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: (theme) =>
                                            theme.palette.mode === "dark"
                                                ? "rgba(0, 0, 0, 0.1)"
                                                : "rgba(0, 0, 0, 0.02)",
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        ID
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        Category Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600 }}
                                        align="right"
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow
                                        key={category._id}
                                        sx={{
                                            "&:hover": {
                                                backgroundColor: (theme) =>
                                                    theme.palette.mode ===
                                                    "dark"
                                                        ? "rgba(0, 0, 0, 0.05)"
                                                        : "rgba(0, 0, 0, 0.03)",
                                            },
                                        }}
                                    >
                                        <TableCell>{category._id}</TableCell>
                                        <TableCell>
                                            {category.name ||
                                                category.Category ||
                                                "N/A"}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={() =>
                                                    handleEditCategory(category)
                                                }
                                                sx={{
                                                    color: "primary.main",
                                                    "&:hover": {
                                                        backgroundColor: (
                                                            theme,
                                                        ) =>
                                                            theme.palette
                                                                .mode === "dark"
                                                                ? "rgba(0, 0, 0, 0.1)"
                                                                : "rgba(0, 0, 0, 0.05)",
                                                    },
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() =>
                                                    handleDeleteCategory(
                                                        category._id,
                                                    )
                                                }
                                                sx={{
                                                    color: "error.main",
                                                    "&:hover": {
                                                        backgroundColor: (
                                                            theme,
                                                        ) =>
                                                            theme.palette
                                                                .mode === "dark"
                                                                ? "rgba(255, 0, 0, 0.1)"
                                                                : "rgba(255, 0, 0, 0.05)",
                                                    },
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Add/Edit Category Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Category Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            backgroundColor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                            "&:hover": {
                                backgroundColor: "primary.dark",
                            },
                        }}
                    >
                        {editingCategory ? "Update" : "Add"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
            />
        </Box>
    );
};

export default Categories;
