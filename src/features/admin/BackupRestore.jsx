import { useState, useEffect } from "react";
import {
    Database,
    Download,
    Upload,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader,
    HardDrive,
    Calendar,
    FileText,
    Archive,
} from "lucide-react";
import backupService from "../../services/backupService";

const BackupRestore = () => {
    const [activeTab, setActiveTab] = useState("backup");
    const [backups, setBackups] = useState([]);
    const [collections, setCollections] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [backupType, setBackupType] = useState("full");
    const [backupFormat, setBackupFormat] = useState("json");
    
    const [importFile, setImportFile] = useState(null);
    const [importMode, setImportMode] = useState("merge");
    const [importCollections, setImportCollections] = useState([]);
    const [validationResult, setValidationResult] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        fetchBackups();
        fetchCollections();
    }, []);

    const fetchBackups = async () => {
        try {
            const response = await backupService.listBackups();
            if (response.status === "success") {
                setBackups(response.data.backups || []);
            }
        } catch (err) {
            console.error("Error fetching backups:", err);
        }
    };

    const fetchCollections = async () => {
        try {
            const response = await backupService.getAvailableCollections();
            if (response.status === "success") {
                setCollections(response.data.collections || []);
            }
        } catch (err) {
            console.error("Error fetching collections:", err);
        }
    };

    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
            setSuccess("");
            setTimeout(() => setError(""), 5000);
        } else {
            setSuccess(message);
            setError("");
            setTimeout(() => setSuccess(""), 5000);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const params = {
                type: backupType,
                format: backupFormat,
            };

            if (backupType === "selective") {
                if (selectedCollections.length === 0) {
                    showMessage("Please select at least one collection", true);
                    return;
                }
                params.collections = selectedCollections;
            }

            const response = await backupService.createBackup(params);

            if (response.status === "success") {
                showMessage("Backup created successfully!");
                setSelectedCollections([]);
                await fetchBackups();
            }
        } catch (err) {
            showMessage(err.message || "Failed to create backup", true);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBackup = async (backup) => {
        try {
            await backupService.downloadBackup(backup.id, backup.filename);
            showMessage("Backup downloaded successfully!");
        } catch (err) {
            showMessage(err.message || "Failed to download backup", true);
        }
    };

    const handleDeleteBackup = async (backupId) => {
        if (!window.confirm("Are you sure you want to delete this backup?")) {
            return;
        }

        try {
            setLoading(true);
            const response = await backupService.deleteBackup(backupId);

            if (response.status === "success") {
                showMessage("Backup deleted successfully!");
                await fetchBackups();
            }
        } catch (err) {
            showMessage(err.message || "Failed to delete backup", true);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportFile(file);
        setValidationResult(null);
        setLoading(true);

        try {
            const response = await backupService.validateBackupFile(file);
            if (response.status === "success") {
                setValidationResult(response.data);
                showMessage("Backup file validated successfully!");
            }
        } catch (err) {
            showMessage(err.message || "Invalid backup file", true);
            setImportFile(null);
        } finally {
            setLoading(false);
        }
    };

    const handleImportBackup = async () => {
        if (!importFile) {
            showMessage("Please select a backup file", true);
            return;
        }

        if (!showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        try {
            setLoading(true);
            setShowConfirmation(false);

            const response = await backupService.uploadBackupFile(
                importFile,
                importMode,
                importCollections.length > 0 ? importCollections : null
            );

            if (response.status === "success") {
                showMessage("Backup imported successfully!");
                setImportFile(null);
                setValidationResult(null);
                setImportCollections([]);
                await fetchBackups();
            }
        } catch (err) {
            showMessage(err.message || "Failed to import backup", true);
        } finally {
            setLoading(false);
        }
    };

    const toggleCollection = (collection) => {
        setSelectedCollections((prev) =>
            prev.includes(collection)
                ? prev.filter((c) => c !== collection)
                : [...prev, collection]
        );
    };

    const toggleImportCollection = (collection) => {
        setImportCollections((prev) =>
            prev.includes(collection)
                ? prev.filter((c) => c !== collection)
                : [...prev, collection]
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Database className="w-8 h-8" />
                        Database Backup & Restore
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Create, manage, and restore database backups
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-200">
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="flex gap-1 p-1">
                            {["backup", "restore", "history"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === tab
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {tab === "backup" && <Archive className="w-4 h-4 inline mr-2" />}
                                    {tab === "restore" && <Upload className="w-4 h-4 inline mr-2" />}
                                    {tab === "history" && <Calendar className="w-4 h-4 inline mr-2" />}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === "backup" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Backup Type
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backupType"
                                                value="full"
                                                checked={backupType === "full"}
                                                onChange={(e) => setBackupType(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Full Backup</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backupType"
                                                value="selective"
                                                checked={backupType === "selective"}
                                                onChange={(e) => setBackupType(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">Selective Backup</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Format
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backupFormat"
                                                value="json"
                                                checked={backupFormat === "json"}
                                                onChange={(e) => setBackupFormat(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">JSON (Human-readable)</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backupFormat"
                                                value="bson"
                                                checked={backupFormat === "bson"}
                                                onChange={(e) => setBackupFormat(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">BSON (Efficient)</span>
                                        </label>
                                    </div>
                                </div>

                                {backupType === "selective" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select Collections
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                            {collections.map((collection) => (
                                                <label
                                                    key={collection}
                                                    className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCollections.includes(collection)}
                                                        onChange={() => toggleCollection(collection)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {collection}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {selectedCollections.length} collection(s) selected
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateBackup}
                                    disabled={loading}
                                    className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Creating Backup...
                                        </>
                                    ) : (
                                        <>
                                            <HardDrive className="w-5 h-5" />
                                            Create Backup
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {activeTab === "restore" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Upload Backup File
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            accept=".json,.bson,.gz"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="backup-file"
                                            disabled={loading}
                                        />
                                        <label
                                            htmlFor="backup-file"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                                            <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                                                {importFile ? importFile.name : "Click to upload or drag and drop"}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                JSON, BSON, or GZ files (max 500MB)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {validationResult && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                            Backup File Information
                                        </h3>
                                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                            <p>Version: {validationResult.summary?.version}</p>
                                            <p>Format: {validationResult.summary?.format}</p>
                                            <p>Collections: {validationResult.summary?.totalCollections}</p>
                                            <p>Documents: {validationResult.summary?.totalDocuments}</p>
                                            <p>Media/Uploads: {validationResult.summary?.uploadsCount || 0} files</p>
                                            <p>Created: {formatDate(validationResult.summary?.timestamp)}</p>
                                        </div>
                                    </div>
                                )}

                                {importFile && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Import Mode
                                            </label>
                                            <select
                                                value={importMode}
                                                onChange={(e) => setImportMode(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="merge">Merge (Keep existing, add new)</option>
                                                <option value="upsert">Upsert (Update existing, add new)</option>
                                                <option value="replace">Replace (Clear and import)</option>
                                            </select>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {importMode === "merge" && "Existing data will be preserved, new documents will be added"}
                                                {importMode === "upsert" && "Existing documents will be updated, new ones will be added"}
                                                {importMode === "replace" && "⚠️ Warning: All existing data will be deleted"}
                                            </p>
                                        </div>

                                        {showConfirmation && (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                                            Confirm Import
                                                        </h3>
                                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                            Are you sure you want to import this backup in "{importMode}" mode?
                                                            {importMode === "replace" && " This will delete all existing data."}
                                                        </p>
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={handleImportBackup}
                                                                disabled={loading}
                                                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setShowConfirmation(false)}
                                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!showConfirmation && (
                                            <button
                                                onClick={handleImportBackup}
                                                disabled={loading}
                                                className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader className="w-5 h-5 animate-spin" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-5 h-5" />
                                                        Import Backup
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="space-y-4">
                                {backups.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">No backups available</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Format
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Size
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Contents
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {backups.map((backup) => (
                                                    <tr
                                                        key={backup.id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    >
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {formatDate(backup.timestamp)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    backup.type === "full"
                                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                                                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                                                                }`}
                                                            >
                                                                {backup.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 uppercase">
                                                            {backup.format}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                            {backup.sizeFormatted}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                            <div>{backup.collectionCount} collections</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {backup.documentCount} docs, {backup.uploadsCount || 0} files
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleDownloadBackup(backup)}
                                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                    title="Download"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBackup(backup.id)}
                                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupRestore;
