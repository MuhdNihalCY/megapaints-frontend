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
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import api from "../../../utils/api";

/**
 * Admin page to manage Controlled Access keys.
 * These keys are used in Create Formula (user portal) to allow file number editing.
 */
const ControlledAccess = () => {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [formData, setFormData] = useState({ key: "", label: "Access Key" });
    const [submitting, setSubmitting] = useState(false);

    const fetchKeys = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/controlled-access-keys");
            const list = res.data?.data?.keys ?? [];
            setKeys(list);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load access keys");
            setKeys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleOpenAdd = () => {
        setFormData({ key: "", label: "Access Key" });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData({ key: "", label: "Access Key" });
    };

    const handleAddKey = async () => {
        const key = (formData.key || "").trim();
        if (!key) {
            setSnackbar({ open: true, message: "Please enter an access key", severity: "warning" });
            return;
        }
        try {
            setSubmitting(true);
            await api.post("/admin/controlled-access-keys", {
                key,
                label: (formData.label || "Access Key").trim(),
            });
            setSnackbar({ open: true, message: "Access key added", severity: "success" });
            handleCloseDialog();
            fetchKeys();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || "Failed to add access key",
                severity: "error",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this access key? Users will no longer be able to use it for file number editing.")) return;
        try {
            await api.delete(`/admin/controlled-access-keys/${id}`);
            setSnackbar({ open: true, message: "Access key removed", severity: "success" });
            fetchKeys();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || "Failed to remove access key",
                severity: "error",
            });
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar((s) => ({ ...s, open: false }));
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6">
                    Controlled Access Keys
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                >
                    Add access key
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These keys are used in the user portal (Create Formula) to verify access before
                editing the file number, and for CRM delete actions (tasks and follow-up logs). Add a key here and share it with users who should have these permissions.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Typography color="text.secondary">Loading...</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Label</TableCell>
                                <TableCell>Key (masked)</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {keys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        No access keys yet. Add one to allow users to verify in Create Formula.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                keys.map((row) => (
                                    <TableRow key={row._id}>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell sx={{ fontFamily: "monospace" }}>{row.keyMasked}</TableCell>
                                        <TableCell>
                                            {row.createdAt
                                                ? new Date(row.createdAt).toLocaleDateString()
                                                : "—"}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(row._id)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add access key</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Access key"
                        type="password"
                        fullWidth
                        value={formData.key}
                        onChange={(e) => setFormData((f) => ({ ...f, key: e.target.value }))}
                        placeholder="Enter the key users will type in Create Formula"
                    />
                    <TextField
                        margin="dense"
                        label="Label (optional)"
                        fullWidth
                        value={formData.label}
                        onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                        placeholder="e.g. Main key"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleAddKey} variant="contained" disabled={submitting}>
                        {submitting ? "Adding…" : "Add key"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ControlledAccess;
