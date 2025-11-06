import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './features/user/Login';
import Register from './features/user/Register';
import AdminLogin from './features/admin/Login';
import UserDashboard from './features/user/Dashboard';
import AdminDashboard from './features/admin/Dashboard';
import UserManagement from './features/admin/UserManagement';
import Branches from './features/admin/Branches';
import Categories from './features/admin/Categories';
import Products from './features/admin/Products';
import Additives from './features/admin/Additives';
import Binders from './features/admin/Binders';
import Auxiliaries from './features/admin/Auxiliaries';
import Accessories from './features/admin/Accessories';
import ThirdPartyProducts from './features/admin/ThirdPartyProducts';
import SubCategories from './features/admin/new/SubCategories';
import Employees from './features/admin/new/Employees';
import Customers from './features/admin/new/Customers';
import PurchasedItems from './features/admin/new/PurchasedItems';
import AdminLayout from './features/admin/components/AdminLayout';
import UserProtectedRoute from './components/UserProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import CreateFormula from './features/user/CreateFormula';
import Order from './features/user/Order';
import Orders from './features/user/Orders';
import KanbanDashboard from './features/kanban/pages/KanbanDashboard';


// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
          <div className="App">
            {/* Temporary CORS Debugger - Remove after testing */}
            {/* <CORSDebugger /> */}
            {/* Temporary Registration Test - Remove after testing */}
            {/* <RegistrationTest /> */}
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* User Protected Routes */}
              <Route path="/user/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <UserProtectedRoute>
                    <KanbanDashboard />
                  </UserProtectedRoute>
                } 
              />
              
              <Route 
                path="/old-dashboard" 
                element={
                  <UserProtectedRoute>
                    <UserDashboard />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/create-formula" 
                element={
                  <UserProtectedRoute>
                    <CreateFormula />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/order" 
                element={
                  <UserProtectedRoute>
                    <Order />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <UserProtectedRoute>
                    <Orders />
                  </UserProtectedRoute>
                } 
              />
              
              {/* Admin Protected Routes */}
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="branches" element={<Branches />} />
                <Route path="categories" element={<Categories />} />
                <Route path="sub-categories" element={<SubCategories />} />
                <Route path="products" element={<Products />} />
                <Route path="additives" element={<Additives />} />
                <Route path="binders" element={<Binders />} />
                <Route path="auxiliaries" element={<Auxiliaries />} />
                <Route path="accessories" element={<Accessories />} />
                <Route path="third-party-products" element={<ThirdPartyProducts />} />
                <Route path="employees" element={<Employees />} />
                <Route path="customers" element={<Customers />} />
                <Route path="purchased-items" element={<PurchasedItems />} />
              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
    
    {/* Add React Query DevTools in development */}
    {/* {process.env.NODE_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )} */}
  </QueryClientProvider>
  );
}

export default App;
