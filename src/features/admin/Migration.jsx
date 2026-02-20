import React, { useState, useEffect } from "react";
import {
  Database,
  Upload,
  FileCheck,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  Loader,
  RefreshCw,
} from "lucide-react";
import migrationService from "../../services/migrationService";

const Migration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [backupPath, setBackupPath] = useState("");
  const [availableBackups, setAvailableBackups] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [migrationMode, setMigrationMode] = useState("merge");
  const [migrationResult, setMigrationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Load available backups on mount
  useEffect(() => {
    loadAvailableBackups();
  }, []);

  const loadAvailableBackups = async () => {
    try {
      const result = await migrationService.discoverBackups();
      if (result.success && result.backups.length > 0) {
        setAvailableBackups(result.backups);
        // Auto-select the first backup
        setBackupPath(result.backups[0].relativePath);
      }
    } catch (err) {
      console.error("Error loading backups:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleFileUpload(file);
    } else {
      setError('Please select a .zip file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      handleFileUpload(file);
    } else {
      setError('Please drop a .zip file');
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      const result = await migrationService.uploadZipFile(file);
      setBackupPath(result.backupPath);
      setAnalysis(result.analysis);
      setCurrentStep(3); // Skip to collection selection
    } catch (err) {
      setError(err.message);
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const steps = [
    { id: 1, name: "Select Backup", icon: Upload },
    { id: 2, name: "Analyze", icon: FileCheck },
    { id: 3, name: "Select Collections", icon: Database },
    { id: 4, name: "Configure", icon: Settings },
    { id: 5, name: "Execute", icon: Play },
    { id: 6, name: "Review", icon: CheckCircle },
  ];

  const handleAnalyzeBackup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await migrationService.analyzeBackup(backupPath);
      setAnalysis(result);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCollection = (collectionName) => {
    setSelectedCollections((prev) => {
      if (prev.includes(collectionName)) {
        return prev.filter((c) => c !== collectionName);
      } else {
        return [...prev, collectionName];
      }
    });
  };

  const handleSelectAll = () => {
    if (!analysis) return;
    const allCollections = analysis.collections
      .filter((c) => c.canMigrate)
      .map((c) => c.oldName);
    setSelectedCollections(allCollections);
  };

  const handleDeselectAll = () => {
    setSelectedCollections([]);
  };

  const handleExecuteMigration = async () => {
    if (selectedCollections.length === 0) {
      setError("Please select at least one collection to migrate");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await migrationService.executeMigration(
        backupPath,
        selectedCollections,
        migrationMode
      );
      setMigrationResult(result);
      setCurrentStep(6);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      handleAnalyzeBackup();
    } else if (currentStep === 5) {
      handleExecuteMigration();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Zip File Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload Backup Zip File
              </h3>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your backup zip file here, or
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Browse Files
                </label>
                <p className="text-xs text-gray-500 mt-3">
                  Supported format: .zip (Max 1GB)
                </p>
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ {uploadedFile.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Select from Available Backups */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select from Server Backups
              </h3>
              {availableBackups.length > 0 ? (
                <>
                  <select
                    value={backupPath}
                    onChange={(e) => setBackupPath(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {availableBackups.map((backup) => (
                      <option key={backup.path} value={backup.relativePath}>
                        {backup.name} ({backup.exportDate} - {backup.totalCollections} collections)
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {availableBackups.find(b => b.relativePath === backupPath)?.fileCount || 0} collection files found
                    </p>
                    <button
                      onClick={loadAvailableBackups}
                      className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                </>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                  <Database className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No backups found in "old data" directory</p>
                  <button
                    onClick={loadAvailableBackups}
                    className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Database className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Analyze Backup
              </h3>
              <p className="text-gray-600">
                Click "Next" to analyze the backup at: <br />
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  {backupPath}
                </span>
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {analysis && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Backup Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Total Collections</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {analysis.summary.totalCollections}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Mapped</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {analysis.summary.mappedCollections}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Total Records</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {analysis.summary.totalRecords.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Export Date</p>
                      <p className="text-sm font-medium text-blue-900">
                        {analysis.metadata.exportDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">
                    Select Collections to Migrate ({selectedCollections.length} selected)
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Old Collection
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          New Collection
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Records
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysis.collections
                        .filter((c) => c.canMigrate)
                        .map((collection) => (
                          <tr
                            key={collection.oldName}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleToggleCollection(collection.oldName)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedCollections.includes(collection.oldName)}
                                onChange={() => handleToggleCollection(collection.oldName)}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {collection.oldName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {collection.newName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {collection.recordCount}
                            </td>
                            <td className="px-4 py-3">
                              {collection.isMapped ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Mapped
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  No Mapping
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Migration Mode</h3>
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    value="dry-run"
                    checked={migrationMode === "dry-run"}
                    onChange={(e) => setMigrationMode(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Dry Run</p>
                    <p className="text-sm text-gray-600">
                      Simulate migration without making any changes. Validate data and preview results.
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    value="merge"
                    checked={migrationMode === "merge"}
                    onChange={(e) => setMigrationMode(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Merge</p>
                    <p className="text-sm text-gray-600">
                      Add new records from backup. Skip records that already exist (by code).
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={migrationMode === "replace"}
                    onChange={(e) => setMigrationMode(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Replace</p>
                    <p className="text-sm text-gray-600">
                      Clear existing data and import all records from backup. USE WITH CAUTION!
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    {migrationMode === "replace" 
                      ? "Replace mode will delete existing data. Make sure you have a backup before proceeding."
                      : migrationMode === "dry-run"
                      ? "Dry run mode will not make any changes to your database. Use this to preview the migration."
                      : "Merge mode will only add new records and skip existing ones based on their unique codes."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Migration Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Collections to migrate: <strong>{selectedCollections.length}</strong></p>
                <p>Mode: <strong className="capitalize">{migrationMode}</strong></p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Play className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Execute Migration
              </h3>
              <p className="text-gray-600 mb-4">
                Click "Execute" to start the migration process.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Mode:</strong> <span className="capitalize">{migrationMode}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Collections:</strong> {selectedCollections.length}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {selectedCollections.slice(0, 5).join(", ")}
                  {selectedCollections.length > 5 && ` and ${selectedCollections.length - 5} more...`}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {migrationResult && (
              <>
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Migration Completed
                  </h3>
                  <p className="text-gray-600">
                    {migrationResult.summary.successful} of {migrationResult.summary.total} collections migrated successfully
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Collection
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {migrationResult.results.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {result.collection}
                          </td>
                          <td className="px-4 py-3">
                            {result.success ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.success ? (
                              result.result.mode === "dry-run" ? (
                                `Would insert ${result.result.wouldInsert} records`
                              ) : (
                                `Inserted: ${result.result.inserted || 0}, Skipped: ${result.result.skipped || 0}`
                              )
                            ) : (
                              <span className="text-red-600">{result.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {migrationResult.summary.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          {migrationResult.summary.failed} collection(s) failed to migrate
                        </h4>
                        <p className="mt-1 text-sm text-red-700">
                          Check the details above for more information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Data Migration
          </h1>
          <p className="text-gray-600">
            Import data from old backup format into the current database schema
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-600">
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={
              isLoading ||
              (currentStep === 1 && !backupPath) ||
              (currentStep === 3 && selectedCollections.length === 0) ||
              currentStep === 6
            }
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : currentStep === 5 ? (
              <>
                Execute Migration
                <Play className="w-4 h-4 ml-2" />
              </>
            ) : currentStep === 6 ? (
              "Completed"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Migration;
