"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, delay, motion } from "framer-motion";
import Link from "next/link";

export default function NavbarNew() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedRole = sessionStorage.getItem("role");
        const storedEmail = sessionStorage.getItem("email");

        if (storedEmail) setEmail(storedEmail);
        if (storedRole) setRole(storedRole);
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        setRole("");
        setEmail("");
        router.push("/");
    };

    const handleDashboard = () => {
        if (role === "admin" || role === "superadmin") {
            router.push("/pages/admin/admindashboard");
        } else if (role === "mentor") {
            router.push("/pages/mentordashboard");
        } else if (role === "mentee") {
            router.push("/pages/menteedashboard");
        } else {
            router.push("/"); // Default dashboard
        }
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        // desktop menu
        <nav className=" fixed top-0 z-50 h-16 w-full bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-pink-500/10 backdrop-blur-md border-b border-orange-200/20 flex justify-between items-center px-6">
            <div className="left-col hidden md:block">
                {role && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="hidden md:flex items-center text-sm px-3 py-1.5 rounded-lg
                                     bg-orange-500/10 hover:bg-orange-500/20
                                     border border-orange-200/20 hover:border-orange-200/40
                                     text-white/90 font-medium transition-all duration-300"
                        onClick={handleDashboard}
                    >
                        {role === "admin" || role === "superadmin"
                            ? "Admin Dashboard"
                            : `${
                                  role.charAt(0).toUpperCase() + role.slice(1)
                              } Dashboard`}
                    </motion.button>
                )}
            </div>
            <div className="middle-col">
                <motion.div
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-[#fa8634] rounded-md px-5 py-2 transition-all duration-300 ease-in-out"
                >
                    <Image
                        src="/muj-logo.svg"
                        alt="MUJ Logo"
                        className="h-8 w-auto filter"
                        width={52}
                        height={2}
                        priority
                    />
                </motion.div>
            </div>
            <div className="right-col flex justify-between items-center">
                {/* SDC Logo */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative bg-white/5 p-1.5 rounded-xl backdrop-blur-md shadow-md px-6 py-2 transition-all duration-200 ease-in-out"
                >
                    <Image
                        src="/sdc-logo-black.webp"
                        alt="SDC Logo"
                        className="h-8 w-[auto] filter drop-shadow-lg "
                        width={32}
                        height={32}
                        priority
                    />
                </motion.div>

                {/* Hamburger Menu */}
                <button
                    onClick={toggleMenu}
                    className="ml-4 md:flex flex-col items-center justify-center w-10 h-10 bg-white/5 p-1.5 rounded-xl backdrop-blur-md shadow-md transition-all duration-200 ease-in-out"
                >
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white mb-1"></span>
                    <span className="block w-6 h-0.5 bg-white"></span>
                </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                {menuOpen && (
                    <>
                        <motion.div
                            className="z-20 h-screen w-screen top-0 left-0 absolute bg-slate-900/80"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ duration: 0.25 }}
                            style={{ width: "min(70vw, 24em)" }}
                            className="absolute top-0 h-screen right-0 bg-slate-900 flex flex-col items-center py-4 opacity-50 z-30"
                        >
                            <button
                                className="absolute top-8 right-8"
                                onClick={toggleMenu}
                            >
                                <span className="block w-6 h-0.5 bg-white mb-1 rotate-45 translate-y-0.5"></span>
                                <span className="block w-6 h-0.5 bg-white -rotate-45 -translate-y-1 "></span>
                            </button>

                            <div className="pt-16 flex flex-col items-center gap-5 text-white text-md md:text-lg">
                                <span className="  border-white md:pb-2 underline underline-offset-8 text-md md:text-xl ">
                                    {email}
                                </span>
                                <Link
                                    href="/about"
                                    className="relative text-white group"
                                >
                                    About Us
                                    <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0" />
                                </Link>
                                {role === "admin" && (
                                    <button
                                        onClick={(e) =>
                                            router.push(
                                                "/pages/admin/admindashboard"
                                            )
                                        }
                                        className="relative group"
                                    >
                                        Admin Dashboard
                                        <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0" />
                                    </button>
                                )}
                                {(role === "admin" || role === "mentor") && (
                                    <button
                                        onClick={(e) =>
                                            router.push(
                                                "/pages/mentordashboard"
                                            )
                                        }
                                        className="relative group"
                                    >
                                        Mentor Dashboard
                                    <span className="absolute left-1/2 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full group-hover:left-0" />

                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
}
