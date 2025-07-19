import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaSignOutAlt,
  FaAngleLeft,
  FaAngleRight,
  FaArchive,
  FaChartBar,
  FaCalculator,
  FaBoxOpen,
  FaClipboardList,
  FaUserFriends,
  FaAngleDown,
  FaPalette,
  FaMapMarkerAlt,
  FaTags,
  FaQuestionCircle,
  FaBars,
} from "react-icons/fa";
import logo from "../../Images/logo.png";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../../firebase/config";
import { useDispatch, useSelector } from "react-redux";
import {
  SET_ACTIVE_USER,
  REMOVE_ACTIVE_USER,
  selectUserID,
  selectFullName,
  selectImgUrl,
  selectRoleId,
  selectIsLoggedIn,
} from "../../redux/IchthusSlice";

import Loader from "../../components/loader/Loader";
import { domain } from "../../security";
import HelpFAQ from "../../components/Admin/Batches/HelpFAQ/HelpFAQ";
import FetchFailedHelp from "../../components/Admin/Batches/HelpFAQ/FetchFailedHelp";

const Admin = () => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showApiErrorFAQ, setShowApiErrorFAQ] = useState(false); // New state for API error
  const [fetchFailed, setFetchFailed] = useState(false);
  const userID = useSelector(selectUserID);
  const fullName = useSelector(selectFullName);
  const imgUrl = useSelector(selectImgUrl);
  const roleId = useSelector(selectRoleId);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !userID) {
        dispatch(
          SET_ACTIVE_USER({
            email: user.email,
            userID: user.uid,
          })
        );
      } else if (!user) {
        dispatch(REMOVE_ACTIVE_USER());
        setRolePermissions(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [dispatch, userID]);

  useEffect(() => {
    if (roleId && isLoggedIn) {
      const fetchPermissions = async () => {
        setLoadingPermissions(true);
        setFetchFailed(false); // Reset on every new attempt
        try {
          const response = await axios.get(`${domain}/api/JobRole/${roleId}`);
          setRolePermissions(response.data);
        } catch (error) {
          console.error("Failed to fetch role permissions", error);
          toast.error("Critical Error: Could not connect to the API.");
          setRolePermissions(null);
          // SET THE fetchFailed STATE TO TRUE TO TRIGGER THE HELP SCREEN
          setFetchFailed(true);
        } finally {
          setLoadingPermissions(false);
        }
      };
      fetchPermissions();
    } else if (!isLoggedIn) {
      setRolePermissions(null);
      setLoadingPermissions(false);
    } else {
      setLoadingPermissions(true);
    }
  }, [roleId, isLoggedIn]);
  const Menus = [
    {
      title: "Product Setup",
      Icon: FaBoxOpen,
      permissionKey: "categories",
      dropdown: [
        {
          title: "Categories",
          path: "categories",
          permissionKey: "categories",
        },
        {
          title: "Categories 2",
          path: "categories2",
          permissionKey: "categories2",
        },
        {
          title: "Categories 3",
          path: "categories3",
          permissionKey: "categories3",
        },
        {
          title: "Categories 4",
          path: "categories4",
          permissionKey: "categories4",
        },
        {
          title: "Categories 5",
          path: "categories5",
          permissionKey: "categories5",
        },
        { title: "Brands", path: "brands", permissionKey: "brands" },
        {
          title: "Pricelists",
          path: "pricelists",
          permissionKey: "pricelists",
        },
        {
          title: "Stock Entry (Batches)",
          path: "batches",
          permissionKey: "batches",
        },
      ],
    },
    {
      title: "Inventory",
      Icon: FaArchive,
      permissionKey: "inventory",
      dropdown: [
        {
          title: "Inventory",
          path: "inventory",
          permissionKey: "inventory",
        },
        // {
        //   title: "Item Transfers",
        //   path: "transferItems",
        //   permissionKey: "transferItems",
        // },
        {
          title: "Transfer",
          path: "transfer",
          Icon: FaBoxOpen,
          permissionKey: "transferItems",
        },
        {
          title: "Cost of Goods",
          path: "InventoryCost",
          permissionKey: "inventoryCost",
        },
        {
          title: "SerialNumbers",
          path: "serial-numbers",
          permissionKey: "serialNumbers",
        },
        {
          title: "Upload Excel Inventory",
          path: "InventoryStaging",
          permissionKey: "inventoryStaging",
        },
      ],
    },
    {
      title: "Staff Access",
      Icon: FaUser,
      permissionKey: "users",
      dropdown: [
        { title: "Users", path: "users", permissionKey: "users" },
        {
          title: "User Permissions",
          path: "userRestriction",
          permissionKey: "userRestriction",
        },
      ],
    },
    {
      title: "Dashboard",
      path: "dashboard",
      Icon: FaChartBar,
      permissionKey: "dashboard",
    },

    {
      title: "PriceList Setup",
      path: "priceList-setup",
      Icon: FaClipboardList,
      permissionKey: "priceListSetup",
    },
    {
      title: "Colors",
      path: "colors",
      Icon: FaPalette,
      permissionKey: "colors",
    },
    {
      title: "Locations",
      path: "locations",
      Icon: FaMapMarkerAlt,
      permissionKey: "locations",
    },
    {
      title: "Products",
      path: "product-list",
      Icon: FaTags,
      permissionKey: "productList",
    },
    {
      title: "Customers",
      path: "customers",
      Icon: FaUserFriends,
      permissionKey: "customers",
    },
    {
      title: "Transactions",
      path: "transactions",
      Icon: FaChartBar,
      permissionKey: "transactions",
    },
    { title: "POS", path: "pos", Icon: FaCalculator, permissionKey: "pos" },
    {
      title: "Help & FAQ",
      path: "help-faq",
      Icon: FaQuestionCircle,
      // No permissionKey needed, everyone should see it
    },
  ];

  const isLoading = loadingAuth || (isLoggedIn && loadingPermissions);

  if (!isLoading && !isLoggedIn) {
    return <Navigate to="/signin" />;
  }

  const isSidebarExpanded = (isDesktop && open) || mobileOpen;

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleMenuClick = (menu) => {
    if (menu.title === "Logout") {
      logoutUser();
    } else if (menu.path) {
      navigate(`/admin/${menu.path}`);
      setOpenDropdown(null);
      if (!isDesktop) {
        setMobileOpen(false);
      }
    } else if (menu.dropdown) {
      toggleDropdown(menu.title);
    }
  };

  const logoutUser = () => {
    signOut(auth)
      .then(() => {
        toast.success("Logout Successfully.");
        dispatch(REMOVE_ACTIVE_USER());
        setRolePermissions(null);
        navigate("/signin");
      })
      .catch((error) => toast.error(error.message));
  };

  const canDisplayMenu = (menu) => {
    if (!rolePermissions && menu.permissionKey) return false;
    if (!menu.permissionKey && !menu.dropdown) return true;
    if (menu.dropdown) {
      return menu.dropdown.some(
        (subItem) =>
          !subItem.permissionKey || rolePermissions[subItem.permissionKey]
      );
    }
    return rolePermissions[menu.permissionKey];
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {mobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen overflow-y-auto bg-gray-900 text-gray-300 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 transition-all duration-300 
        ${
          isDesktop
            ? open
              ? "w-72"
              : "w-20"
            : mobileOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full"
        }
        `}
      >
        <div className="p-5 pt-8 relative h-full flex flex-col">
          {/* Desktop-only resize arrow */}
          {isDesktop && (
            <div
              className="absolute top-1/3 transform -translate-y-1/2 -right-[0.01rem] cursor-pointer w-6 h-6 bg-orange-500 border-dark-purple border-2 rounded-full flex items-center justify-center transition-all duration-300"
              onClick={() => setOpen(!open)}
            >
              {open ? <FaAngleLeft /> : <FaAngleRight />}
            </div>
          )}

          <div
            className={`flex items-center gap-x-4 ${
              !isSidebarExpanded && "justify-center"
            }`}
          >
            <img
              src={logo}
              alt="logo"
              className={`w-12 h-12 cursor-pointer transition-transform duration-500 ${
                isSidebarExpanded && "rotate-360"
              }`}
            />
            {isSidebarExpanded && (
              <h1 className="text-white font-medium text-lg whitespace-nowrap">
                Ichthus Technology
              </h1>
            )}
          </div>

          <div className="mt-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader />
              </div>
            ) : (
              isLoggedIn && (
                <div className="flex flex-col items-center text-center mt-4 space-y-2">
                  <img
                    src={imgUrl || "/default-avatar.png"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border border-gray-500 object-cover"
                  />
                  {isSidebarExpanded && (
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {fullName || "Unknown User"}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Menu Items */}
          <nav className="mt-6 flex-grow">
            {Menus.filter(canDisplayMenu).map((menu, index) => (
              <div key={index}>
                <div
                  onClick={() =>
                    menu.dropdown
                      ? toggleDropdown(menu.title)
                      : handleMenuClick(menu)
                  }
                  className={`flex justify-between items-center gap-x-4 p-2 cursor-pointer hover:bg-gray-700 rounded-md ${
                    location.pathname.includes(menu.path) ||
                    (menu.dropdown && openDropdown === menu.title)
                      ? "bg-gray-700"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-x-4">
                    <menu.Icon size={20} />
                    {isSidebarExpanded && (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {menu.title}
                      </span>
                    )}
                  </div>

                  {menu.dropdown && isSidebarExpanded && (
                    <span>
                      {openDropdown === menu.title ? (
                        <FaAngleDown />
                      ) : (
                        <FaAngleRight />
                      )}
                    </span>
                  )}
                </div>
                {menu.dropdown &&
                  openDropdown === menu.title &&
                  isSidebarExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {menu.dropdown
                        .filter((sub) => rolePermissions?.[sub.permissionKey])
                        .map((subItem, subIndex) => (
                          <div
                            key={subIndex}
                            onClick={() => handleMenuClick(subItem)}
                            className={`flex items-center gap-x-3 text-sm px-2 py-1 cursor-pointer hover:bg-gray-700 rounded-md ${
                              location.pathname.includes(subItem.path)
                                ? "bg-gray-700"
                                : ""
                            }`}
                          >
                            <span className="ml-1">•</span>
                            {subItem.title}
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          {isLoggedIn && (
            <div
              onClick={logoutUser}
              className="mt-auto flex items-center gap-x-4 p-2 cursor-pointer hover:bg-red-600 text-white bg-red-500 rounded-md"
            >
              <FaSignOutAlt size={20} />
              {isSidebarExpanded && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-grow p-4 transition-all duration-300 w-full overflow-y-auto`}
        style={{ marginLeft: isDesktop ? (open ? "18rem" : "5rem") : "0" }}
      >
        {/* Mobile-only hamburger menu */}
        {!isDesktop && (
          <button
            className="p-2 mb-4 text-gray-800"
            onClick={() => setMobileOpen(true)}
          >
            <FaBars size={24} />
          </button>
        )}
        {fetchFailed ? (
          <FetchFailedHelp /> // If fetch failed, show the help guide
        ) : isLoading ? (
          <Loader /> // Otherwise, if loading, show loader
        ) : (
          <Outlet /> // Finally, if everything is fine, show the page content
        )}
      </main>
    </div>
  );
};

export default Admin;
