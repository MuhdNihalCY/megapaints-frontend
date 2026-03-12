import CustomerDropdown from "../../../components/customer/CustomerDropdown";
import { getBackendOrigin } from "../../../config/api";

const OrderDetailsView = ({
    mode = "create",
    headerTitle,
    onEditFormula,
    onCreateOrder,
    isCreating = false,
    canCreateOrder = false,
    message,
    noBranches,
    meta,
    formula,
    selectedCustomer,
    onCustomerSelect,
    branches = [],
    selectedBranchId,
    onBranchChange,
    unit,
    qtyInput,
    onQtyInputChange,
    snapshot,
    orderPreview,
    scaledTinters = [],
    scaledBinders = [],
    scaledAdditives = [],
    totals,
    remarks,
}) => {
    const {
        totalWithoutAdditivesGrams = 0,
        totalWithoutAdditivesVolume = 0,
        additivesTotalGrams = 0,
        additivesTotalVolume = 0,
        totalGrams = 0,
        grandTotalVolume = 0,
    } = totals || {};

    const headerActionsEnabled = mode === "create";
    const showCustomerDropdown = mode === "create" && onCustomerSelect;
    const showQuantityInput = mode === "create" && onQtyInputChange;
    const hasMultipleBranches = Array.isArray(branches) && branches.length > 1;

    const referenceImageUrl = (() => {
        const rawUrl = formula?.attachment?.url;
        if (!rawUrl) return null;
        const backendOrigin = getBackendOrigin();
        return rawUrl.startsWith("http")
            ? rawUrl
            : `${backendOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    })();

    const sampledQtyLabel =
        qtyInput && unit
            ? `${qtyInput} ${
                  unit === "L" ? "Liter" : unit === "kg" ? "kg" : unit
              }`
            : "—";

    const metricsSolids =
        orderPreview?.metrics?.solids_percent ??
        snapshot?.metrics?.solids_percent ??
        formula?.solid_content ??
        "—";

    const metricsVocRaw =
        orderPreview?.metrics?.voc ??
        snapshot?.metrics?.voc ??
        formula?.voc;
    const metricsVoc =
        metricsVocRaw != null ? (Number(metricsVocRaw) / 1000).toFixed(4) : "—";

    const metricsDensityRaw =
        orderPreview?.metrics?.density ??
        snapshot?.metrics?.density ??
        formula?.density;
    const metricsDensity =
        metricsDensityRaw != null
            ? (Number(metricsDensityRaw) / 1000).toFixed(4)
            : "—";

    const costingLabel =
        orderPreview?.costing != null
            ? `${Number(orderPreview.costing.cost).toLocaleString(
                  undefined,
                  {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  },
              )} ${orderPreview.costing.currency || "AED"}`
            : "—";

    return (
        <div className="mx-auto">
            {message?.text && (
                <div
                    className={`mb-4 p-4 rounded-lg whitespace-pre-wrap ${
                        message.type === "error"
                            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {noBranches && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
                    No branch assigned. Please contact admin to assign a branch.
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {headerTitle}
                    </h1>
                    {headerActionsEnabled && (
                        <div className="flex flex-wrap items-center gap-2">
                            {onEditFormula && (
                                <button
                                    type="button"
                                    onClick={onEditFormula}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    {/* Icon rendered by parent via children if needed */}
                                    Edit this formula
                                </button>
                            )}
                            {onCreateOrder && (
                                <button
                                    type="button"
                                    onClick={onCreateOrder}
                                    disabled={!canCreateOrder || isCreating}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? "Creating..." : "Create Order"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-b-lg shadow">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left sidebar */}
                    <div className="col-span-2 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {meta?.date || "—"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    File No.
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100 font-mono">
                                    {meta?.fileNo || "—"}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Customer Name
                                </label>
                                {showCustomerDropdown ? (
                                    <CustomerDropdown
                                        selectedCustomer={selectedCustomer}
                                        onCustomerSelect={onCustomerSelect}
                                        customerId={
                                            formula?.customer_id ??
                                            formula?.formulation_data?.meta
                                                ?.customerId ??
                                            null
                                        }
                                        placeholder="Select customer..."
                                        disabled={noBranches}
                                        className="w-full"
                                    />
                                ) : (
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                        {meta?.customerName ||
                                            selectedCustomer?.name ||
                                            "—"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Color Code
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {meta?.colorCode || "—"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Color Name
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {meta?.colorName || "—"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Customer Ref
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {meta?.customerRef || "—"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Project No
                                </label>
                                <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    {meta?.projectNo || "—"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reference Image
                                </label>
                                {referenceImageUrl ? (
                                    <a
                                        href={referenceImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={referenceImageUrl}
                                            alt="Reference"
                                            className="max-h-20 rounded border border-gray-200 dark:border-gray-600 object-contain w-full"
                                        />
                                    </a>
                                ) : (
                                    <div className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 rounded">
                                        No image
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Metrics
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Solid Content (%):
                                    </span>
                                    <span className="ml-1 text-gray-900 dark:text-white">
                                        {metricsSolids}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        VOC (Kg/Ltr):
                                    </span>
                                    <span className="ml-1 text-gray-900 dark:text-white">
                                        {metricsVoc}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Density (Kg/Ltr):
                                    </span>
                                    <span className="ml-1 text-gray-900 dark:text-white">
                                        {metricsDensity}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Costing
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded font-medium text-gray-900 dark:text-gray-100">
                                {costingLabel}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Order cost (server-calculated)
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Sampled Qty
                            </label>
                            <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded font-medium text-gray-900 dark:text-gray-100">
                                {sampledQtyLabel}
                            </div>
                        </div>

                        {hasMultipleBranches && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Branch
                                </label>
                                <select
                                    value={selectedBranchId || ""}
                                    onChange={(e) =>
                                        onBranchChange?.(e.target.value || null)
                                    }
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">Select branch</option>
                                    {branches.map((br) => (
                                        <option key={br._id} value={br._id}>
                                            {br.name || br.code || br._id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Main content */}
                    <div className="col-span-10">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 space-y-6">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Category
                                        </label>
                                        <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                                            {formula?.category ?? "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Subcategory
                                        </label>
                                        <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                                            {formula?.subcategory ?? "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Gloss
                                        </label>
                                        <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                                            {formula?.gloss ?? "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {mode === "create"
                                                ? `Enter Quantity (${
                                                      unit === "L"
                                                          ? "L"
                                                          : "kg"
                                                  })`
                                                : "Quantity"}
                                        </label>
                                        {showQuantityInput ? (
                                            <input
                                                type="number"
                                                min="0"
                                                step={
                                                    unit === "L"
                                                        ? "0.01"
                                                        : "0.001"
                                                }
                                                value={qtyInput}
                                                onChange={(e) =>
                                                    onQtyInputChange?.(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={
                                                    unit === "L" ? "0" : "0"
                                                }
                                            />
                                        ) : (
                                            <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">
                                                {sampledQtyLabel}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tinters */}
                                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                                    <div className="bg-gray-600 text-white">
                                        <div className="grid grid-cols-12 text-xs font-medium">
                                            <div className="col-span-1 p-2 text-center border-r border-gray-500">
                                                SL No.
                                            </div>
                                            <div className="col-span-7 p-2 text-center border-r border-gray-500">
                                                Tinters
                                            </div>
                                            <div className="col-span-4 p-2">
                                                <div className="text-center mb-1">
                                                    Quantity
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="text-center">
                                                        Grams (g)
                                                    </div>
                                                    <div className="text-center">
                                                        Volume (ml)
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {scaledTinters.length === 0 ? (
                                            <div className="grid grid-cols-12 text-sm p-4 text-gray-500 dark:text-gray-400">
                                                No tinters
                                            </div>
                                        ) : (
                                            scaledTinters.map((t, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-12 text-xs h-[42px] items-center"
                                                >
                                                    <div className="col-span-1 p-2 text-center bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                                        {index + 1}
                                                    </div>
                                                    <div className="col-span-7 p-2 border-r border-gray-200 dark:border-gray-600">
                                                        <div className="grid grid-cols-12 gap-1">
                                                            <div className="col-span-3 text-gray-900 dark:text-white font-mono">
                                                                {t.code ?? "—"}
                                                            </div>
                                                            <div className="col-span-6 text-gray-900 dark:text-white truncate">
                                                                {t.name ?? "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-4 p-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-center text-sm font-medium text-blue-600 dark:text-blue-300">
                                                                {t.quantity !=
                                                                null
                                                                    ? Number(
                                                                          t.quantity,
                                                                      ).toFixed(
                                                                          2,
                                                                      )
                                                                    : "—"}{" "}
                                                                g
                                                            </div>
                                                            <div className="text-center text-sm text-gray-800 dark:text-gray-200">
                                                                {t.volume !=
                                                                null
                                                                    ? (
                                                                          Number(
                                                                              t.volume,
                                                                          ) *
                                                                          1000
                                                                      ).toFixed(
                                                                          2,
                                                                      )
                                                                    : "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Totals / Binders / Additives / Total */}
                                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                                    <div className="bg-gray-600 text-white p-2">
                                        <div className="grid grid-cols-12 items-center">
                                            <div className="col-span-1" />
                                            <div className="col-span-7 text-sm font-medium">
                                                Total without Additives
                                            </div>
                                            <div className="col-span-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="text-center text-blue-300 font-semibold">
                                                        {totalWithoutAdditivesGrams.toFixed(
                                                            2,
                                                        )}{" "}
                                                        g
                                                    </div>
                                                    <div className="text-center text-sm">
                                                        {(
                                                            totalWithoutAdditivesVolume *
                                                            1000
                                                        ).toFixed(2)}{" "}
                                                        ml
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-500 text-white p-2">
                                        <div className="text-sm font-medium mb-2">
                                            Binders
                                        </div>
                                        {scaledBinders.length === 0 ? (
                                            <div className="grid grid-cols-12 items-center mb-1">
                                                <div className="col-span-1" />
                                                <div className="col-span-7 text-sm text-gray-300">
                                                    No binders
                                                </div>
                                                <div className="col-span-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center text-gray-300">
                                                            0.00 g
                                                        </div>
                                                        <div className="text-center text-gray-300">
                                                            0.00 ml
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            scaledBinders.map((b, i) => (
                                                <div
                                                    key={i}
                                                    className="grid grid-cols-12 items-center mb-1"
                                                >
                                                    <div className="col-span-1" />
                                                    <div className="col-span-7 text-sm">
                                                        <span className="text-gray-300 font-medium">
                                                            Binder {i + 1}:
                                                        </span>{" "}
                                                        {b.name ?? "—"}
                                                    </div>
                                                    <div className="col-span-4">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-center text-blue-300 font-semibold">
                                                                {b.grams !=
                                                                null
                                                                    ? Number(
                                                                          b.grams,
                                                                      ).toFixed(
                                                                          2,
                                                                      )
                                                                    : "—"}{" "}
                                                                g
                                                            </div>
                                                            <div className="text-center text-sm">
                                                                {b.volume !=
                                                                null
                                                                    ? (
                                                                          Number(
                                                                              b.volume,
                                                                          ) *
                                                                          1000
                                                                      ).toFixed(
                                                                          2,
                                                                      )
                                                                    : "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="bg-gray-400 text-white p-2">
                                        <div className="text-sm font-medium mb-2">
                                            Additives
                                        </div>
                                        {scaledAdditives.length === 0 ? (
                                            <div className="grid grid-cols-12 items-center mb-1">
                                                <div className="col-span-1" />
                                                <div className="col-span-7 text-sm text-gray-200">
                                                    No additives
                                                </div>
                                                <div className="col-span-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center text-gray-200">
                                                            0.00 g
                                                        </div>
                                                        <div className="text-center text-gray-200">
                                                            0.00 ml
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {scaledAdditives.map((a, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-12 items-center mb-1"
                                                    >
                                                        <div className="col-span-1" />
                                                        <div className="col-span-7 text-sm">
                                                            <span className="text-gray-200 font-medium">
                                                                Additive{" "}
                                                                {i + 1}:
                                                            </span>{" "}
                                                            {a.name ?? "—"}
                                                        </div>
                                                        <div className="col-span-4">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-center text-blue-200 font-semibold">
                                                                    {a.grams !=
                                                                    null
                                                                        ? Number(
                                                                              a.grams,
                                                                          ).toFixed(
                                                                              2,
                                                                          )
                                                                        : "—"}{" "}
                                                                    g
                                                                </div>
                                                                <div className="text-center text-sm">
                                                                    {a.volume !=
                                                                    null
                                                                        ? (
                                                                              Number(
                                                                                  a.volume,
                                                                              ) *
                                                                              1000
                                                                          ).toFixed(
                                                                              2,
                                                                          )
                                                                        : "—"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="grid grid-cols-12 items-center mt-1 pt-1 border-t border-gray-300">
                                                    <div className="col-span-1" />
                                                    <div className="col-span-7 text-sm font-medium">
                                                        Additives Total
                                                    </div>
                                                    <div className="col-span-4">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-center text-blue-200 font-semibold">
                                                                {additivesTotalGrams.toFixed(
                                                                    2,
                                                                )}{" "}
                                                                g
                                                            </div>
                                                            <div className="text-center text-sm">
                                                                {(
                                                                    additivesTotalVolume *
                                                                    1000
                                                                ).toFixed(2)}{" "}
                                                                ml
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-gray-600 text-white p-2">
                                        <div className="grid grid-cols-12 items-center">
                                            <div className="col-span-1" />
                                            <div className="col-span-7 text-sm font-medium">
                                                Total
                                            </div>
                                            <div className="col-span-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="text-center text-blue-300 font-semibold text-lg">
                                                        {totalGrams.toFixed(2)}{" "}
                                                        g
                                                    </div>
                                                    <div className="text-center text-lg">
                                                        {(
                                                            grandTotalVolume *
                                                            1000
                                                        ).toFixed(2)}{" "}
                                                        ml
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Remarks
                                    </h3>
                                    <div className="p-3 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 whitespace-pre-wrap min-h-[80px]">
                                        {remarks || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsView;

