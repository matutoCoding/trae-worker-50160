import { Navigate, useRoutes } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import SchedulePage from "@/pages/SchedulePage";
import BookingListPage from "@/pages/BookingListPage";
import ApprovalPage from "@/pages/ApprovalPage";
import OvertimePage from "@/pages/OvertimePage";
import ClassroomManagePage from "@/pages/ClassroomManagePage";
import RecordingPage from "@/pages/RecordingPage";
import HelpPage from "@/pages/HelpPage";

export default function AppRouter() {
  const routes = useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "schedule", element: <SchedulePage /> },
        { path: "bookings", element: <BookingListPage /> },
        { path: "approval", element: <ApprovalPage /> },
        { path: "overtime", element: <OvertimePage /> },
        { path: "classrooms", element: <ClassroomManagePage /> },
        { path: "recordings", element: <RecordingPage /> },
        { path: "help", element: <HelpPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ]);

  return routes;
}
