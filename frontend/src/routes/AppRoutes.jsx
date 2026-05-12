import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import MembershipPackages from '../pages/MembershipPackages';
import Subscriptions from '../pages/Subscriptions';
import Payments from '../pages/Payments';
import HealthReports from '../pages/HealthReports';
import Equipments from '../pages/Equipments';
import MaintenanceRecords from '../pages/MaintenanceRecords';
import RepairRecords from '../pages/RepairRecords';
import BudgetReport from '../pages/BudgetReport';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/packages" element={<MembershipPackages />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/health-reports" element={<HealthReports />} />
        <Route path="/equipments" element={<Equipments />} />
        <Route path="/maintenance" element={<MaintenanceRecords />} />
        <Route path="/repairs" element={<RepairRecords />} />
        <Route
          path="/budget"
          element={
            <ProtectedRoute roles={['YONETICI']}>
              <BudgetReport />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
