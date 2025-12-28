import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import apiServiceFactory from "../../../services/ApiServiceFactory.js";
import { DESIGNATIONS } from "../../utils/designations";

const UserForm = ({ user = null, onClose, onSuccess }) => {
    const { apiRequest } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([
        "admin",
        "manager",
        "supervisor",
        "operator",
        "viewer",
    ]);
    const [permissions, setPermissions] = useState([
        "products:read",
        "products:write",
        "inventory:read",
        "inventory:write",
        "orders:read",
        "orders:write",
        "users:read",
        "users:write",
        "reports:read",
        "reports:write",
    ]);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        phone: "",
        designation: "",
        roles: [],
        branches: [],
        permissions: [],
        is_active: true,
    });

    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchBranches();
        if (user) {
            setFormData({
                username: user.username || "",
                email: user.email || "",
                password: "",
                confirmPassword: "",
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                phone: user.phone || "",
                designation: user.designation || "",
                roles: user.roles || [],
                branches: user.branches || [],
                permissions: user.permissions || [],
                is_active: user.is_active !== undefined ? user.is_active : true,
            });
        }
    }, [user]);

    const fetchBranches = async () => {
        try {
            const adminServices = apiServiceFactory.initializeAdminServices();
            const response =
                await adminServices.businessManagement.getBranches();
            if (response.status === "success") {
                setBranches(response.data.branches || []);
            }
        } catch (err) {
            console.error("Failed to fetch branches:", err);
            setError("Failed to load branches");
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.username.trim()) {
            errors.username = "Username is required";
        } else if (formData.username.length < 3) {
            errors.username = "Username must be at least 3 characters";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!user && !formData.password) {
            errors.password = "Password is required for new users";
        } else if (formData.password && formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            errors.confirmPassword = "Passwords do not match";
        }

        if (!formData.first_name.trim()) {
            errors.first_name = "First name is required";
        }

        if (!formData.last_name.trim()) {
            errors.last_name = "Last name is required";
        }

        if (!formData.designation.trim()) {
            errors.designation = "Designation is required";
        }

        if (formData.roles.length === 0) {
            errors.roles = "At least one role is required";
        }

        if (formData.branches.length === 0) {
            errors.branches = "At least one branch is required";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleArrayChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const adminServices = apiServiceFactory.initializeAdminServices();

            // Prepare data for API
            const submitData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                phone: formData.phone.trim(),
                designation: formData.designation.trim(),
                roles: formData.roles,
                branches: formData.branches,
                permissions: formData.permissions,
                is_active: formData.is_active,
            };

            // Only include password for new users or when password is provided
            if (!user && formData.password) {
                submitData.password = formData.password;
            } else if (user && formData.password) {
                submitData.password = formData.password;
            }

            let response;
            if (user) {
                // Update existing user
                response = await adminServices.businessManagement.updateUser(
                    user._id,
                    submitData,
                );
            } else {
                // Create new user
                response =
                    await adminServices.businessManagement.createUser(
                        submitData,
                    );
            }

            if (response.status === "success") {
                setSuccess(
                    user
                        ? "User updated successfully!"
                        : "User created successfully!",
                );
                setTimeout(() => {
                    onSuccess && onSuccess(response.data);
                    onClose && onClose();
                }, 1500);
            } else {
                setError(response.message || "Operation failed");
            }
        } catch (err) {
            console.error("User operation failed:", err);
            setError(err.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user ? "Edit User" : "Add New User"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.username
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter username"
                                />
                                {validationErrors.username && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.username}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.email
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter email address"
                                />
                                {validationErrors.email && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password {!user && "*"}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.password
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder={
                                        user
                                            ? "Leave blank to keep current password"
                                            : "Enter password"
                                    }
                                />
                                {validationErrors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Confirm Password {formData.password && "*"}
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.confirmPassword
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Confirm password"
                                />
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.first_name
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter first name"
                                />
                                {validationErrors.first_name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.first_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.last_name
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter last name"
                                />
                                {validationErrors.last_name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.last_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Designation *
                                </label>
                                <select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        validationErrors.designation
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Select designation</option>
                                    {DESIGNATIONS.map((designation) => (
                                        <option
                                            key={designation}
                                            value={designation}
                                        >
                                            {designation}
                                        </option>
                                    ))}
                                </select>
                                {validationErrors.designation && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {validationErrors.designation}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Roles */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Roles *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {roles.map((role) => (
                                    <label
                                        key={role}
                                        className="flex items-center"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(
                                                role,
                                            )}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleArrayChange("roles", [
                                                        ...formData.roles,
                                                        role,
                                                    ]);
                                                } else {
                                                    handleArrayChange(
                                                        "roles",
                                                        formData.roles.filter(
                                                            (r) => r !== role,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                            {role}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {validationErrors.roles && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.roles}
                                </p>
                            )}
                        </div>

                        {/* Branches */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Branches *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {branches.map((branch) => (
                                    <label
                                        key={branch._id}
                                        className="flex items-center"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.branches.includes(
                                                branch._id,
                                            )}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleArrayChange(
                                                        "branches",
                                                        [
                                                            ...formData.branches,
                                                            branch._id,
                                                        ],
                                                    );
                                                } else {
                                                    handleArrayChange(
                                                        "branches",
                                                        formData.branches.filter(
                                                            (b) =>
                                                                b !==
                                                                branch._id,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {branch.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {validationErrors.branches && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {validationErrors.branches}
                                </p>
                            )}
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Permissions
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {permissions.map((permission) => (
                                    <label
                                        key={permission}
                                        className="flex items-center"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(
                                                permission,
                                            )}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleArrayChange(
                                                        "permissions",
                                                        [
                                                            ...formData.permissions,
                                                            permission,
                                                        ],
                                                    );
                                                } else {
                                                    handleArrayChange(
                                                        "permissions",
                                                        formData.permissions.filter(
                                                            (p) =>
                                                                p !==
                                                                permission,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {permission}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Active User
                                </span>
                            </label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
                            >
                                {loading && (
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                )}
                                {loading
                                    ? "Saving..."
                                    : user
                                      ? "Update User"
                                      : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserForm;
