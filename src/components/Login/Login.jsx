"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion"; // Add AnimatePresence to imports
import "react-toastify/dist/ReactToastify.css";
import { signIn } from "next-auth/react";
import Image from 'next/image';

const FormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  pin: z
    .string()
    .min(6, { message: "Your one-time password must be 6 characters." }),
});

const Login = ({ role }) => {

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      pin: "",
    },
  });

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();

  useEffect(() => {
    if (otpSent) {
      const countdown = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      if (timer === 0) {
        setResendEnabled(true);
        clearInterval(countdown);
      }

      return () => clearInterval(countdown);
    }
  }, [otpSent, timer]);

  const showToast = {
    success: (message) => toast.success(message, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      className: "toast-success",
      bodyClassName: "toast-body",
      style: {
        background: "linear-gradient(to right, #f97316, #ea580c)",
        color: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)",
      },
    }),
    error: (message) => toast.error(message, {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      className: "toast-error",
      bodyClassName: "toast-body",
      style: {
        background: "#ffffff",
        color: "#f97316",
        border: "2px solid #f97316",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.1)",
      },
    })
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!otpSent) {
      try {
        const response = await axios.post("/api/auth/send-otp", {
          email: email,
          role: role,
        }); 
        if (response.status === 200) {
          showToast.success("OTP sent successfully");
          setOtpSent(true);
          setResendEnabled(false);
          setTimer(60);
        } else {
          showToast.error(response.data.message || "Error sending OTP. Please try again later.");
        }
      } catch (error) {
        showToast.error(error.response?.data?.message || "Error sending OTP");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        // Verify OTP first
        const verifyResponse = await axios.post("/api/auth/verify-otp", {
          email: email,
          role: role,
          otp: otp,
        });

        if (!verifyResponse.data.success) {
          showToast.error(verifyResponse.data.message || "OTP verification failed");
          setOtp(""); // Just clear the OTP input, don't reset otpSent
          setLoading(false);
          return;
        }

        // Sign in with credentials after successful verification
        const result = await signIn("credentials", {
          email,
          role,
          otp,
          redirect: false,
        });

        if (result?.ok) {
          showToast.success("Login successful!");
          
          // Store session data with role from verification response
          const sessionData = {
            email,
            role: verifyResponse.data.role || role,
            mujid: verifyResponse.data.mujid
          };

          // Store session data
          Object.entries(sessionData).forEach(([key, value]) => {
            if (value) sessionStorage.setItem(key, value);
          });

          // Redirect based on role from verification response
          const dashboardPath = {
            'mentor': "/pages/mentordashboard",
            'mentee': "/pages/menteedashboard",
            'admin': "/pages/admin/admindashboard",
            'superadmin': "/pages/admin/admindashboard"
          }[sessionData.role] || "/";

          router.push(dashboardPath);
        } else {
          showToast.error(result?.error || "Login failed");
          setOtp(""); // Just clear the OTP input, don't reset otpSent
        }
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Error during authentication";
        showToast.error(errorMessage);
        setOtp(""); // Just clear the OTP input, don't reset otpSent
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
  };

  const handleResendOtp = async () => {
    if (resendEnabled) {
      setLoading(true); // Set loading to true
      try {
        const response = await axios.post("/api/auth/send-otp", {
          email: email,
          role: role,
        });
        if (response.status === 200) {
          showToast.success("OTP resent successfully");
          setResendEnabled(false);
          setTimer(60);
        } else {
          showToast.error("Error resending OTP");
        }
      } catch {
        showToast.error("Error resending OTP");
      } finally {
        setLoading(false); // Set loading to false
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 99999
        }}
        toastStyle={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          position: 'relative',
          transform: 'none !important',
          transition: 'opacity 0.3s ease-in-out !important'
        }}
        className="!fixed !bottom-4 !right-4"
        progressStyle={{
          background: 'linear-gradient(to right, #f97316, #ea580c)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col md:flex-row gap-4 items-center justify-center text-center"
      >
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          height: otpSent ? "420px" : "320px" // Reduced from 480px to 420px
        }}
        transition={{ 
          duration: 0.5,
          height: {
            duration: 0.4,
            ease: "easeInOut"
          }
        }}
        className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 md:p-12 flex flex-col justify-center overflow-hidden"
      >
        <div className="space-y-6">
          <Image 
            src="/muj-logo.svg" 
            alt="MUJ Logo" 
            width={150} 
            height={150} 
            style={{ width: "auto", height: "auto" }} 
            className="mx-auto mb-4"
          />
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <motion.div 
                        className="relative w-full"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                          duration: 0.6 
                        }}
                      >
                        <div className="relative h-14">
                          <Input
                            {...field}
                            placeholder="Enter your email address"
                            type={showEmail ? "text" : "email"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            name="email"
                            className={`
                              w-full h-full pr-4 mr-8
                              text-base
                              rounded-2xl
                              border-[1.5px] border-orange-300
                              focus:border-orange-500 focus:ring-1 focus:ring-orange-500
                              transition-all duration-200
                              bg-white
                              shadow-sm hover:shadow-md
                              disabled:bg-gray-100 disabled:border-gray-300
                              disabled:cursor-not-allowed
                              motion-reduce:transition-none
                              placeholder:text-gray-400
                              placeholder:transition-all
                              placeholder:duration-200
                              focus:placeholder:opacity-0
                              focus:placeholder:-translate-y-10
                              ${email ? 'border-orange-500 bg-orange-50/30 placeholder:opacity-0' : ''}
                            `}
                            disabled={otpSent}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                          </div>
                        </div>
                      </motion.div>
                    </FormControl>
                    <FormMessage className="text-orange-500 mt-1 text-sm" />
                  </FormItem>
                )}
              />

              <AnimatePresence mode="wait">
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeInOut",
                      opacity: { duration: 0.2 },
                      height: { duration: 0.3 }
                    }}
                  >
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <FormLabel className="text-gray-700 font-semibold text-lg mb-4">
                              One-Time Password
                            </FormLabel>
                          </motion.div>
                          <FormControl>
                            <div className="relative flex justify-center w-full">
                              <InputOTP
                                maxLength={6}
                                {...field}
                                value={otp}
                                onChange={handleOtpChange}
                                separator={
                                  <span className="text-orange-400 text-2xl mx-2 animate-pulse">•</span>
                                }
                                className="gap-3"
                              >
                                <InputOTPGroup className="gap-2 flex justify-center"> 
                                  {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <InputOTPSlot
                                      key={index}
                                      index={index}
                                      className={`
                                        w-10 h-10  // Reduced from w-14 h-14 to w-10 h-10
                                        text-center text-xl font-bold  // Reduced text size from 2xl to xl
                                        rounded-lg
                                        border-2 border-orange-200
                                        focus:border-orange-500 focus:ring-2 focus:ring-orange-400
                                        transition-all duration-300
                                        transform hover:scale-105
                                        bg-gradient-to-b from-white to-orange-50
                                        shadow-md hover:shadow-orange-200
                                        placeholder:text-orange-300
                                        ${otp[index] ? 'border-orange-400 scale-105' : ''}
                                        motion-safe:animate-pop-in
                                      `}
                                      placeholder="_"
                                      style={{
                                        animationDelay: `${index * 100}ms`,
                                      }}
                                    />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-2 md:py-3 rounded-full 
                  bg-gradient-to-r from-orange-400 to-orange-600 
                  hover:from-orange-500 hover:to-orange-700
                  text-white shadow-lg 
                  transition-all duration-300 ease-in-out
                  transform hover:scale-105 active:scale-95
                  ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-xl'}
                `}
              >
                {loading ? "Processing..." : otpSent ? "Verify OTP" : "Send OTP"}
              </Button>

              {otpSent && (
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    type="button"
                    disabled={!resendEnabled || loading}
                    onClick={handleResendOtp}
                    className={`
                      px-4 py-2 rounded-md text-sm font-semibold
                      transition-all duration-300 ease-in-out
                      transform hover:scale-105 active:scale-95
                      ${resendEnabled && !loading 
                        ? 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : resendEnabled ? (
                      "Resend OTP"
                    ) : (
                      <span className="flex items-center">
                        Resend OTP in <span className="font-mono mx-1">{timer}s</span>
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </div>
      </motion.div>
    </motion.div>
    </div>
  );
};

export default Login;
