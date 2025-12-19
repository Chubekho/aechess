// client/src/components/guards/AdminGuard.jsx
import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/index";

const AdminGuard = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    // You can render a proper loading spinner here
    return <div>Loading...</div>;
  }

  // Check for token first, then for user role.
  // This ensures that non-logged-in users are redirected.
  if (!token || !user || user.role !== "admin") {
    // Redirect them to the home page if they are not an admin.
    return <Navigate to="/" />;
  }

  // If authenticated and is an admin, render the child routes
  return <Outlet />;
};

export default AdminGuard;
