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
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";

const Binders = () => {
    const { apiRequest } = useAuth();
    const [binders, setBinders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBinder, setEditingBinder] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        density: "",
        unit: "",
    });

    // Fetch binders
    useEffect(() => {
        const fetchBinders = async () => {
            try {
                setLoading(true);
                const response = await apiRequest('/v1/products/binders');
                if (response.success) {
                    setBinders(response.binders || []);
                    setError("");
                } else {
                    throw new Error(
                        response.error || "Failed to fetch binders",
                    );
                }
            } catch (err) {
                setError("Failed to fetch binders: " + err.message);
                console.error("Error fetching binders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBinders();
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
            let response;
            if (editingBinder) {
                // Update existing binder
                response = await apiRequest(`/v1/products/binders/${formData._id || formData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });

                if (response._id) {
                    // Update successful, refresh the list
                    const updatedBinders = binders.map((bind) =>
                        bind._id === (editingBinder._id || editingBinder.id)
                            ? { ...bind, ...formData }
                            : bind,
                    );
                    setBinders(updatedBinders);
                    setSnackbar({
                        open: true,
                        message: "Binder updated successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(
                        response.error || "Failed to update binder",
                    );
                }
            } else {
                // Add new binder
                response = await apiRequest('/v1/products/binders', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });

                if (response._id) {
                    // Add successful
                    setBinders([...binders, response]);
                    setSnackbar({
                        open: true,
                        message: "Binder added successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(response.error || "Failed to add binder");
                }
            }

            // Reset form and close dialog
            setFormData({
                id: "",
                name: "",
                description: "",
                density: "",
                unit: "",
            });
            setEditingBinder(null);
            setOpenDialog(false);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to save binder",
                severity: "error",
            });
            console.error("Error saving binder:", err);
        }
    };

    const handleEditBinder = (binder) => {
        setFormData({ ...binder });
        setEditingBinder(binder);
        setOpenDialog(true);
    };

    const handleDeleteBinder = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this binder?",
        );
        if (!confirmDelete) return;

        try {
            const response = await apiRequest(`/v1/products/binders/${id}`, {
                method: 'DELETE'
            });

            if (response.message) {
                // Delete successful
                setBinders(binders.filter((b) => b._id !== id && b.id !== id));
                setSnackbar({
                    open: true,
                    message: "Binder deleted successfully",
                    severity: "success",
                });
            } else {
                throw new Error(response.error || "Failed to delete binder");
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to delete binder",
                severity: "error",
            });
            console.error("Error deleting binder:", err);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingBinder(null);
        setFormData({
            id: "",
            name: "",
            description: "",
            density: "",
            unit: "",
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h4">Binders</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add New Binder
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
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
                        {binders.map((binder) => (
                            <TableRow key={binder.id}>
                                <TableCell>{binder.id}</TableCell>
                                <TableCell>{binder.name}</TableCell>
                                <TableCell>{binder.description}</TableCell>
                                <TableCell>{binder.density}</TableCell>
                                <TableCell>{binder.unit}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditBinder(binder)}
                                        sx={{ mr: 1 }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                            handleDeleteBinder(binder.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingBinder ? "Edit Binder" : "Add New Binder"}
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
                        {editingBinder ? "Update" : "Add"}
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

export default Binders;
