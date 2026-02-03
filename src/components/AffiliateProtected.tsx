import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAffiliateToken } from "@/services/affiliateApi";

export default function AffiliateProtected() {
  const token = getAffiliateToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/affiliate/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
