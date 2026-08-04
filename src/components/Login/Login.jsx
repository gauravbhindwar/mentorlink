"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaKey, FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdPassword, MdEmail } from "react-icons/md";
import { validatePassword, getPasswordStrength } from "@/utils/passwordValidation";

const EMAIL_DOMAINS = [
  'jaipur.manipal.edu',
  'muj.manipal.edu'
];

const loadReCaptchaScript = () => {
  return new Promise((resolve) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [authMode, setAuthMode] = useState("password");
  const [step, setStep] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] });
  
  const [isLoading, setIsLoading] = useState(false);
  const [sendOTPSuccess, setSendOTPSuccess] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const otpInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    loadReCaptchaScript().then(() => {
      setIsRecaptchaLoaded(true);
    }).catch(err => {
      console.error("Failed to load reCAPTCHA:", err);
    });
  }, []);

  // Hide email suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emailInputRef.current && !emailInputRef.current.contains(event.target)) {
        setShowEmailSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && sendOTPSuccess) {
      setCanResend(true);
    }
  }, [countdown, sendOTPSuccess]);

  useEffect(() => {
    if (sendOTPSuccess && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [sendOTPSuccess]);

  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [newPassword]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Show email domain suggestions when @ is typed
    if (value.includes('@')) {
      setShowEmailSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowEmailSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
    
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleEmailKeyDown = (e) => {
    if (!showEmailSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < EMAIL_DOMAINS.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : EMAIL_DOMAINS.length - 1
      );
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const username = email.split('@')[0];
      const selectedDomain = EMAIL_DOMAINS[selectedSuggestionIndex];
      setEmail(`${username}@${selectedDomain}`);
      setShowEmailSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Escape') {
      setShowEmailSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const executeCaptcha = async () => {
    try {
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: 'submit' }
      );
      return token;
    } catch (error) {
      console.error("reCAPTCHA error:", error);
      return null;
    }
  };

  const checkUserPasswordStatus = async (email) => {
    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return data.hasPassword;
    } catch (error) {
      console.error("Error checking password status:", error);
      return false;
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsLoading(true);
    try {
      const hasPassword = await checkUserPasswordStatus(email);
      
      if (authMode === "password" && !hasPassword) {
        // Send OTP for password setup
        const captchaToken = await executeCaptcha();
        
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, captchaToken }),
        });

        const data = await response.json();
        if (data.success) {
          setSendOTPSuccess(true);
          setCountdown(60);
          setCanResend(false);
          setStep("passwordOtpVerify");
        } else {
          setEmailError(data.message || "Failed to send OTP");
        }
        setIsLoading(false);
        return;
      }

      if (authMode === "otp") {
        const captchaToken = await executeCaptcha();
        // Proceed even if captchaToken is null

        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, captchaToken }),
        });

        const data = await response.json();
        if (data.success) {
          setSendOTPSuccess(true);
          setCountdown(60);
          setCanResend(false);
          setStep("auth");
        } else {
          setEmailError(data.message || "Failed to send OTP");
        }
      } else {
        setStep("auth");
      }
    } catch {
      setEmailError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const captchaToken = await executeCaptcha();
      // Proceed even if captchaToken is null

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await response.json();
      if (data.success) {
        setCountdown(60);
        setCanResend(false);
        setOtpError("");
      } else {
        setOtpError(data.message || "Failed to resend OTP");
      }
    } catch {
      setOtpError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      const captchaToken = await executeCaptcha();
      
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await response.json();
      if (data.success) {
        setIsForgotPassword(true);
        setSendOTPSuccess(true);
        setCountdown(60);
        setCanResend(false);
        setStep("passwordOtpVerify");
        setPassword("");
        setPasswordError("");
      } else {
        setPasswordError(data.message || "Failed to send OTP");
      }
    } catch {
      setPasswordError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordOtpVerify = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setStep("createPassword");
        setOtpError("");
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch {
      setOtpError("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      
      if (authMode === "otp") {
        if (!otp || otp.length !== 6) {
          setOtpError("Please enter a valid 6-digit OTP");
          setIsLoading(false);
          return;
        }

        response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
      } else {
        if (!password) {
          setPasswordError("Please enter your password");
          setIsLoading(false);
          return;
        }

        response = await fetch("/api/auth/login-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (data.needsPasswordSetup && authMode === "otp") {
          setNeedsPasswordSetup(true);
          setStep("createPassword");
          setIsLoading(false);
          return;
        }

        sessionStorage.setItem("accessToken", data.token || "authenticated");
        sessionStorage.setItem("userRole", Array.isArray(data.role) ? data.role[0] : data.role);
        sessionStorage.setItem("userRoles", JSON.stringify(data.role));
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userMUJId", data.MUJid || data.mujid);
        sessionStorage.setItem("userName", data.name || "Guest");

        setVerifySuccess(true);

        setTimeout(() => {
          if (data.role.includes("mentor")) {
            router.push("/pages/mentordashboard");
          } else if (data.role.includes("admin")) {
            router.push("/pages/admin/admindashboard");
          } else {
            router.push("/");
          }
        }, 1000);
      } else {
        if (authMode === "otp") {
          setOtpError(data.message || "Invalid OTP");
        } else {
          setPasswordError(data.message || "Invalid password");
        }
      }
    } catch {
      if (authMode === "otp") {
        setOtpError("An error occurred during verification");
      } else {
        setPasswordError("An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();

    if (!passwordValidation.isValid) {
      setPasswordError("Please fix all password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isForgotPassword ? "/api/auth/reset-password" : "/api/auth/create-password";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword, otp }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("accessToken", data.token || "authenticated");
        sessionStorage.setItem("userRole", Array.isArray(data.role) ? data.role[0] : data.role);
        sessionStorage.setItem("userRoles", JSON.stringify(data.role));
        sessionStorage.setItem("userEmail", email);
        sessionStorage.setItem("userMUJId", data.MUJid || data.mujid);
        sessionStorage.setItem("userName", data.name || "Guest");

        setVerifySuccess(true);

        setTimeout(() => {
          if (data.role.includes("mentor")) {
            router.push("/pages/mentordashboard");
          } else if (data.role.includes("admin")) {
            router.push("/pages/admin/admindashboard");
          } else {
            router.push("/");
          }
        }, 1000);
      } else {
        setPasswordError(data.message || "Failed to create password");
      }
    } catch {
      setPasswordError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength(newPassword);
    if (strength === 'strong') return 'text-green-500';
    if (strength === 'medium') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center w-full p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-block p-4 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full mb-4">
              <FaLock className="text-3xl text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Sign in to your account</h2>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div key="email-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex gap-2 mb-6 p-1 bg-gray-800/50 rounded-lg">
                  <button type="button" onClick={() => setAuthMode("otp")} className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${authMode === "otp" ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
                    <MdEmail /><span>OTP</span>
                  </button>
                  <button type="button" onClick={() => setAuthMode("password")} className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center gap-2 ${authMode === "password" ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
                    <MdPassword /><span>Password</span>
                  </button>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <div className="relative" ref={emailInputRef}>
                      <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={handleEmailChange}
                        onKeyDown={handleEmailKeyDown}
                        className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" 
                        placeholder="Enter your email" 
                        required 
                      />
                      {showEmailSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                          {EMAIL_DOMAINS.map((domain, index) => {
                            const username = email.split('@')[0];
                            const suggestion = `${username}@${domain}`;
                            return (
                              <div
                                key={index}
                                className={`px-4 py-2 text-white hover:bg-gray-700 cursor-pointer text-sm ${
                                  index === selectedSuggestionIndex ? 'bg-orange-600' : ''
                                }`}
                                onClick={() => {
                                  setEmail(suggestion);
                                  setShowEmailSuggestions(false);
                                  setSelectedSuggestionIndex(-1);
                                }}
                              >
                                {suggestion}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {emailError && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2 flex items-center gap-1"><FaTimesCircle /> {emailError}</motion.p>}
                  </div>

                  <motion.button type="submit" disabled={isLoading || !isRecaptchaLoaded} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Processing...</span></div>) : (<span>{authMode === "otp" ? "Send OTP" : "Continue"}</span>)}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === "auth" && (
              <motion.div key="auth-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <button onClick={() => { setStep("email"); setSendOTPSuccess(false); setOTP(""); setPassword(""); }} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors">← Back to email</button>

                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  {authMode === "otp" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Enter OTP</label>
                      <div className="relative">
                        <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input ref={otpInputRef} type="text" value={otp} onChange={(e) => { const value = e.target.value.replace(/\D/g, "").slice(0, 6); setOTP(value); setOtpError(""); }} maxLength={6} className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="000000" required />
                      </div>
                      {otpError && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2 flex items-center gap-1"><FaTimesCircle /> {otpError}</motion.p>}
                      <div className="mt-4 text-center">
                        {countdown > 0 ? (<p className="text-gray-400 text-sm">Resend OTP in {countdown}s</p>) : (<button type="button" onClick={handleResendOTP} disabled={!canResend || isLoading} className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Resend OTP</button>)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                      <div className="relative">
                        <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }} className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Enter your password" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                      </div>
                      {passwordError && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2 flex items-center gap-1"><FaTimesCircle /> {passwordError}</motion.p>}
                      <div className="mt-2 text-right">
                        <button type="button" onClick={handleForgotPassword} disabled={isLoading} className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors disabled:opacity-50">Forgot password?</button>
                      </div>
                    </div>
                  )}

                  <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Verifying...</span></div>) : (<span>Verify & Login</span>)}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === "passwordOtpVerify" && (
              <motion.div key="password-otp-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <button onClick={() => { setStep("email"); setSendOTPSuccess(false); setOTP(""); setIsForgotPassword(false); }} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors">← Back to email</button>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{isForgotPassword ? "Reset Your Password" : "Set Up Your Password"}</h3>
                  <p className="text-gray-400 text-sm">Enter the OTP sent to your email</p>
                </div>

                <form onSubmit={handlePasswordOtpVerify} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enter OTP</label>
                    <div className="relative">
                      <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input ref={otpInputRef} type="text" value={otp} onChange={(e) => { const value = e.target.value.replace(/\D/g, "").slice(0, 6); setOTP(value); setOtpError(""); }} maxLength={6} className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="000000" required />
                    </div>
                    {otpError && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2 flex items-center gap-1"><FaTimesCircle /> {otpError}</motion.p>}
                    <div className="mt-4 text-center">
                      {countdown > 0 ? (<p className="text-gray-400 text-sm">Resend OTP in {countdown}s</p>) : (<button type="button" onClick={handleResendOTP} disabled={!canResend || isLoading} className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Resend OTP</button>)}
                    </div>
                  </div>

                  <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Verifying...</span></div>) : (<span>Verify OTP</span>)}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === "createPassword" && (
              <motion.div key="password-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{isForgotPassword ? "Create New Password" : needsPasswordSetup ? "Set Up Your Password" : "Create Your Password"}</h3>
                  <p className="text-gray-400 text-sm">{isForgotPassword ? "Choose a new password different from your old one" : "Create a strong password to secure your account"}</p>
                </div>

                <form onSubmit={handleCreatePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Create a strong password" required />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">{showNewPassword ? <FaEyeSlash /> : <FaEye />}</button>
                    </div>

                    {newPassword && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: getPasswordStrength(newPassword) === 'strong' ? '100%' : getPasswordStrength(newPassword) === 'medium' ? '66%' : '33%' }} className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword) === 'strong' ? 'bg-green-500' : getPasswordStrength(newPassword) === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                        <p className={`text-xs mt-1 capitalize ${getPasswordStrengthColor()}`}>Strength: {getPasswordStrength(newPassword)}</p>
                      </div>
                    )}

                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        {passwordValidation.errors.map((error, index) => (<motion.p key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-xs flex items-center gap-2"><FaTimesCircle className="flex-shrink-0" /><span>{error}</span></motion.p>))}
                        {passwordValidation.isValid && (<motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-green-400 text-xs flex items-center gap-2"><FaCheckCircle className="flex-shrink-0" /><span>Password meets all requirements</span></motion.p>)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" placeholder="Re-enter your password" required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2 flex items-center gap-1"><FaTimesCircle /> Passwords do not match</motion.p>)}
                    {confirmPassword && newPassword === confirmPassword && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-green-400 text-sm mt-2 flex items-center gap-1"><FaCheckCircle /> Passwords match</motion.p>)}
                  </div>

                  {passwordError && (<motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm flex items-center gap-1"><FaTimesCircle /> {passwordError}</motion.p>)}

                  <motion.button type="submit" disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Creating Password...</span></div>) : (<span>Create Password & Continue</span>)}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {verifySuccess && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm rounded-2xl">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-block p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
                    <FaCheckCircle className="text-5xl text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                  <p className="text-gray-300">Redirecting to dashboard...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-gray-800">
        <p className="text-gray-300 text-sm tracking-wide font-light">
          © {new Date().getFullYear()} MentorLink - Department of Computer
          Science Engineering, Manipal University Jaipur.
          <br />
          All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;
