"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiChevronDown,
  FiLogOut,
  FiGrid,
  FiInfo,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import { FaUserShield } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { usePathname, useRouter } from "next/navigation";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState({
    name: "Guest",
    email: "",
    initial: "G",
    roles: [],
  });
  const [currentRole, setCurrentRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    const roles = JSON.parse(sessionStorage.getItem("userRoles") || "[]");
    setCurrentRole(role);
    setIsLoaded(true);

    const mentorData = JSON.parse(sessionStorage.getItem("mentorData") || "{}");
    const userName = sessionStorage.getItem("userName");
    setUser({
      name: mentorData.name || userName || "Guest",
      email: mentorData.email || sessionStorage.getItem("userEmail") || "",
      initial: (mentorData.name?.[0] || userName?.[0] || "G").toUpperCase(),
      roles: roles,
    });
  }, [router, pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add this new useEffect to close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  // Don't render navbar on root route or before client-side load
  if (!isLoaded) {
    return null;
  }

  // Show basic navbar for non-logged-in users on certain pages
  const showBasicNavbar = !currentRole && (pathname === "/" || pathname === "/about");

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call the logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear client-side storage
      sessionStorage.clear();
      localStorage.clear();

      // Close the dialog
      setShowLogoutDialog(false);

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback to client-side logout
      sessionStorage.clear();
      localStorage.clear();
      setShowLogoutDialog(false);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };  const handleRoleSwitch = async () => {
    const roles = JSON.parse(sessionStorage.getItem("userRoles") || "[]");
    
    if (roles.includes("mentor") && roles.includes("admin")) {
      setIsSwitchingRole(true);
      
      // Add a small delay for animation
      setTimeout(() => {
        if (pathname.includes("/mentor")) {
          sessionStorage.setItem("userRole", "admin");
          setCurrentRole("admin");
          router.replace("/pages/admin/admindashboard");
        } else {
          sessionStorage.setItem("userRole", "mentor");
          setCurrentRole("mentor");
          router.replace("/pages/mentordashboard");
        }
        setIsSwitchingRole(false);
      }, 800);
    }
  };

  const generateBreadcrumbs = () => {
    if (pathname === "/pages/mentordashboard") {
      return [{ label: "Mentor Dashboard", path: "/pages/mentordashboard" }];
    }
    if (pathname === "/pages/viewmentee") {
      return [
        { label: "Mentor Dashboard", path: "/pages/mentordashboard" },
        { label: "View Mentee", path: "/pages/viewmentee" },
      ];
    }
    if (pathname === "/pages/meetings/schmeeting") {
      return [
        { label: "Mentor Dashboard", path: "/pages/mentordashboard" },
        { label: "Schedule Meeting", path: "/pages/meetings/schmeeting" },
      ];
    }
    if (pathname === "/pages/mentordashboard/consolidatedReport") {
      return [
        { label: "Mentor Dashboard", path: "/pages/mentordashboard" },
        {
          label: "Consolidated Report",
          path: "/pages/mentordashboard/consolidatedReport",
        },
      ];
    }
    if (pathname === "/pages/mentordashboard/faq") {
      return [
        { label: "Mentor Dashboard", path: "/pages/mentordashboard" },
        {
          label: "FAQs",
          path: "/pages/mentordashboard/faq",
        },
      ];
    }
    if (pathname === "/pages/admin/admindashboard") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
      ];
    }
    if (pathname === "/pages/admin/managementee") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        { label: "Manage Mentees", path: "/pages/admin/managementee" },
      ];
    }
    if (pathname === "/pages/admin/managemeeting") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        { label: "Manage Meetings", path: "/pages/admin/managemeeting" },
      ];
    }
    if (pathname === "/pages/admin/managementor") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        { label: "Manage Mentors", path: "/pages/admin/managementor" },
      ];
    }
    if (pathname === "/pages/admin/mngacademicsession") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        {
          label: "Manage Academic Session",
          path: "/pages/admin/mngacademicsession",
        },
      ];
    }
    if (pathname === "/archives") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        {
          label: "Archives",
          path: "/archives",
        },
      ];
    }
    if (pathname === "/pages/meetings/mreport") {
      return [
        { label: "Admin Dashboard", path: "/pages/admin/admindashboard" },
        {
          label: "Manage Meetings",
          path: "/pages/admin/managemeeting",
        },
        {
          label: "Meeting Reports",
          path: "/pages/meetings/mreport",
        },
      ];
    }
    if (pathname === "/about") {
      return [
        {
          label: `${currentRole === "mentor" ? "Mentor" : "Admin"} Dashboard`,
          path: `${
            currentRole === "mentor"
              ? "/pages/mentordashboard"
              : "/pages/admin/admindashboard"
          }`,
        },
        {
          label: "About Us",
          path: "/about",
        },
      ];
    }
    return [{ label: "Home", path: "/" }];
  };

  const getRoleDetails = () => {
    if (currentRole === "admin") {
      return {
        icon: <FaUserShield className="h-5 w-5" />,
        color: "bg-red-500 hover:bg-red-600",
        label: "Admin",
      };
    }
    return {
      icon: <FiUser className="h-5 w-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      label: "Mentor",
    };
  };

  if (currentRole) {
    return (
      <nav className="bg-[#0a0a0a] border-b border-orange-500/20 fixed w-full top-0 left-0 max-w-[100vw] z-[100]">
        {/* Enhanced Background Effects */}
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10' />
          <div className='absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>
        <div className="max-w-[90vw] px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-auto"
                  src="/muj-logo.svg"
                  alt="Primary Logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
              <div className="flex-shrink-0 hidden md:block">
                <img
                  className="h-12 w-auto"
                  src="/sdc-logo.webp"
                  alt="Secondary Logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
            </div>

            <div className="hidden md:block flex-1 px-8">
              <div className="flex justify-center">
                <nav className="flex items-center space-x-1" aria-label="Breadcrumb">
                  {generateBreadcrumbs().map((item, index) => (
                    <div key={index} className="flex items-center">
                      {index !== 0 && (
                        <svg
                          className="flex-shrink-0 h-4 w-4 text-orange-400/80 mx-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <a
                        href={item.path}
                        className={`${
                          index !== generateBreadcrumbs().length - 1 ||
                          generateBreadcrumbs().length == 1
                            ? "text-orange-100 hover:text-white hover:bg-orange-500/10"
                            : "text-orange-200"
                        } px-3 py-2 rounded-lg text-base font-semibold transition-all duration-200 flex items-center gap-2 ${
                          index !== generateBreadcrumbs().length - 1 ||
                          generateBreadcrumbs().length == 1
                            ? "hover:scale-105"
                            : "bg-orange-500/20"
                        }`}
                      >
                        {index !== generateBreadcrumbs().length - 1 && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 text-orange-400"
                          >
                            <path d="M9 11L5 7L9 3" />
                            <path d="M5 7h9a5 5 0 1 1 0 10H7" />
                          </svg>
                        )}
                        {item.label}
                      </a>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            <div className="relative z-[1000000]" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 rounded-full pr-3 pl-1 py-1 transition-all duration-200 ease-in-out border border-transparent hover:border-orange-500/40 bg-black/20 backdrop-blur-sm"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${
                    getRoleDetails().color
                  } transition-colors duration-200 shadow-lg`}
                >
                  {getRoleDetails().icon}
                </div>
                <span className="text-orange-100 text-sm hidden sm:block font-medium">
                  {user.name}
                </span>
                <FiChevronDown
                  className={`text-orange-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-xl shadow-2xl py-2 bg-gray-900 border border-orange-500/30 backdrop-blur-xl transform origin-top-right scale-100 transition-all duration-300 z-[1000001] overflow-hidden">
                  <div className="px-5 py-4 border-b border-orange-500/20">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div
                          className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                            getRoleDetails().color
                          } shadow-lg`}
                        >
                          {user.initial}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                          {React.cloneElement(getRoleDetails().icon, { className: "h-3 w-3 text-white" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-orange-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-orange-200/70 truncate">
                          {user.email}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {getRoleDetails().label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    {user.roles && user.roles.length >= 2 && (
                      <button
                        onClick={handleRoleSwitch}
                        disabled={isSwitchingRole}
                        className="flex w-full items-center px-5 py-3 text-sm text-orange-100 hover:bg-orange-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSwitchingRole ? (
                          <AiOutlineLoading3Quarters className="mr-3 h-5 w-5 text-orange-400 animate-spin" />
                        ) : (
                          <FiGrid className="mr-3 h-5 w-5 text-orange-400" />
                        )}
                        {isSwitchingRole ? "Switching..." : `Switch to ${pathname.includes("/mentor") ? "Admin" : "Mentor"}`}
                      </button>
                    )}

                    <a
                      href="/about"
                      className="flex items-center px-5 py-3 text-sm text-orange-100 hover:bg-orange-500/10 transition-all duration-200"
                    >
                      <FiInfo className="mr-3 h-5 w-5 text-orange-400" />
                      About Us
                    </a>

                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="flex w-full items-center px-5 py-3 text-sm text-red-300 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-red-400" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showLogoutDialog}
          onClose={() => !isLoggingOut && setShowLogoutDialog(false)}
          onConfirm={handleLogout}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmButtonText="Logout"
          cancelButtonText="Cancel"
          loading={isLoggingOut}
        />
      </nav>
    );
  }

  // Show basic navbar for non-logged-in users
  if (showBasicNavbar) {
    return (
      <nav className="bg-[#0a0a0a] border-b border-orange-500/20 fixed w-full top-0 left-0 max-w-[100vw] z-[100]">
        {/* Enhanced Background Effects */}
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10' />
          <div className='absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>
        <div className="max-w-[90vw] px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-auto"
                  src="/muj-logo.svg"
                  alt="Primary Logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
              <div className="flex-shrink-0 hidden md:block">
                <img
                  className="h-12 w-auto"
                  src="/sdc-logo.webp"
                  alt="Secondary Logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {pathname === "/about" ? (
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2 text-orange-100 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-purple-500/10 rounded-lg transition-all duration-200 font-medium border border-orange-500/20 hover:border-orange-500/40"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <Link 
                  href="/about"
                  className="flex items-center gap-2 px-4 py-2 text-orange-100 hover:text-white hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-purple-500/10 rounded-lg transition-all duration-200 font-medium border border-orange-500/20 hover:border-orange-500/40"
                >
                  <FiInfo className="w-4 h-4" />
                  About Us
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return null;
};

export default Navbar;
