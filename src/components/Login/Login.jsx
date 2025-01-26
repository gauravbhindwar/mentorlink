"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Remove ReCAPTCHA import as v3 doesn't need a component

// Move loadReCaptchaScript outside component and modify it to return a promise
const loadReCaptchaScript = () => {
  return new Promise((resolve) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.grecaptcha.ready(() => {
        resolve();
      });
    };
    document.head.appendChild(script);
  });
};

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState(""); // Initialize with empty string instead of undefined
  const [emailError, setEmailError] = useState("");
  const [sendOTPSuccess, setSendOTPSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVerifyHovered, setIsVerifyHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [roles, setRoles] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);

  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        await loadReCaptchaScript();
        setIsRecaptchaLoaded(true);
      } catch (error) {
        console.error('Failed to load reCAPTCHA:', error);
      }
    };
    
    initRecaptcha();

    // Cleanup
    return () => {
      // Remove the script when component unmounts
      const scripts = document.querySelectorAll(`script[src*="recaptcha"]`);
      scripts.forEach(script => script.remove());
    };
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && sendOTPSuccess) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown, sendOTPSuccess]);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!regex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Only show validation error if user has started typing
    if (newEmail) {
      setEmailError(validateEmail(newEmail));
    } else {
      setEmailError("");
    }
  };
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove any non-digits
    if (value.length <= 6) {
      // Only allow up to 6 digits
      setOTP(value);
    }
  };

  // Update executeCaptcha function
  const executeCaptcha = async () => {
    if (!isRecaptchaLoaded || !window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded');
    }

    try {
      const token = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY, {
        action: 'submit'
      });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution error:', error);
      throw new Error('Security verification failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);
    try {
      const captchaToken = await executeCaptcha();
      if (!captchaToken) {
        throw new Error('Security verification failed');
      }

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          captchaToken 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.message || "Error sending OTP");
        setSendOTPSuccess(false);
      }
      if (data.success) {
        setEmailError("");
        setSendOTPSuccess(true);
        setCountdown(50); // Start timer when OTP is first sent
        setCanResend(false);
        // console.log("OTP sent successfully");
      }
    } catch (error) {
      setEmailError(error.message || 'Security verification failed. Please try again.');
      setSendOTPSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleResendOTP to include captcha
  const handleResendOTP = async () => {
    setIsLoading(true);
    setCanResend(false);
    setCountdown(50); // Reset timer to 50 seconds

    try {
      const captchaToken = await executeCaptcha();
      if (!captchaToken) {
        throw new Error('Security verification failed');
      }

      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          captchaToken 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.message || "Error resending OTP");
      }
      if (data.success) {
        setEmailError("");
        setSendOTPSuccess(true);
      }
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      setVerifySuccess(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.message || "Error verifying OTP");
        setVerifySuccess(false);
      }
      if (data.success) {
        setOtpError("");
        setVerifySuccess(true);
        // Store role and email in session storage
        if (data.role && data.role.length > 1) {
          sessionStorage.setItem("UserRole", data.role);
        }
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("mujid", data.MUJid);
        // Handle role-based navigation
        if (data.role.length > 1) {
          setRoles(data.role);
        } else {
          // Single role - direct redirect using router
          switch (data.role[0]) {
            case "admin":
              router.push("/pages/admin/admindashboard");
              break;
            case "mentor":
              router.push("/pages/mentordashboard");
              break;
            default:
              setOtpError("Invalid role assigned");
          }
        }
      } else {
        setOtpError(data.message || "Invalid OTP");
      }
    } catch (error) {
      setOtpError(error.message);
      setVerifySuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full flex flex-col items-center justify-center min-w-screen gap-14'>
      {!verifySuccess ? (
        <>
          <form onSubmit={handleSubmit} className='w-full max-w-2xl px-4'>
            <div className='flex flex-col gap-6'> {/* Added flex-col and gap */}
              <div className='flex gap-4 items-center'>
                <div className='flex-1 max-w-[400px] relative'>
                  <label
                    htmlFor='email'
                    className={`absolute left-4 transition-all duration-300 pointer-events-none
                  ${
                    isFocused || email
                      ? "-translate-y-7 text-sm text-orange-500"
                      : "translate-y-3 text-gray-400"
                  }`}
                    style={{
                      transformOrigin: "0 0",
                    }}>
                    Enter your email
                  </label>
                  <input
                    id='email'
                    type='email'
                    value={email}
                    disabled={sendOTPSuccess}
                    onChange={handleEmailChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full px-4 py-3 rounded-lg bg-transparent border 
                  ${emailError ? "border-red-500" : "border-gray-300"}
                  ${
                    sendOTPSuccess
                      ? "border-green-500 bg-slate-800 opacity-60"
                      : ""
                  }
                  text-white focus:outline-none focus:ring-2 
                  ${emailError ? "focus:ring-red-500" : "focus:ring-orange-500"}
                  transition-all duration-300`}
                    required
                  />
                  {emailError && (
                    <span className='absolute left-0 -bottom-6 text-red-500 text-sm'>
                      {emailError}
                    </span>
                  )}
                  {sendOTPSuccess && (
                    <span className='absolute left-0 -bottom-6 text-green-500 text-sm'>
                      OTP sent successfully
                    </span>
                  )}
                </div>
                {!sendOTPSuccess && (
                  <button
                    type='submit'
                    disabled={isLoading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className='relative px-6 py-3 !text-white rounded-lg transition-all duration-300 
              disabled:opacity-50 hover:scale-102 active:scale-90 transform
              after:absolute before:inset-0 after:rounded-lg after:p-[1px] after:opacity-0
              after:bg-gradient-to-r after:from-orange-500 after:to-purple-500
              before:absolute after:inset-[1px] before:rounded-lg before:bg-transparent before:border before:border-white after:transition-opacity
              hover:after:opacity-100 after:duration-300'>
                    {isLoading ? (
                      <span className='flex items-center justify-center relative z-10'>
                        <svg
                          className='animate-spin h-5 w-5 mr-3'
                          viewBox='0 0 24 24'>
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                            fill='none'
                          />
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span
                        className={`relative z-10 flex items-center gap-2 ${
                          isHovered ? "text-white" : "text-gray-300 mx-3"
                        }`}>
                        <span>Continue</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isHovered ? "translate-x-1 opacity-100" : "hidden"
                          }`}
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {sendOTPSuccess && (
            <form
              onSubmit={handleVerifySubmit}
              className='w-full max-w-2xl px-4'>
              <div className='flex flex-col gap-4'>
                <div className='flex gap-4 items-center'>
                  <div className='flex-1 max-w-[400px] relative'>
                    <label
                      htmlFor='otp'
                      className={`absolute left-4 transition-all duration-300 pointer-events-none
                ${
                  isFocused || otp
                    ? "-translate-y-7 text-sm text-orange-500"
                    : "translate-y-3 text-gray-400"
                }`}
                      style={{
                        transformOrigin: "0 0",
                      }}>
                      Enter OTP
                    </label>
                    <input
                      id='otp'
                      type='text' // Changed from 'otp' to 'text'
                      value={otp}
                      onChange={handleOTPChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className={`w-full px-4 py-3 rounded-lg bg-transparent border 
                ${emailError ? "border-red-500" : "border-gray-300"}
                text-white focus:outline-none focus:ring-2 
                ${emailError ? "focus:ring-red-500" : "focus:ring-orange-500"}
                transition-all duration-300`}
                      required
                    />
                    {otpError && (
                      <span className='absolute left-0 -bottom-6 text-red-500 text-sm'>
                        {otpError}
                      </span>
                    )}
                  </div>
                  <button
                    type='submit'
                    disabled={isLoading}
                    onMouseEnter={() => setIsVerifyHovered(true)}
                    onMouseLeave={() => setIsVerifyHovered(false)}
                    className='relative px-6 py-3 !text-white rounded-lg transition-all duration-300 
                    disabled:opacity-50 hover:scale-102 active:scale-90 transform
                    after:absolute before:inset-0 after:rounded-lg after:p-[1px] after:opacity-0
                    after:bg-gradient-to-r after:from-orange-500 after:to-purple-500
                    before:absolute after:inset-[1px] before:rounded-lg before:bg-transparent before:border before:border-white after:transition-opacity
                    hover:after:opacity-100 after:duration-300'>
                    {isLoading ? (
                      <span className='flex items-center justify-center relative z-10'>
                        <svg
                          className='animate-spin h-5 w-5 mr-3'
                          viewBox='0 0 24 24'>
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                            fill='none'
                          />
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span
                        className={`relative z-10 flex items-center gap-2 ${
                          isVerifyHovered ? "text-white" : "text-gray-300 mx-3"
                        }`}>
                        <span>Verify</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isVerifyHovered
                              ? "translate-x-1 opacity-100"
                              : "hidden"
                          }`}
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                <button
                  type='button'
                  disabled={!canResend || isLoading || countdown > 0}
                  onClick={handleResendOTP}
                  className={`self-start ml-1 text-sm flex items-center gap-2 transition-all duration-300
                    ${
                      countdown > 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-orange-500 hover:text-orange-400"
                    }
                  `}>
                  {countdown > 0 ? (
                    <>
                      <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                          fill='none'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      <span>Resend OTP in {countdown}s</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      ) : roles.length > 1 ? (
        <div className='flex flex-col items-center gap-6 relative'>
          <h2 className='text-white text-2xl'>Select your dashboard</h2>
          <div className='flex gap-6'>
            <div
              onClick={() => {
                sessionStorage.setItem("role", "admin");
                router.push("/pages/admin/admindashboard");
              }}
              className='cursor-pointer p-6 rounded-lg border border-gray-300 hover:border-orange-500 active:border-blue-600 active:bg-blue-500 transition-all relative '>
              <h3 className='text-white text-xl mb-2'>Admin Dashboard</h3>
              <p className='text-gray-400'>Manage mentors/mentees</p>
            </div>

            <div
              onClick={() => {
                sessionStorage.setItem("role", "mentor");
                router.push("/pages/mentordashboard");
              }}
              className='cursor-pointer p-6 rounded-lg border border-gray-300 hover:border-orange-500 active:border-blue-600 active:scale-90 active:bg-blue-500 transition-all relative'>
              <h3 className='text-white text-xl mb-2'>Mentor Dashboard</h3>
              <p className='text-gray-400'>Manage meetings</p>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500'></div>
        </div>
      )}
    </div>
  );
};

export default Login;
