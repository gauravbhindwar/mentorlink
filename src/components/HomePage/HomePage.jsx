"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from 'next/image';
import Login from '@/components/Login/Login';

// Create a separate component to use useSearchParams
const TokenVerifier = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let token;
    try {
      token = searchParams.get("token") || sessionStorage.getItem("accessToken");
    } catch (e) {
      console.error("Error retrieving token:", e);
      // Check environment to decide whether to redirect or show login
      const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
      if (env === 'local') {
        setShowLogin(true);
        setIsLoading(false);
        return;
      } else {
        window.location.href = "https://sdcmuj.com";
        return;
      }
    }
    
    if (!token) {
      console.warn("No token found in URL");
      // Check environment to decide whether to redirect or show login
      const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
      if (env === 'local') {
        setShowLogin(true);
        setIsLoading(false);
        return;
      } else {
        window.location.href = "https://sdcmuj.com";
        return;
      }
    }

    const verifyToken = async (router) => {
      setIsLoading(true);

      let token;

      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get("token") || sessionStorage.getItem("accessToken");
      }

      if (!token) {
        console.error(" No token found in URL or session. Redirecting to login...");
        window.location.href = "https://sdcmuj.com";
        // window.location.href = process.env.ADMINPANEL_URL || "http://localhost:3001/"
        return;
      }

      console.log(" Token Found:", token);

      try {
        console.log(" Verifying token with backend...");

        const response = await axios.post("/api/auth/verify-otp", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) {
          console.error(" Role verification failed:", response.data.message);
          // Check environment to decide whether to redirect or show login
          const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
          if (env === 'local') {
            setShowLogin(true);
            setIsLoading(false);
          }
          return;
        }

        let role;
        if (response.data.role.includes("admin")) {
          role = "admin";
        } else if (response.data.role.includes("mentor")) {
          role = "mentor";
        }

        console.log(" Role Verified:", role);

        sessionStorage.setItem("accessToken", token);
        sessionStorage.setItem("role", role);
        sessionStorage.setItem("email", response.data.email);

        const mentorResponse = await axios.get("/api/mentor", {
          params: { MUJId: response.data.MUJid, email: response.data.email },
        });

        const mentorInfo = mentorResponse.data;
        if (mentorInfo) {
          sessionStorage.setItem("mentorData", JSON.stringify(mentorInfo));
        }

        if (response.data.role.includes("admin")) {
          router.push("/pages/admin/admindashboard");
        } else if (response.data.role.includes("mentor")) {
          router.push("/pages/mentordashboard");
        } else {
          console.error(" Unknown Role:", role);
        }
      } catch (error) {
        console.error(" Error verifying token:", error);

        if (error.response?.status === 401) {
          console.warn("⚠️ Invalid token detected. Clearing session and redirecting to login...");
          sessionStorage.clear();
          // Check environment to decide whether to redirect or show login
          const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
          if (env === 'local') {
            setShowLogin(true);
            setIsLoading(false);
            return;
          } else {
            window.close();
          }
        }
        console.error("Redirecting to SDCMUJ website...");
        // Check environment to decide whether to redirect or show login
        const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
        if (env === 'local') {
          setShowLogin(true);
          setIsLoading(false);
        } else {
          window.location.href = "https://sdcmuj.com";
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken(router);
  }, [router, searchParams]);

  return (
    <div className="relative z-10 flex justify-center items-center min-h-screen">
      {isLoading ? (
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      ) : showLogin ? (
        <Login />
      ) : (
        <h1 className="text-white text-xl">Redirecting...</h1>
      )}
    </div>
  );
};

// Main component with Suspense boundary
const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src='/MUJ-homeCover.jpg'
          alt='MUJ Campus'
          fill
          className='object-cover opacity-20 mix-blend-overlay'
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={
        <div className="relative z-10 flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
        </div>
      }>
        <TokenVerifier />
      </Suspense>
    </div>
  );
};

export default HomePage;

