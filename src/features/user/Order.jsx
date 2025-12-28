import Header from "./components/Header";

const Order = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <p className="text-gray-700 dark:text-gray-300">
                        User can place a new order here.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Order;
