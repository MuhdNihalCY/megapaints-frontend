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

const Branches = () => {
    const { apiRequest } = useAuth();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        location: "",
        contact: "",
        manager: "",
    });

    // Fetch branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                setLoading(true);
                // This would be replaced with the actual API endpoint
                // const data = await apiRequest('/api/v1/branch');
                // For now, using mock data
                const mockData = [
                    {
                        id: "BR001",
                        name: "Main Branch",
                        location: "Downtown",
                        contact: "+1234567890",
                        manager: "John Doe",
                    },
                    {
                        id: "BR002",
                        name: "North Branch",
                        location: "Northside",
                        contact: "+1234567891",
                        manager: "Jane Smith",
                    },
                ];
                setBranches(mockData);
                setError("");
            } catch (err) {
                setError("Failed to fetch branches");
                console.error("Error fetching branches:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
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
            if (editingBranch) {
                // Update existing branch
                // await apiRequest(`/api/v1/branch/${formData.id}`, {
                //   method: 'PUT',
                //   body: JSON.stringify(formData)
                // });
                setSnackbar({
                    open: true,
                    message: "Branch updated successfully",
                    severity: "success",
                });
            } else {
                // Add new branch
                // await apiRequest('/api/v1/branch', {
                //   method: 'POST',
                //   body: JSON.stringify(formData)
                // });
                setSnackbar({
                    open: true,
                    message: "Branch added successfully",
                    severity: "success",
                });
            }

            // Reset form and close dialog
            setFormData({
                id: "",
                name: "",
                location: "",
                contact: "",
                manager: "",
            });
            setEditingBranch(null);
            setOpenDialog(false);
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to save branch",
                severity: "error",
            });
            console.error("Error saving branch:", err);
        }
    };

    const handleEditBranch = (branch) => {
        setFormData({ ...branch });
        setEditingBranch(branch);
        setOpenDialog(true);
    };

    const handleDeleteBranch = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this branch?",
        );
        if (!confirmDelete) return;

        try {
            // await apiRequest(`/api/v1/branch/${id}`, {
            //   method: 'DELETE'
            // });
            setBranches(branches.filter((b) => b.id !== id));
            setSnackbar({
                open: true,
                message: "Branch deleted successfully",
                severity: "success",
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to delete branch",
                severity: "error",
            });
            console.error("Error deleting branch:", err);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingBranch(null);
        setFormData({
            id: "",
            name: "",
            location: "",
            contact: "",
            manager: "",
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
                <Typography variant="h4">Branches</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add New Branch
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
                            <TableCell>Location</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Manager</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell>{branch.id}</TableCell>
                                <TableCell>{branch.name}</TableCell>
                                <TableCell>{branch.location}</TableCell>
                                <TableCell>{branch.contact}</TableCell>
                                <TableCell>{branch.manager}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditBranch(branch)}
                                        sx={{ mr: 1 }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                            handleDeleteBranch(branch.id)
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
                    {editingBranch ? "Edit Branch" : "Add New Branch"}
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
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Manager"
                        name="manager"
                        value={formData.manager}
                        onChange={handleInputChange}
                        required
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingBranch ? "Update" : "Add"}
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

export default Branches;
