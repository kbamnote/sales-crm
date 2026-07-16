import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Public customer forms (token-gated, no login)
import PublicDataFormPage from './pages/public/PublicDataFormPage';
import PublicFeedbackPage from './pages/public/PublicFeedbackPage';

// Core pages
import DashboardPage from './pages/dashboard/DashboardPage';
import LeadsPage from './pages/leads/LeadsPage';
import MeetingsPage from './pages/meetings/MeetingsPage';

// Core pages
import ClientsPage from './pages/clients/ClientsPage';

// Placeholder pages (developer to flesh out using LeadsPage / MeetingsPage as templates)
import PlaceholderPage from './pages/PlaceholderPage';

// Phase 1 CRUD
import CallsPage from './pages/calls/CallsPage';
import CouponsPage from './pages/coupons/CouponsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';

// Phase 2
import DealsPage from './pages/deals/DealsPage';
import FulfillmentBoardPage from './pages/fulfillment/FulfillmentBoardPage';
import TargetsPage from './pages/targets/TargetsPage';
import TeamPage from './pages/team/TeamPage';
import PermissionsPage from './pages/permissions/PermissionsPage';
import ReportsPage from './pages/reports/ReportsPage';

// Phase 3
import AttendancePage from './pages/attendance/AttendancePage';
import FieldVisitPage from './pages/fieldVisit/FieldVisitPage';
import ChatPage from './pages/chat/ChatPage';
import LiveMapPage from './pages/dashboard/LiveMapPage';
import HierarchyPage from './pages/team/HierarchyPage';
import PresentationsPage from './pages/presentations/PresentationsPage';

// Phase 4
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import SendMembershipPage from './pages/sendMembership/SendMembershipPage';
import SendTapifyWelcomePage from './pages/sendTapifyWelcome/SendTapifyWelcomePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{padding:40}}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Public customer forms — no auth */}
      <Route path="/form/:token" element={<PublicDataFormPage />} />
      <Route path="/feedback/:token" element={<PublicFeedbackPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="meetings" element={<MeetingsPage />} />

        {/* All other pages — developer to convert from V8.html using the patterns shown */}
        <Route path="clients" element={<ClientsPage />} />
        <Route path="my-clients" element={<ClientsPage myOnly />} />
        <Route path="my-meetings" element={<MeetingsPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="my-deals" element={<DealsPage />} />
        <Route path="fulfillment" element={<FulfillmentBoardPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="my-calls" element={<CallsPage />} />
        <Route path="my-target" element={<TargetsPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="hierarchy" element={<HierarchyPage />} />
        <Route path="live-map" element={<LiveMapPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="field-visit" element={<FieldVisitPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="presentations" element={<PresentationsPage />} />
        <Route path="send-membership" element={<SendMembershipPage />} />
        <Route path="send-tapify-welcome" element={<SendTapifyWelcomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
