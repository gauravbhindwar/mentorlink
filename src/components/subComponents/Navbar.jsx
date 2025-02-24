"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiLogOut, FiGrid, FiInfo, FiUser, FiShield } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    const role = sessionStorage.getItem("role");
    setCurrentRole(role);
    setIsLoaded(true);

    const mentorData = JSON.parse(sessionStorage.getItem("mentorData") || "{}");
    setUser({
      name: mentorData.name || "Guest",
      email: mentorData.email,
      initial: (mentorData.name?.[0] || "G").toUpperCase(),
      roles: mentorData.role || [],
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
  if (pathname === "/" || !isLoaded) {
    return null;
  }

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    try {
      // Call the logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear client-side storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback to client-side logout
      sessionStorage.clear();
      localStorage.clear();
      router.push('/');
    }
  };

  const handleRoleSwitch = () => {
    const currentRole = sessionStorage.getItem("role");
    if (currentRole === "mentor") {
      sessionStorage.setItem("role", "admin");
      router.push("/pages/admin/admindashboard");
    } else {
      sessionStorage.setItem("role", "mentor");
      router.push("/pages/mentordashboard");
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
          label: `${user.roles === "mentor" ? "Mentor" : "Admin"} Dashboard`,
          path: `${
            user.roles === "mentor"
              ? "/pages/mentordashboard"
              : "/pages/admin/admindashboard"
          }`,
        },
        {
          label: "Manage Meetings",
          path: "/pages/admin/managemeeting",
        },
      ];
    }
    return [{ label: "Home", path: "/" }];
  };

  const getRoleDetails = () => {
    if (currentRole === 'admin') {
      return {
        icon: <FiShield className="h-5 w-5" />,
        color: 'bg-red-500 hover:bg-red-600',
        label: 'Admin'
      };
    }
    return {
      icon: <FiUser className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      label: 'Mentor'
    };
  };

  if (currentRole) {
    return (
      <nav className='bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-pink-500/10 border-b border-orange-200/20 absolute w-full max-w-[100vw] z-[100]'>
        <div className='max-w-[90vw] px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16 items-center'>
            <div className='flex items-center space-x-4'>
              <div className='flex-shrink-0'>
                <img
                  className='h-12 w-auto'
                  src='/muj-logo.svg'
                  alt='Primary Logo'
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
              <div className='flex-shrink-0 hidden md:block'>
                <img
                  className='h-12 w-auto'
                  src='/sdc-logo.webp'
                  alt='Secondary Logo'
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9";
                  }}
                />
              </div>
            </div>

            <div className='hidden md:block flex-1 px-8'>
              <div className='flex justify-center'>
                <nav className='flex' aria-label='Breadcrumb'>
                  {generateBreadcrumbs().map((item, index) => (
                    <div key={index} className='flex items-center'>
                      {index !== 0 && (
                        <svg
                          className='flex-shrink-0 h-5 w-5 text-gray-400'
                          viewBox='0 0 20 20'
                          fill='currentColor'>
                          <path
                            fillRule='evenodd'
                            d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                      <a
                        href={item.path}
                        className={`${
                          index === generateBreadcrumbs().length - 1
                            ? "text-gray-300 hover:text-gray-100"
                            : "text-gray-500 hover:text-gray-400"
                        } ml-2 text-sm font-medium`}>
                        {item.label}
                      </a>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            <div className='relative z-[1000000]' ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 rounded-full pr-3 pl-1 py-1 transition-all duration-200 ease-in-out border border-transparent hover:border-orange-500/30"
                aria-label='User menu'
                aria-expanded={isDropdownOpen}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${getRoleDetails().color} transition-colors duration-200`}>
                  {getRoleDetails().icon}
                </div>
                <span className="text-gray-300 text-sm hidden sm:block">{user.name}</span>
                <FiChevronDown className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ring-1 ring-orange-500/20 backdrop-blur-sm transform origin-top scale-y-100 transition-all duration-200">
                  <div className="px-4 py-3 border-b border-orange-500/20">
                    <div className="flex items-center space-x-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getRoleDetails().color}`}>
                        {getRoleDetails().icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-100">{user.name}</p>
                        <p className="text-xs text-orange-200/60">{user.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                          {getRoleDetails().label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {user.roles && user.roles.length >= 2 && (
                      <button
                        onClick={handleRoleSwitch}
                        className="flex w-full items-center px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10 transition-colors duration-150">
                        <FiGrid className="mr-3 h-5 w-5 text-orange-400" />
                        Switch to {currentRole === "mentor" ? "Admin" : "Mentor"}
                      </button>
                    )}

                    <a
                      href="/about"
                      className="flex items-center px-4 py-2 text-sm text-orange-100 hover:bg-orange-500/10 transition-colors duration-150">
                      <FiInfo className="mr-3 h-5 w-5 text-orange-400" />
                      About Us
                    </a>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors duration-150">
                      <FiLogOut className="mr-3 h-5 w-5 text-red-400" />
                      Logout
                    </button>
                  </div>
                </div>
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
