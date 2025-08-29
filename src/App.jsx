import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import KanbanTest from './features/kanban/components/KanbanTest';
import BackendTest from './features/kanban/pages/BackendTest';
// import SessionStatus from './components/SessionStatus';
// import DebugCookies from './components/DebugCookies';


function App() {
  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <ThemeProvider>
          <Router>
            <div className="App">
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
                  path="/kanban-test" 
                  element={
                    <UserProtectedRoute>
                      <KanbanTest />
                    </UserProtectedRoute>
                  } 
                />
                <Route 
                  path="/backend-test" 
                  element={
                    <UserProtectedRoute>
                      <BackendTest />
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
  );
}

export default App;
