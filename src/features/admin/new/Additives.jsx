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
    CircularProgress,
    IconButton,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";

const Additives = () => {
    const { apiRequest } = useAuth();
    const [additives, setAdditives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAdditive, setEditingAdditive] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        group: "",
        price: "",
        priceUnit: "kg",
        abbreviation: "",
        description: "",
    });

    // Fetch additives
    useEffect(() => {
        const fetchAdditives = async () => {
            try {
                setLoading(true);
                // Fetch additives from the backend API
                const response = await apiRequest("/v1/additive");
                if (response.success) {
                    setAdditives(response.additives || []);
                    setError("");
                } else {
                    throw new Error(
                        response.error || "Failed to fetch additives",
                    );
                }
            } catch (err) {
                setError("Failed to fetch additives: " + err.message);
                console.error("Error fetching additives:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdditives();
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
            if (editingAdditive) {
                // Update existing additive
                response = await apiRequest(
                    `/v1/additive/${editingAdditive._id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(formData),
                    },
                );

                if (response._id) {
                    // Update successful, refresh the list
                    const updatedAdditives = additives.map((add) =>
                        add._id === editingAdditive._id
                            ? { ...add, ...formData }
                            : add,
                    );
                    setAdditives(updatedAdditives);
                    setSnackbar({
                        open: true,
                        message: "Additive updated successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(
                        response.error || "Failed to update additive",
                    );
                }
            } else {
                // Add new additive
                response = await apiRequest("/v1/additive", {
                    method: "POST",
                    body: JSON.stringify(formData),
                });

                if (response._id) {
                    // Add successful
                    setAdditives([...additives, response]);
                    setSnackbar({
                        open: true,
                        message: "Additive added successfully",
                        severity: "success",
                    });
                } else {
                    throw new Error(response.error || "Failed to add additive");
                }
            }

            // Reset form and close dialog
            setFormData({
                name: "",
                code: "",
                group: "",
                price: "",
                priceUnit: "kg",
                abbreviation: "",
                description: "",
            });
            setEditingAdditive(null);
            setOpenDialog(false);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to save additive",
                severity: "error",
            });
            console.error("Error saving additive:", err);
        }
    };

    const handleEditAdditive = (additive) => {
        setFormData({
            name: additive.name || "",
            code: additive.code || "",
            group: additive.group || "",
            price: additive.price || "",
            priceUnit: additive.priceUnit || "kg",
            abbreviation: additive.abbreviation || "",
            description: additive.description || "",
        });
        setEditingAdditive(additive);
        setOpenDialog(true);
    };

    const handleDeleteAdditive = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this additive?",
        );
        if (!confirmDelete) return;

        try {
            const response = await apiRequest(`/v1/additive/${id}`, {
                method: "DELETE",
            });

            if (response.message) {
                // Delete successful
                setAdditives(additives.filter((a) => a._id !== id));
                setSnackbar({
                    open: true,
                    message: "Additive deleted successfully",
                    severity: "success",
                });
            } else {
                throw new Error(response.error || "Failed to delete additive");
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.message || "Failed to delete additive",
                severity: "error",
            });
            console.error("Error deleting additive:", err);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAdditive(null);
        setFormData({
            name: "",
            code: "",
            group: "",
            price: "",
            priceUnit: "kg",
            abbreviation: "",
            description: "",
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
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h4">Additives</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add New Additive
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
                            <TableCell>Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {additives.map((additive) => (
                            <TableRow key={additive._id}>
                                <TableCell>{additive.name}</TableCell>
                                <TableCell>{additive.code}</TableCell>
                                <TableCell>{additive.group}</TableCell>
                                <TableCell>
                                    {additive.price} {additive.priceUnit}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() =>
                                            handleEditAdditive(additive)
                                        }
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() =>
                                            handleDeleteAdditive(additive._id)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
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
                    {editingAdditive ? "Edit Additive" : "Add New Additive"}
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
                        label="Code"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Group"
                        name="group"
                        value={formData.group}
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
                        label="Price Unit"
                        name="priceUnit"
                        value={formData.priceUnit}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Abbreviation"
                        name="abbreviation"
                        value={formData.abbreviation}
                        onChange={handleInputChange}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingAdditive ? "Update" : "Add"}
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

export default Additives;
