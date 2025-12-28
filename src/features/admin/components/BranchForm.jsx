import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import apiServiceFactory from "../../../services/ApiServiceFactory.js";
import {
    X,
    Building2,
    MapPin,
    Phone,
    Mail,
    User,
    AlertCircle,
    CheckCircle,
    Loader2,
    Save,
    Hash,
    Globe,
} from "lucide-react";

const GCC_COUNTRIES = [
    "Saudi Arabia",
    "United Arab Emirates",
    "Kuwait",
    "Qatar",
    "Bahrain",
    "Oman",
];

const BranchForm = ({ branch = null, onClose, onSuccess }) => {
    const { getAdminServices } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [users, setUsers] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        address: {
            street: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
        },
        phone: "",
        email: "",
        manager_id: "",
        is_active: true,
    });

    useEffect(() => {
        fetchUsers();
        if (branch) {
            setFormData({
                name: branch.name || "",
                code: branch.code || "",
                address: {
                    street: branch.address?.street || "",
                    city: branch.address?.city || "",
                    state: branch.address?.state || "",
                    postal_code: branch.address?.postal_code || "",
                    country: branch.address?.country || "",
                },
                phone: branch.phone || "",
                email: branch.email || "",
                manager_id:
                    branch.manager?._id?._id || branch.manager?._id || "",
                is_active:
                    branch.is_active !== undefined ? branch.is_active : true,
            });
        }
    }, [branch]);

    const fetchUsers = async () => {
        try {
            const adminServices = getAdminServices();
            const response = await adminServices.businessManagement.getUsers({
                limit: 100,
            });
            if (response.status === "success") {
                setUsers(response.data.users || []);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }

        if (!formData.code.trim()) {
            errors.code = "Code is required";
        }

        if (!formData.address.country) {
            errors["address.country"] = "Country is required";
        } else if (!GCC_COUNTRIES.includes(formData.address.country)) {
            errors["address.country"] =
                `Country must be one of: ${GCC_COUNTRIES.join(", ")}`;
        }

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            errors.email = "Please enter a valid email address";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith("address.")) {
            const addressField = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value,
                },
            }));
        } else if (type === "checkbox") {
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
        const errorKey = name.startsWith("address.") ? name : name;
        if (validationErrors[errorKey]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
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
            const adminServices = getAdminServices();

            // Prepare data for API
            const submitData = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                address: {
                    street: formData.address.street.trim(),
                    city: formData.address.city.trim(),
                    state: formData.address.state.trim(),
                    postal_code: formData.address.postal_code.trim(),
                    country: formData.address.country,
                },
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                is_active: formData.is_active,
            };

            // Only include manager_id if provided
            if (formData.manager_id) {
                submitData.manager_id = formData.manager_id;
            }

            let response;
            if (branch) {
                // Update existing branch
                response = await adminServices.businessManagement.updateBranch(
                    branch._id,
                    submitData,
                );
            } else {
                // Create new branch
                response =
                    await adminServices.businessManagement.createBranch(
                        submitData,
                    );
            }

            if (response.status === "success") {
                setSuccess(
                    branch
                        ? "Branch updated successfully!"
                        : "Branch created successfully!",
                );
                setTimeout(() => {
                    onSuccess && onSuccess(response.data);
                    onClose && onClose();
                }, 1500);
            } else {
                setError(response.message || "Operation failed");
            }
        } catch (err) {
            console.error("Branch operation failed:", err);
            setError(err.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {branch ? "Edit Branch" : "Add New Branch"}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {branch
                                    ? "Update branch information"
                                    : "Create a new branch location"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Error</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg text-green-700 dark:text-green-400 flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Success</p>
                                <p className="text-sm mt-1">{success}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Basic Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                                        Branch Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.name
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter branch name"
                                    />
                                    {validationErrors.name && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                        Branch Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors uppercase ${
                                            validationErrors.code
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="BR001"
                                        style={{ textTransform: "uppercase" }}
                                    />
                                    {validationErrors.code && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.code}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Address Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address.street}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter street address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="address.city"
                                        value={formData.address.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter city"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        State/Province/Emirate
                                    </label>
                                    <input
                                        type="text"
                                        name="address.state"
                                        value={formData.address.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter state/province/emirate"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="address.postal_code"
                                        value={formData.address.postal_code}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter postal code"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Globe className="w-4 h-4 mr-2 text-gray-500" />
                                        Country *
                                    </label>
                                    <select
                                        name="address.country"
                                        value={formData.address.country}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors["address.country"]
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        <option value="">Select Country</option>
                                        {GCC_COUNTRIES.map((country) => (
                                            <option
                                                key={country}
                                                value={country}
                                            >
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors["address.country"] && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {
                                                validationErrors[
                                                    "address.country"
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Contact Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.email
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter email address"
                                    />
                                    {validationErrors.email && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-500" />
                                        Manager
                                    </label>
                                    <select
                                        name="manager_id"
                                        value={formData.manager_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                    >
                                        <option value="">
                                            No manager assigned
                                        </option>
                                        {users.map((user) => (
                                            <option
                                                key={user._id}
                                                value={user._id}
                                            >
                                                {user.first_name &&
                                                user.last_name
                                                    ? `${user.first_name} ${user.last_name} (${user.username})`
                                                    : `${user.username}${user.email ? ` - ${user.email}` : ""}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                    Active Branch
                                </span>
                            </label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center font-medium"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {branch
                                            ? "Update Branch"
                                            : "Create Branch"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BranchForm;
