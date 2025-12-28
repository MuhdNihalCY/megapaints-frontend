import {
    X,
    Package,
    User,
    MapPin,
    CreditCard,
    Calendar,
    FileText,
    Store,
} from "lucide-react";

const OrderDetail = ({ order, onClose, onStatusChange }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-AE", {
            style: "currency",
            currency: "AED",
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
            confirmed:
                "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            processing:
                "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
            shipped:
                "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
            delivered:
                "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            cancelled:
                "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        };

        return (
            <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[status] || statusColors.pending}`}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getOrderTypeLabel = (type) => {
        const types = {
            formula: "Paint Formula Order",
            wholesale: "Wholesale Order",
            retail: "Retail Order",
        };
        return types[type] || "Order";
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Order Details - {order.order_number}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {getOrderTypeLabel(order.order_type)}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-gray-800 px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order Information */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Order Information
                                    </h4>
                                    <dl className="space-y-2">
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Order Number
                                            </dt>
                                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.order_number}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Status
                                            </dt>
                                            <dd className="mt-1">
                                                {getStatusBadge(order.status)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Order Date
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {formatDate(order.created_at)}
                                            </dd>
                                        </div>
                                        {order.updated_at && (
                                            <div>
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Last Updated
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(
                                                        order.updated_at,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Customer Information */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Customer Information
                                    </h4>
                                    <dl className="space-y-2">
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Name
                                            </dt>
                                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.customer?.name || "N/A"}
                                            </dd>
                                        </div>
                                        {order.customer?.email && (
                                            <div>
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Email
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {order.customer.email}
                                                </dd>
                                            </div>
                                        )}
                                        {order.customer?.phone && (
                                            <div>
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Phone
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {order.customer.phone}
                                                </dd>
                                            </div>
                                        )}
                                        {order.customer?.customer_type && (
                                            <div>
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Customer Type
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white capitalize">
                                                    {
                                                        order.customer
                                                            .customer_type
                                                    }
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>

                            {/* Pricing & Payment */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Pricing & Payment
                                    </h4>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Subtotal
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    order.pricing?.subtotal,
                                                )}
                                            </dd>
                                        </div>
                                        {order.pricing?.tax > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Tax
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        order.pricing?.tax,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        {order.pricing?.discount > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Discount
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    -
                                                    {formatCurrency(
                                                        order.pricing?.discount,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        {order.pricing?.shipping > 0 && (
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Shipping
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        order.pricing?.shipping,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <dt className="text-sm font-medium text-gray-900 dark:text-white">
                                                Total
                                            </dt>
                                            <dd className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(
                                                    order.pricing?.total,
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                        Payment Information
                                    </h4>
                                    <dl className="space-y-2">
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Payment Method
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white capitalize">
                                                {order.payment_info?.method ||
                                                    "N/A"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Payment Status
                                            </dt>
                                            <dd className="mt-1">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        order.payment_info
                                                            ?.status === "paid"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                                    }`}
                                                >
                                                    {order.payment_info
                                                        ?.status || "pending"}
                                                </span>
                                            </dd>
                                        </div>
                                        {order.payment_info?.amount_paid >
                                            0 && (
                                            <div>
                                                <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                    Amount Paid
                                                </dt>
                                                <dd className="text-sm text-gray-900 dark:text-white">
                                                    {formatCurrency(
                                                        order.payment_info
                                                            .amount_paid,
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Delivery Address */}
                                {order.delivery_address &&
                                    Object.keys(order.delivery_address).length >
                                        0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                                <MapPin className="w-5 h-5 mr-2" />
                                                Delivery Address
                                            </h4>
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {order.delivery_address
                                                    .street && (
                                                    <div>
                                                        {
                                                            order
                                                                .delivery_address
                                                                .street
                                                        }
                                                    </div>
                                                )}
                                                <div>
                                                    {[
                                                        order.delivery_address
                                                            .city,
                                                        order.delivery_address
                                                            .state,
                                                        order.delivery_address
                                                            .postal_code,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </div>
                                                {order.delivery_address
                                                    .country && (
                                                    <div>
                                                        {
                                                            order
                                                                .delivery_address
                                                                .country
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* Order Items/Formula */}
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                                <Package className="w-5 h-5 mr-2" />
                                {order.order_type === "formula"
                                    ? "Formula Details"
                                    : "Order Items"}
                            </h4>

                            {order.order_type === "formula" ? (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                                    {order.formula_data?.file_number && (
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                File Number
                                            </dt>
                                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                                                {order.formula_data.file_number}
                                            </dd>
                                        </div>
                                    )}
                                    {order.formula_data?.category && (
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Category
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {order.formula_data.category}
                                            </dd>
                                        </div>
                                    )}
                                    {order.formula_data?.subcategory && (
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Subcategory
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {order.formula_data.subcategory}
                                            </dd>
                                        </div>
                                    )}
                                    {order.quantities && (
                                        <div>
                                            <dt className="text-sm text-gray-500 dark:text-gray-400">
                                                Quantity
                                            </dt>
                                            <dd className="text-sm text-gray-900 dark:text-white">
                                                {order.quantities.requested}{" "}
                                                {order.quantities.unit}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                    Product
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                    Quantity
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                    Unit Price
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {order.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        <div className="font-medium">
                                                            {item.product
                                                                ?.name || "N/A"}
                                                        </div>
                                                        {item.product?.code && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                Code:{" "}
                                                                {
                                                                    item.product
                                                                        .code
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        {item.quantity}{" "}
                                                        {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                        {formatCurrency(
                                                            item.unit_price,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                                                        {formatCurrency(
                                                            item.total_price,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Notes
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    {order.notes}
                                </p>
                            </div>
                        )}

                        {/* Status History */}
                        {order.status_history &&
                            order.status_history.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                        Status History
                                    </h4>
                                    <div className="space-y-2">
                                        {order.status_history.map(
                                            (history, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start space-x-3 text-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                                                                {history.status}
                                                            </span>
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                {formatDate(
                                                                    history.changed_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {history.notes && (
                                                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                                {history.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
