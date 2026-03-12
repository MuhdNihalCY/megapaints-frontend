import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
    X,
    Package,
    Hash,
    FileText,
    Folder,
    Tag,
    DollarSign,
    Scale,
    Droplet,
    Palette,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle,
    Loader2,
    Save,
    Layers,
} from "lucide-react";

const PRODUCT_TYPES = [
    { value: "tinters", label: "Tinters" },
    { value: "additive", label: "Additive" },
    { value: "binder", label: "Binder" },
    { value: "auxiliary", label: "Auxiliary" },
    { value: "accessory", label: "Accessory" },
    { value: "third_party", label: "Third Party" },
];

const UNITS = ["kg", "g", "L", "mL", "piece", "set", "box", "unit"];

// Helper function to normalize IDs to strings
const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id.trim();
    if (id && typeof id === "object") {
        // Handle Mongoose ObjectId - try toHexString() first (most reliable for ObjectId)
        if (id.toHexString && typeof id.toHexString === "function") {
            try {
                const hexStr = id.toHexString();
                if (hexStr && typeof hexStr === "string" && hexStr.length > 0) {
                    return hexStr.trim();
                }
            } catch (e) {
                // Continue to other methods
            }
        }
        // Try valueOf() method
        if (id.valueOf && typeof id.valueOf === "function") {
            try {
                const value = id.valueOf();
                if (typeof value === "string") return value.trim();
                if (typeof value === "object" && value.toHexString) {
                    try {
                        return value.toHexString().trim();
                    } catch (e) {
                        // Continue
                    }
                }
            } catch (e) {
                // Continue to other methods
            }
        }
        // Try toString() method
        if (id.toString && typeof id.toString === "function") {
            try {
                const str = id.toString();
                // Check if toString() actually returned a valid string (not [object Object])
                if (
                    str &&
                    str !== "[object Object]" &&
                    str.length > 0 &&
                    str.length < 50 &&
                    str.length >= 12
                ) {
                    return str.trim();
                }
            } catch (e) {
                // Continue to other methods
            }
        }
        // Try accessing _id property
        if (id._id) {
            const nestedId = normalizeId(id._id);
            if (
                nestedId &&
                nestedId !== "[object Object]" &&
                nestedId.length > 0
            )
                return nestedId;
        }
        // Try accessing id property
        if (id.id) {
            const nestedId = normalizeId(id.id);
            if (
                nestedId &&
                nestedId !== "[object Object]" &&
                nestedId.length > 0
            )
                return nestedId;
        }
        // Try accessing str property (older ObjectId versions)
        if (id.str && typeof id.str === "string") {
            return id.str.trim();
        }
        // Last resort - try String() but check if it's valid
        const str = String(id);
        if (
            str &&
            str !== "[object Object]" &&
            str !== "undefined" &&
            str !== "null" &&
            str.length > 0 &&
            str.length < 50
        ) {
            return str.trim();
        }
        return "";
    }
    const str = String(id);
    return str && str !== "[object Object]" && str.length > 0 ? str.trim() : "";
};

const ProductForm = ({
    product = null,
    defaultProductType = null,
    onClose,
    onSuccess,
}) => {
    const { getAdminServices } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        category_id: "",
        subcategory_ids: [],
        product_type: defaultProductType || "tinters",
        base_price: "",
        unit: "kg",
        color_code: "",
        density: "",
        abbreviation: "",
        group_id: "",
        coefficient: "",
        standard_quantity: "",
        standard_quantity_unit: "kg",
        voc: "",
        solid_content: "",
        specifications: {},
        images: [],
        is_active: true,
    });

    // Fetch categories and groups on mount
    useEffect(() => {
        fetchCategories();
        fetchGroups();
    }, []);

    // Set form data when product changes
    useEffect(() => {
        if (product) {
            // Handle multiple sub-categories (new) or single subcategory (backward compatibility)
            let subcategoryIds = [];
            if (
                product.subcategories &&
                Array.isArray(product.subcategories) &&
                product.subcategories.length > 0
            ) {
                subcategoryIds = product.subcategories.map((sub) =>
                    normalizeId(sub._id || sub),
                );
            } else if (product.subcategory?._id || product.subcategory_id) {
                subcategoryIds = [
                    normalizeId(
                        product.subcategory._id || product.subcategory_id,
                    ),
                ];
            }

            // Convert category_id to string if it's an ObjectId - only for tinters
            const categoryId =
                product.product_type === "tinters"
                    ? normalizeId(
                          product.category?._id || product.category_id || "",
                      )
                    : "";

            // Convert group_id to string if it's an ObjectId
            const groupId =
                product.product_type === "tinters" &&
                (product.group?._id || product.group_id)
                    ? normalizeId(product.group._id || product.group_id)
                    : "";

            setFormData({
                name: product.name || "",
                code: product.code || "",
                description: product.description || "",
                category_id: categoryId,
                subcategory_ids:
                    product.product_type === "tinters" ? subcategoryIds : [],
                product_type: product.product_type || "tinters",
                base_price: product.base_price || "",
                unit: product.unit || "kg",
                color_code: product.color_code || "",
                density: product.density || "",
                abbreviation: product.abbreviation || "",
                group_id: groupId,
                coefficient: product.coefficient || "",
                standard_quantity: product.standard_quantity || "",
                standard_quantity_unit:
                    product.standard_quantity_unit || product.unit || "kg",
                voc: product.voc || "",
                solid_content: product.solid_content || "",
                specifications: product.specifications || {},
                images: product.images || [],
                is_active:
                    product.is_active !== undefined ? product.is_active : true,
            });
        } else {
            // Check for preselected values from sessionStorage (when navigating from SubCategories)
            const preselectedCategoryId = sessionStorage.getItem(
                "preselectedCategoryId",
            );
            const preselectedSubCategoryId = sessionStorage.getItem(
                "preselectedSubCategoryId",
            );

            const initialProductType = defaultProductType || "tinters";

            setFormData((prev) => ({
                ...prev,
                product_type: initialProductType,
                // Clear category and subcategories if not tinters
                ...(initialProductType !== "tinters"
                    ? { category_id: "", subcategory_ids: [] }
                    : {}),
            }));

            // Only set preselected category/subcategory for tinters
            if (initialProductType === "tinters" && preselectedCategoryId) {
                setFormData((prev) => ({
                    ...prev,
                    category_id: preselectedCategoryId,
                }));

                if (preselectedSubCategoryId) {
                    setFormData((prev) => ({
                        ...prev,
                        subcategory_ids: [preselectedSubCategoryId],
                    }));
                }

                // Clear sessionStorage after using it
                sessionStorage.removeItem("preselectedCategoryId");
                sessionStorage.removeItem("preselectedSubCategoryId");
            }
        }
    }, [product, defaultProductType]);

    useEffect(() => {
        // Only fetch subcategories for tinters if we have a valid category_id and categories are loaded
        if (
            formData.product_type !== "tinters" ||
            !formData.category_id ||
            categories.length === 0
        ) {
            setSubcategories([]);
            return;
        }

        // Normalize category_id to string using normalizeId
        const categoryIdStr = normalizeId(formData.category_id);

        // Don't fetch if it's invalid
        if (
            !categoryIdStr ||
            categoryIdStr === "[object Object]" ||
            categoryIdStr === "undefined" ||
            categoryIdStr === "null" ||
            categoryIdStr.trim() === ""
        ) {
            setSubcategories([]);
            // Also fix formData if it's invalid - force it to be a string
            if (typeof formData.category_id !== "string") {
                const normalized = normalizeId(formData.category_id);
                if (normalized && normalized !== "[object Object]") {
                    setFormData((prev) => ({
                        ...prev,
                        category_id: normalized,
                    }));
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        category_id: "",
                    }));
                }
            }
            return;
        }

        // Verify the category exists in the categories list
        const categoryExists = categories.some((cat) => {
            const catId = normalizeId(cat._id);
            return catId === categoryIdStr;
        });

        if (!categoryExists) {
            // Category not found in list, wait for categories to load
            return;
        }

        // Only fetch if category_id is valid - pass the converted string
        fetchSubcategories(categoryIdStr);
    }, [formData.category_id, categories]);

    // Fix category_id if it's an object (shouldn't happen, but safety check)
    useEffect(() => {
        if (formData.category_id && typeof formData.category_id === "object") {
            const normalized = normalizeId(formData.category_id);
            if (normalized && normalized !== "[object Object]") {
                setFormData((prev) => ({
                    ...prev,
                    category_id: normalized,
                }));
            } else {
                // If normalization failed, clear it
                setFormData((prev) => ({
                    ...prev,
                    category_id: "",
                }));
            }
        }
    }, [formData.category_id]);

    // Clear group_id and refetch groups when product type changes
    useEffect(() => {
        if (formData.group_id) {
            // Check if current group is still valid for the new product type
            const currentGroup = groups.find(
                (g) => g._id === formData.group_id,
            );
            if (currentGroup) {
                const isGroupAvailable =
                    currentGroup.product_types &&
                    Array.isArray(currentGroup.product_types) &&
                    currentGroup.product_types.length > 0 &&
                    currentGroup.product_types.includes(formData.product_type);
                if (!isGroupAvailable) {
                    setFormData((prev) => ({
                        ...prev,
                        group_id: "",
                    }));
                }
            }
        }
        // Refetch groups when product type changes
        fetchGroups();
    }, [formData.product_type]);

    const fetchCategories = async () => {
        try {
            const adminServices = getAdminServices();
            const response = await adminServices.productCatalog.getCategories({
                limit: 100,
            });
            if (response.status === "success") {
                // Get root categories (no parent)
                const rootCategories = response.data.categories.filter(
                    (cat) => !cat.parent_id || !cat.parent_id._id,
                );
                setCategories(rootCategories);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    const fetchSubcategories = async (categoryIdParam = null) => {
        try {
            // Use parameter if provided, otherwise use formData.category_id
            let categoryId =
                categoryIdParam !== null
                    ? categoryIdParam
                    : formData.category_id;
            if (!categoryId) {
                setSubcategories([]);
                return;
            }

            // Convert to string if it's not already - handle all possible types
            let parentId;
            if (typeof categoryId === "string") {
                parentId = categoryId.trim();
            } else if (categoryId && typeof categoryId === "object") {
                // Handle ObjectId or similar objects
                if (
                    categoryId.toString &&
                    typeof categoryId.toString === "function"
                ) {
                    try {
                        parentId = categoryId.toString();
                    } catch (e) {
                        // If toString fails, try other methods
                        if (categoryId._id) {
                            parentId =
                                typeof categoryId._id === "string"
                                    ? categoryId._id
                                    : String(categoryId._id);
                        } else {
                            parentId = String(categoryId);
                        }
                    }
                } else if (categoryId._id) {
                    // Handle nested _id
                    parentId =
                        typeof categoryId._id === "string"
                            ? categoryId._id
                            : String(categoryId._id);
                } else {
                    parentId = String(categoryId);
                }
            } else {
                parentId = String(categoryId);
            }

            // Don't fetch if parentId is empty or invalid
            if (
                !parentId ||
                parentId === "undefined" ||
                parentId === "null" ||
                parentId === "[object Object]" ||
                parentId.trim() === ""
            ) {
                setSubcategories([]);
                return;
            }

            const adminServices = getAdminServices();
            // Fetch subcategories by using parent_id filter
            const response = await adminServices.productCatalog.getCategories({
                parent_id: parentId.trim(),
                limit: 100,
                is_active: true,
            });
            if (response.status === "success") {
                setSubcategories(response.data.categories || []);
            }
        } catch (err) {
            console.error("Failed to fetch subcategories:", err);
            setSubcategories([]);
        }
    };

    const fetchGroups = async () => {
        try {
            const adminServices = getAdminServices();
            const response = await adminServices.productCatalog.getGroups({
                limit: 100,
            });
            if (response.status === "success") {
                // Filter to only show active groups that are available for the current product type
                const activeGroups = (response.data.groups || []).filter(
                    (group) => {
                        if (!group.is_active) return false;
                        // Check if group is available for current product type
                        if (
                            !group.product_types ||
                            !Array.isArray(group.product_types) ||
                            group.product_types.length === 0
                        ) {
                            // Default to tinters if no product_types specified
                            return formData.product_type === "tinters";
                        }
                        return group.product_types.includes(
                            formData.product_type,
                        );
                    },
                );
                setGroups(activeGroups);
            }
        } catch (err) {
            console.error("Failed to fetch groups:", err);
            setGroups([]);
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

        // Only require category for tinters
        if (formData.product_type === "tinters" && !formData.category_id) {
            errors.category_id = "Category is required";
        }

        if (!formData.product_type) {
            errors.product_type = "Product type is required";
        }

        if (!formData.base_price || parseFloat(formData.base_price) < 0) {
            errors.base_price = "Base price must be a non-negative number";
        }

        if (!formData.unit) {
            errors.unit = "Unit is required";
        }

        if (
            formData.color_code &&
            !/^#[0-9A-Fa-f]{6}$/.test(formData.color_code)
        ) {
            errors.color_code = "Invalid hex color code (e.g., #FF5733)";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox" && name === "subcategory_checkbox") {
            // Handle subcategory checkbox selection
            const subcategoryId = value;
            setFormData((prev) => {
                const currentIds = prev.subcategory_ids || [];
                let newIds;
                if (checked) {
                    // Add subcategory if not already in array
                    newIds = currentIds.includes(subcategoryId)
                        ? currentIds
                        : [...currentIds, subcategoryId];
                } else {
                    // Remove subcategory from array
                    newIds = currentIds.filter((id) => id !== subcategoryId);
                }
                return {
                    ...prev,
                    subcategory_ids: newIds,
                };
            });
        } else if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else if (type === "number") {
            setFormData((prev) => ({
                ...prev,
                [name]: value === "" ? "" : parseFloat(value),
            }));
        } else if (name === "category_id") {
            // Ensure category_id is always a string using normalizeId
            const categoryIdStr = normalizeId(value);
            setFormData((prev) => ({
                ...prev,
                [name]: categoryIdStr,
                subcategory_ids: [], // Clear subcategories when category changes
            }));
        } else if (name === "product_type") {
            // Clear category and subcategories when product type changes (unless it's tinters)
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                ...(value !== "tinters"
                    ? { category_id: "", subcategory_ids: [] }
                    : {}),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear validation error for this field
        if (validationErrors[name] || validationErrors.subcategory_ids) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                delete newErrors.subcategory_ids;
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

            // Prepare data for API - only include fields with values
            const submitData = {
                name: formData.name.trim(),
                code: formData.code.trim().toUpperCase(),
                base_price: parseFloat(formData.base_price),
                unit: formData.unit.trim(),
                is_active: Boolean(formData.is_active),
            };

            // Only include product_type if it has a value
            if (formData.product_type) {
                const productType =
                    typeof formData.product_type === "string"
                        ? formData.product_type.trim()
                        : String(formData.product_type);
                if (productType) {
                    submitData.product_type = productType;
                }
            }

            // Only include category_id and subcategory_ids for tinters
            if (formData.product_type === "tinters") {
                // Category is required for tinters
                if (formData.category_id) {
                    // Handle both string and ObjectId types
                    let categoryId;
                    if (typeof formData.category_id === "string") {
                        categoryId = formData.category_id.trim();
                    } else if (
                        formData.category_id &&
                        typeof formData.category_id === "object" &&
                        formData.category_id.toString
                    ) {
                        // Handle ObjectId or similar objects
                        categoryId = formData.category_id.toString();
                    } else {
                        categoryId = String(formData.category_id);
                    }
                    // Only include if it's a valid non-empty string
                    if (categoryId && categoryId.length > 0) {
                        submitData.category_id = categoryId;
                    }
                }

                // Handle multiple sub-categories - only for tinters
                if (
                    formData.subcategory_ids &&
                    Array.isArray(formData.subcategory_ids) &&
                    formData.subcategory_ids.length > 0
                ) {
                    submitData.subcategory_ids = formData.subcategory_ids
                        .map((id) => {
                            // Handle both string and ObjectId types
                            if (typeof id === "string") {
                                return id.trim();
                            } else if (
                                id &&
                                typeof id === "object" &&
                                id.toString
                            ) {
                                // Handle ObjectId or similar objects
                                return id.toString();
                            } else {
                                return String(id);
                            }
                        })
                        .filter((id) => id && id.length > 0);
                }
            } else {
                // For non-tinters, explicitly ensure category_id and subcategory_ids are NOT included
                // This prevents any accidental inclusion
                if (formData.category_id) {
                    // Clear category_id for non-tinters
                    delete submitData.category_id;
                }
                if (
                    formData.subcategory_ids &&
                    formData.subcategory_ids.length > 0
                ) {
                    // Clear subcategory_ids for non-tinters
                    delete submitData.subcategory_ids;
                }
            }

            // Only include optional fields if they have values
            if (formData.description && formData.description.trim()) {
                submitData.description = formData.description.trim();
            }

            if (formData.color_code && formData.color_code.trim()) {
                submitData.color_code = formData.color_code.trim();
            }

            if (
                formData.density &&
                formData.density !== "" &&
                !isNaN(parseFloat(formData.density))
            ) {
                submitData.density = parseFloat(formData.density);
            }

            if (formData.abbreviation && formData.abbreviation.trim()) {
                submitData.abbreviation = formData.abbreviation.trim();
            }

            // Only include group_id if a group is selected and it's available for this product type
            if (formData.group_id && formData.group_id.trim()) {
                // Verify the group is available for this product type
                const selectedGroup = groups.find(
                    (g) => g._id === formData.group_id,
                );
                if (
                    selectedGroup &&
                    selectedGroup.product_types &&
                    selectedGroup.product_types.includes(formData.product_type)
                ) {
                    submitData.group_id = formData.group_id.trim();
                } else {
                    // Clear group_id if group is not available for this product type
                    submitData.group_id = null;
                }
            }

            if (
                formData.coefficient &&
                formData.coefficient !== "" &&
                !isNaN(parseFloat(formData.coefficient))
            ) {
                submitData.coefficient = parseFloat(formData.coefficient);
            }

            if (
                formData.standard_quantity &&
                formData.standard_quantity !== "" &&
                !isNaN(parseFloat(formData.standard_quantity))
            ) {
                submitData.standard_quantity = parseFloat(
                    formData.standard_quantity,
                );
                submitData.standard_quantity_unit =
                    formData.standard_quantity_unit || "kg";
            }

            if (
                formData.voc &&
                formData.voc !== "" &&
                !isNaN(parseFloat(formData.voc))
            ) {
                submitData.voc = parseFloat(formData.voc);
            }

            if (
                formData.solid_content &&
                formData.solid_content !== "" &&
                !isNaN(parseFloat(formData.solid_content))
            ) {
                submitData.solid_content = parseFloat(formData.solid_content);
            }

            if (
                formData.specifications &&
                Object.keys(formData.specifications).length > 0
            ) {
                submitData.specifications = formData.specifications;
            }

            if (formData.images && formData.images.length > 0) {
                submitData.images = formData.images;
            }

            let response;
            if (product) {
                // Update existing product
                response = await adminServices.productCatalog.updateProduct(
                    product._id,
                    submitData,
                );
            } else {
                // Create new product
                response =
                    await adminServices.productCatalog.createProduct(
                        submitData,
                    );
            }

            if (response.status === "success") {
                setSuccess(
                    product
                        ? "Product updated successfully!"
                        : "Product created successfully!",
                );
                setTimeout(() => {
                    onSuccess && onSuccess(response.data);
                    onClose && onClose();
                }, 1500);
            } else {
                const errorMsg = response.message || "Operation failed";
                const errorDetails = response.details || [];
                setError(
                    errorDetails.length > 0
                        ? `${errorMsg}: ${errorDetails.join(", ")}`
                        : errorMsg,
                );
            }
        } catch (err) {
            console.error("Product operation failed:", err);
            const errorMsg = err.message || "Operation failed";
            const errorDetails = err.details || [];
            setError(
                errorDetails.length > 0
                    ? `${errorMsg}: ${errorDetails.join(", ")}`
                    : errorMsg,
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 dark:bg-gray-600 flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {product ? "Edit Product" : "Add New Product"}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {product
                                    ? "Update product information"
                                    : "Create a new product in the catalog"}
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
                                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Basic Information
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                                        Product Name *
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
                                        placeholder="Enter product name"
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
                                        Product Code *
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
                                        placeholder="PROD001"
                                        style={{ textTransform: "uppercase" }}
                                    />
                                    {validationErrors.code && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.code}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Tag className="w-4 h-4 mr-2 text-gray-500" />
                                        Product Type *
                                    </label>
                                    <select
                                        name="product_type"
                                        value={formData.product_type}
                                        onChange={handleInputChange}
                                        disabled={!!defaultProductType}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.product_type
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        } ${defaultProductType ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                        {PRODUCT_TYPES.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.product_type && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.product_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Palette className="w-4 h-4 mr-2 text-gray-500" />
                                        Color Code
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={
                                                formData.color_code || "#000000"
                                            }
                                            onChange={(e) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    color_code: e.target.value,
                                                }));
                                                if (
                                                    validationErrors.color_code
                                                ) {
                                                    setValidationErrors(
                                                        (prev) => {
                                                            const newErrors = {
                                                                ...prev,
                                                            };
                                                            delete newErrors.color_code;
                                                            return newErrors;
                                                        },
                                                    );
                                                }
                                            }}
                                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            name="color_code"
                                            value={formData.color_code}
                                            onChange={handleInputChange}
                                            placeholder="#FF5733"
                                            pattern="^#[0-9A-Fa-f]{6}$"
                                            className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                                validationErrors.color_code
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                    : "border-gray-300"
                                            }`}
                                        />
                                    </div>
                                    {validationErrors.color_code && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.color_code}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                                        placeholder="Enter product description"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category & Classification - Only for Tinters */}
                        {formData.product_type === "tinters" && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Category & Classification
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <Folder className="w-4 h-4 mr-2 text-gray-500" />
                                            Category *
                                        </label>
                                        <select
                                            name="category_id"
                                            value={normalizeId(
                                                formData.category_id,
                                            )}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                            }}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                                validationErrors.category_id
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            <option value="">
                                                Select Category
                                            </option>
                                            {categories.map((category) => {
                                                const categoryId = normalizeId(
                                                    category._id,
                                                );
                                                return (
                                                    <option
                                                        key={categoryId}
                                                        value={categoryId}
                                                    >
                                                        {category.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {validationErrors.category_id && (
                                            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {validationErrors.category_id}
                                            </p>
                                        )}
                                    </div>

                                    {formData.product_type === "tinters" &&
                                        groups.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                                                    Group
                                                </label>
                                                <select
                                                    name="group_id"
                                                    value={formData.group_id}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                                        validationErrors.group_id
                                                            ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                            : "border-gray-300"
                                                    }`}
                                                >
                                                    <option value="">
                                                        Select a group
                                                        (optional)
                                                    </option>
                                                    {groups.map((group) => (
                                                        <option
                                                            key={group._id}
                                                            value={group._id}
                                                        >
                                                            {group.name}{" "}
                                                            {group.code
                                                                ? `(${group.code})`
                                                                : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {validationErrors.group_id && (
                                                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-1" />
                                                        {
                                                            validationErrors.group_id
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                            <Layers className="w-4 h-4 mr-2 text-gray-500" />
                                            Sub-Categories (Select multiple)
                                        </label>
                                        {formData.category_id &&
                                            subcategories.length > 0 && (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const allIds =
                                                                subcategories.map(
                                                                    (sub) => {
                                                                        const id =
                                                                            sub._id;
                                                                        // Convert ObjectId to string if needed
                                                                        return typeof id ===
                                                                            "string"
                                                                            ? id
                                                                            : id?.toString
                                                                              ? id.toString()
                                                                              : String(
                                                                                    id,
                                                                                );
                                                                    },
                                                                );
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    subcategory_ids:
                                                                        allIds,
                                                                }),
                                                            );
                                                            if (
                                                                validationErrors.subcategory_ids
                                                            ) {
                                                                setValidationErrors(
                                                                    (prev) => {
                                                                        const newErrors =
                                                                            {
                                                                                ...prev,
                                                                            };
                                                                        delete newErrors.subcategory_ids;
                                                                        return newErrors;
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    subcategory_ids:
                                                                        [],
                                                                }),
                                                            );
                                                            if (
                                                                validationErrors.subcategory_ids
                                                            ) {
                                                                setValidationErrors(
                                                                    (prev) => {
                                                                        const newErrors =
                                                                            {
                                                                                ...prev,
                                                                            };
                                                                        delete newErrors.subcategory_ids;
                                                                        return newErrors;
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                    >
                                                        Deselect All
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                    {!formData.category_id ? (
                                        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                Please select a category first
                                                to view sub-categories
                                            </p>
                                        </div>
                                    ) : subcategories.length === 0 ? (
                                        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                                No sub-categories available for
                                                this category
                                            </p>
                                        </div>
                                    ) : (
                                        <div
                                            className={`p-4 border rounded-lg transition-colors ${
                                                validationErrors.subcategory_ids
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                            }`}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto">
                                                {subcategories.map(
                                                    (subcategory) => {
                                                        // Convert both IDs to strings for comparison
                                                        const subcategoryIdStr =
                                                            typeof subcategory._id ===
                                                            "string"
                                                                ? subcategory._id
                                                                : subcategory
                                                                        ._id
                                                                        ?.toString
                                                                  ? subcategory._id.toString()
                                                                  : String(
                                                                        subcategory._id,
                                                                    );
                                                        const currentIdsStr = (
                                                            formData.subcategory_ids ||
                                                            []
                                                        ).map((id) =>
                                                            typeof id ===
                                                            "string"
                                                                ? id
                                                                : id?.toString
                                                                  ? id.toString()
                                                                  : String(id),
                                                        );
                                                        const isChecked =
                                                            currentIdsStr.includes(
                                                                subcategoryIdStr,
                                                            );
                                                        return (
                                                            <label
                                                                key={
                                                                    subcategoryIdStr
                                                                }
                                                                className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                                                    isChecked
                                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                                                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    name="subcategory_checkbox"
                                                                    value={
                                                                        subcategoryIdStr
                                                                    }
                                                                    checked={
                                                                        isChecked
                                                                    }
                                                                    onChange={
                                                                        handleInputChange
                                                                    }
                                                                    className="mr-2 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                                                />
                                                                <span className="text-sm font-medium truncate">
                                                                    {
                                                                        subcategory.name
                                                                    }
                                                                </span>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            {formData.subcategory_ids &&
                                                formData.subcategory_ids
                                                    .length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            <span className="font-semibold">
                                                                {
                                                                    formData
                                                                        .subcategory_ids
                                                                        .length
                                                                }
                                                            </span>{" "}
                                                            of{" "}
                                                            <span className="font-semibold">
                                                                {
                                                                    subcategories.length
                                                                }
                                                            </span>{" "}
                                                            sub-categor
                                                            {formData
                                                                .subcategory_ids
                                                                .length === 1
                                                                ? "y"
                                                                : "ies"}{" "}
                                                            selected
                                                        </p>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        Select one or more sub-categories for
                                        this product. You can select multiple
                                        sub-categories.
                                    </p>
                                    {validationErrors.subcategory_ids && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.subcategory_ids}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pricing & Units */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Pricing & Units
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Base Price (AED) *
                                    </label>
                                    <input
                                        type="number"
                                        name="base_price"
                                        value={formData.base_price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.base_price
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="0.00 AED"
                                    />
                                    {validationErrors.base_price && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.base_price}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                                        Unit *
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.unit
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        {UNITS.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.unit && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.unit}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Specifications */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Product Specifications
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Tag className="w-4 h-4 mr-2 text-gray-500" />
                                        Abbreviation
                                    </label>
                                    <input
                                        type="text"
                                        name="abbreviation"
                                        value={formData.abbreviation}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.abbreviation
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="e.g., PMI 050"
                                    />
                                    {validationErrors.abbreviation && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.abbreviation}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Droplet className="w-4 h-4 mr-2 text-gray-500" />
                                        Density (ml/1000g)
                                    </label>
                                    <input
                                        type="number"
                                        name="density"
                                        value={formData.density}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.001"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.density
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="0.000"
                                    />
                                    {validationErrors.density && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.density}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                        Coefficient
                                    </label>
                                    <input
                                        type="number"
                                        name="coefficient"
                                        value={formData.coefficient}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.001"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.coefficient
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="0.000"
                                    />
                                    {validationErrors.coefficient && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.coefficient}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                                        Standard Quantity
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="standard_quantity"
                                            value={formData.standard_quantity}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.001"
                                            className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                                validationErrors.standard_quantity
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder="0.000"
                                        />
                                        <select
                                            name="standard_quantity_unit"
                                            value={
                                                formData.standard_quantity_unit
                                            }
                                            onChange={handleInputChange}
                                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        >
                                            {UNITS.map((unit) => (
                                                <option key={unit} value={unit}>
                                                    {unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {validationErrors.standard_quantity && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.standard_quantity}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chemical Properties */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Chemical Properties
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Droplet className="w-4 h-4 mr-2 text-gray-500" />
                                        VOC (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="voc"
                                        value={formData.voc}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.voc
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {validationErrors.voc && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.voc}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                        <Droplet className="w-4 h-4 mr-2 text-gray-500" />
                                        Solid Content (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="solid_content"
                                        value={formData.solid_content}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                                            validationErrors.solid_content
                                                ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {validationErrors.solid_content && (
                                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {validationErrors.solid_content}
                                        </p>
                                    )}
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
                                    Active Product
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
                                        {product
                                            ? "Update Product"
                                            : "Create Product"}
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

export default ProductForm;
