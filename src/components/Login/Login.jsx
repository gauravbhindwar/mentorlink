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
import { motion } from "framer-motion"; // For animations
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff } from "lucide-react"; // Icons for show/hide
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
  const [showOtp, setShowOtp] = useState(false);
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
          toast.success("OTP sent successfully");
          setOtpSent(true);
          setResendEnabled(false);
          setTimer(60);
        } else {
          toast.error(response.data.message || "Error sending OTP. Please try again later.");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error sending OTP");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        // Verify OTP
        const verifyResponse = await axios.post("/api/auth/verify-otp", {
          email: email,
          role: role,
          otp: otp,
        });

        if (!verifyResponse.data.success) {
          toast.error(verifyResponse.data.message || "OTP verification failed");
          setLoading(false);
          return;
        }

        // Sign in with credentials
        const result = await signIn("credentials", {
          email,
          role,
          otp,
          redirect: false,
        });

        if (result?.ok) {
          toast.success("Login successful!");
          
          // Store session data
          sessionStorage.setItem('email', email);
          sessionStorage.setItem('role', role);
          if (verifyResponse.data?.mujid) {
            sessionStorage.setItem('mujid', verifyResponse.data.mujid);
          }

          // Redirect based on role
          const dashboardPath = 
            role === "mentor" ? "/pages/mentordashboard" :
            role === "mentee" ? "/pages/menteedashboard" :
            "/pages/admindashboard";

          router.push(dashboardPath);
        } else {
          toast.error(result?.error || "Login failed");
        }
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           "Error during authentication";
        toast.error(errorMessage);
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
          toast.success("OTP resent successfully");
          setResendEnabled(false);
          setTimer(60);
        } else {
          toast.error("Error resending OTP");
        }
      } catch {
        toast.error("Error resending OTP");
      } finally {
        setLoading(false); // Set loading to false
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col mt-20 gap-6 items-center justify-center text-center"
    >
      <ToastContainer position="bottom-right" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 md:p-8"
      >
        <Image 
          src="/muj-logo.svg" 
          alt="MUJ Logo" 
          width={150} 
          height={150} 
          style={{ width: "auto", height: "auto" }} 
        />
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold">
                    Enter Your Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative w-full">
                      <Input
                        {...field}
                        placeholder="Email"
                        type={showEmail ? "text" : "email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        name="email"
                        className="w-full py-2 px-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        disabled={otpSent} // Disable email input after OTP sent
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-500"
                        onClick={() => setShowEmail((prev) => !prev)}
                      >
                        {showEmail ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {otpSent && (
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      One-Time Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <InputOTP
                          maxLength={6}
                          {...field}
                          value={otp}
                          onChange={handleOtpChange}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                        <button
                          type="button"
                          className="absolute right-2 top-2 text-gray-500"
                          onClick={() => setShowOtp((prev) => !prev)}
                        >
                          {showOtp ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2 md:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg transition-all duration-300 ease-in-out"
            >
              {loading ? "Processing..." : otpSent ? "Verify OTP" : "Send OTP"}
            </Button>

            {otpSent && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  type="button"
                  disabled={!resendEnabled || loading}
                  variant={resendEnabled && !loading ? "primary" : "disabled"}
                  onClick={handleResendOtp}
                  className="px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ease-in-out"
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
      </motion.div>
    </motion.div>
  );
};

export default Login;
