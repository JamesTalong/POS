import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../src/redux/store";
import SignIn from "./pages/Account/SignIn";
import SignUp from "./pages/Account/SignUp";
import Reset from "./pages/Account/Reset";
import Admin from "./pages/Admin/Admin";
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import UsersComponent from "./components/Admin/User/Users"; // Renamed to avoid conflict with lucide-react
import Categories from "./components/Admin/Categories/Categories";
import AllCategoriesTwo from "./components/Admin/CategoriesTwo/CategoryModule/AllCategoriesTwo";
import CategoriesThree from "./components/Admin/CategoriesThree/CategoriesThree";
import CategoriesFour from "./components/Admin/CategoriesFour/CategoriesFour";
import CategoriesFive from "./components/Admin/CategoriesFive/CategoriesFive";
import Brands from "./components/Admin/Brands/Brands";
import ColorsComponent from "./components/Admin/Colors/Colors"; // Renamed to avoid conflict with chart.js
import Locations from "./components/Admin/Locations/Locations";
import Products from "./components/Admin/Products/Products";
import Pricelists from "./components/Admin/Pricelists/Pricelists";
import Batches from "./components/Admin/Batches/Batches";
import SerialNumbers from "./components/Admin/SerialNumbers/SerialNumbers";
import Customers from "./components/Admin/Customers/Customers";
import Inventory from "./components/Admin/Inventory/Inventory";
import Transactions from "./components/Admin/Transactions/Transactions";
import Pos from "./components/Admin/POS/Pos";
import InventoryStaging from "./components/Admin/InventoryStaging/InventoryStaging";
import UserRestriction from "./components/Admin/UserRestriction/UserRestriction";
import Transfer from "./components/Admin/Transfer/Transfer";
import TransferItems from "./components/Admin/TransferItems/TransferItems";
import InventoryCost from "./components/Admin/Costing/InventoryCost";
import HelpFAQ from "./components/Admin/Batches/HelpFAQ/HelpFAQ";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        {/* Public Routes for Sign In/Sign Up */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/reset" element={<Reset />} />

        {/* Protected Admin Route with Nested Routes */}
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="dashboard" />} />{" "}
          {/* Default admin page */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UsersComponent />} />{" "}
          {/* Use the renamed component */}
          <Route path="categories" element={<Categories />} />
          <Route path="categories2" element={<AllCategoriesTwo />} />
          <Route path="categories3" element={<CategoriesThree />} />
          <Route path="categories4" element={<CategoriesFour />} />
          <Route path="categories5" element={<CategoriesFive />} />
          <Route path="brands" element={<Brands />} />
          <Route path="colors" element={<ColorsComponent />} />{" "}
          {/* Use the renamed component */}
          <Route path="locations" element={<Locations />} />
          <Route path="product-list" element={<Products />} />
          <Route path="pricelists" element={<Pricelists />} />
          <Route path="batches" element={<Batches />} />
          <Route path="serial-numbers" element={<SerialNumbers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="pos" element={<Pos />} />
          <Route path="InventoryStaging" element={<InventoryStaging />} />
          <Route path="userRestriction" element={<UserRestriction />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="transferItems" element={<TransferItems />} />
          <Route path="InventoryCost" element={<InventoryCost />} />
          <Route path="help-faq" element={<HelpFAQ />} />
        </Route>

        {/* Redirect any other path to signin */}
        <Route path="*" element={<Navigate to="/signin" />} />
      </Route>
    )
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastContainer position="top-right" autoClose={1000} />
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
};

export default App;
