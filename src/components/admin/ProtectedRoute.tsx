import { Navigate, Outlet } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';

export default function ProtectedRoute() {
  const { authToken } = useAdminStore();
  if (!authToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
