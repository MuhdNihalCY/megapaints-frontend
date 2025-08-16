import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './features/user/Login';
import AdminLogin from './features/admin/Login';
import UserDashboard from './features/user/Dashboard';
import AdminDashboard from './features/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CreateFormula from './features/user/CreateFormula';
import Order from './features/user/Order';
import Orders from './features/user/Orders';
import KanbanDashboard from './features/kanban/pages/KanbanDashboard';
import KanbanTest from './features/kanban/components/KanbanTest';
import BackendTest from './features/kanban/pages/BackendTest';


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Routes */}
              {/* Back-compat: old user path redirects to new clean path */}
              <Route path="/user/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <KanbanDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* User-only additional routes */}
              <Route 
                path="/old-dashboard" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/kanban-test" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <KanbanTest />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/backend-test" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <BackendTest />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/create-formula" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <CreateFormula />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <Order />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute requiredRole="user">
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
