import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './features/user/Login';
import AdminLogin from './features/admin/Login';
import UserDashboard from './features/user/Dashboard';
import AdminDashboard from './features/admin/Dashboard';
import UserProtectedRoute from './components/UserProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import CreateFormula from './features/user/CreateFormula';
import Order from './features/user/Order';
import Orders from './features/user/Orders';
import KanbanDashboard from './features/kanban/pages/KanbanDashboard';
import RefreshTokenDebug from './components/RefreshTokenDebug';
// import SessionStatus from './components/SessionStatus';
// import DebugCookies from './components/DebugCookies';


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
      <UserAuthProvider>
        <AdminAuthProvider>
          <ThemeProvider>
            <Router>
            <div className="App">
              {/* <RefreshTokenDebug /> */}
              {/* <SessionStatus />
              <DebugCookies /> */}
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
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
                  path="/admin/dashboard" 
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  } 
                />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </AdminAuthProvider>
    </UserAuthProvider>
    
    {/* Add React Query DevTools in development */}
    {/* {process.env.NODE_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )} */}
  </QueryClientProvider>
  );
}

export default App;
