/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to error reporting service
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });

        // Log to error reporting service in production
        if (process.env.NODE_ENV === "production") {
            // logErrorToService(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="error-boundary bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-4">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-8 w-8 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                                Something went wrong
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                An error occurred while rendering this
                                component.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={this.handleRetry}
                            className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>

                    {/* Development error details */}
                    {process.env.NODE_ENV === "development" &&
                        this.state.error && (
                            <details className="mt-4">
                                <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                                    Error Details (Development Only)
                                </summary>
                                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                                    <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto">
                                        {this.state.error &&
                                            this.state.error.toString()}
                                        <br />
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </div>
                            </details>
                        )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
