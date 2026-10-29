import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  let user = null;

  try {
    const savedUser = localStorage.getItem("user");
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("user");
  }

  if (!user || !user.name) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;