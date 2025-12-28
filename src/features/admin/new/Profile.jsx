import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Alert,
    Snackbar,
} from "@mui/material";
import { useAuth } from "../../../contexts/AuthContext";

const Profile = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // This would be replaced with the actual API endpoint
            // await apiRequest('/api/admin/profile', {
            //   method: 'PUT',
            //   body: JSON.stringify(formData)
            // });
            setSnackbar({
                open: true,
                message: "Profile updated successfully",
                severity: "success",
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to update profile",
                severity: "error",
            });
            console.error("Error updating profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Profile
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>
                    Account Information
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        margin="normal"
                        disabled
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        margin="normal"
                        type="email"
                    />

                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        margin="normal"
                    />

                    <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        margin="normal"
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update Profile"}
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, maxWidth: 600, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Change Password
                </Typography>

                <Alert severity="info" sx={{ mt: 2 }}>
                    To change your password, please contact your system
                    administrator.
                </Alert>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
            />
        </Box>
    );
};

export default Profile;
