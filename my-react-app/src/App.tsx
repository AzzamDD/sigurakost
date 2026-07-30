import { Routes, Route } from "react-router-dom";
import LoginPage from "./loginpage";
import Dashboard from "./dashboard";
import ProductsPage from "./produk";
import CategoriesPage from "./kategori";
import WarehousePage from "./warehouse";
import MerchantPage from "./merchant";
import RolePage from "./role";
import ManageUser from "./manageUser";
import Settings from "./settings";
import ForgotPasswordPage from "./forgotPassword";
import ResetPasswordPage from "./resetpassword";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/produk" element={<ProductsPage />} />
      <Route path="/kategori" element={<CategoriesPage />} />
      <Route path="/warehouse" element={<WarehousePage />} />
      <Route path="/merchant" element={<MerchantPage />} />
      <Route path="/role" element={<RolePage />} />
      <Route path="/manageUser" element={<ManageUser />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
 
    </Routes>
  );
}