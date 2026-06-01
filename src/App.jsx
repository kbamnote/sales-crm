import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Core pages
import DashboardPage from './pages/dashboard/DashboardPage';
import LeadsPage from './pages/leads/LeadsPage';
import MeetingsPage from './pages/meetings/MeetingsPage';

// Core pages
import ClientsPage from './pages/clients/ClientsPage';

// Placeholder pages (developer to flesh out using LeadsPage / MeetingsPage as templates)
import PlaceholderPage from './pages/PlaceholderPage';

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
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="meetings" element={<MeetingsPage />} />

        {/* All other pages — developer to convert from V8.html using the patterns shown */}
        <Route path="clients" element={<ClientsPage />} />
        <Route path="my-clients" element={<ClientsPage myOnly />} />
        <Route path="my-meetings" element={<PlaceholderPage title="My Meetings" fnRef="rMyMeetings" />} />
        <Route path="deals" element={<PlaceholderPage title="Deals & Payments" fnRef="rDeals" />} />
        <Route path="my-deals" element={<PlaceholderPage title="My Deals" fnRef="rMyDeals" />} />
        <Route path="calls" element={<PlaceholderPage title="Calls Log" fnRef="rCallsLog" />} />
        <Route path="my-calls" element={<PlaceholderPage title="My Calls" fnRef="rMyCalls" />} />
        <Route path="my-target" element={<PlaceholderPage title="My Target" fnRef="rMyTarget" />} />
        <Route path="targets" element={<PlaceholderPage title="Targets" fnRef="rTargets" />} />
        <Route path="hierarchy" element={<PlaceholderPage title="Team Hierarchy" fnRef="rHierarchy" />} />
        <Route path="live-map" element={<PlaceholderPage title="Live Map" fnRef="rLiveMap" />} />
        <Route path="coupons" element={<PlaceholderPage title="Coupons" fnRef="rCoupons" />} />
        <Route path="team" element={<PlaceholderPage title="Manage Team" fnRef="rTeamMgmt" />} />
        <Route path="appointments" element={<PlaceholderPage title="Appointments" fnRef="rAppointments" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" fnRef="rReports" />} />
        <Route path="notifications" element={<PlaceholderPage title="Notifications" fnRef="rNotifications" />} />
        <Route path="settings" element={<PlaceholderPage title="Company Settings" fnRef="rCompanySettings" />} />
        <Route path="permissions" element={<PlaceholderPage title="Permissions" fnRef="rPermissions" />} />
        <Route path="attendance" element={<PlaceholderPage title="Attendance" fnRef="rAttendance" />} />
        <Route path="field-visit" element={<PlaceholderPage title="Field Visit" fnRef="rFieldVisit" />} />
        <Route path="chat" element={<PlaceholderPage title="Chat" fnRef="renderChatPage" />} />
        <Route path="profile" element={<PlaceholderPage title="My Profile" fnRef="rMyProfile" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
