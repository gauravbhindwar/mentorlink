"use client";
import React, { useEffect, useState } from "react";
import Login from "../Login/Login";
import AboutUs from "../AboutUs/AboutUs";

const HomePage = () => {
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const numberOfStars = 50;

      for (let i = 0; i < numberOfStars; i++) {
        newStars.push({
          id: i,
          left: `${Math.random() * 100}%`,
          size: Math.random() * 3 + 1,
          delay: Math.random() * 5,
          duration: Math.random() * 3 + 2,
          opacity: Math.random() * 0.7 + 0.3,
        });
      }

      setStars(newStars);
    };

    generateStars();

    const handleResize = () => {
      generateStars();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 20,
      y: (e.clientY / window.innerHeight) * 20,
    });
  };

  // Add ESC key handler
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        setShowAboutUs(false);
      }
    };

    if (showAboutUs) {
      window.addEventListener("keydown", handleEscKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [showAboutUs]);

  return (
    <div
      className='fixed inset-0 bg-gradient-to-b from-slate-900 to-black overflow-hidden'
      onMouseMove={handleMouseMove}>
      <button
        onClick={() => setShowAboutUs(true)}
        className='fixed top-4 right-4 z-50 px-6 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm tracking-wide shadow-lg'>
        About Us
      </button>

      {/* About Us Sliding Panel */}
      {showAboutUs && (
        <>
          <div
            onClick={() => setShowAboutUs(false)}
            className='fixed inset-0 bg-black/50 z-40 transition-opacity duration-300'
          />
          <div
            className={`fixed top-0 h-full bg-transparent z-50 overflow-y-auto custom-scrollbar w-[70%] transition-all duration-500 ease-in-out ${
              showAboutUs ? "right-0" : "-right-[70%]"
            }`}>
            <button
              onClick={() => setShowAboutUs(false)}
              className='absolute top-6 right-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white hover:text-gray-300 transition-all text-3xl font-light border border-gray-600/50'>
              ×
            </button>
            <AboutUs />
          </div>
        </>
      )}

      {stars.map((star) => (
        <div
          key={star.id}
          className='absolute rounded-full bg-white animate-falling-star'
          style={{
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `falling ${star.duration}s linear infinite`,
            animationDelay: `${star.delay}s`,
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      ))}

      <div className='relative z-10 h-full flex flex-col items-center justify-center'>
        <div className='text-center mb-12'>
          <img
            src='/muj-logo.svg'
            alt='MUJ Logo'
            className='mx-auto w-80 mb-8'
          />
          <h1 className='text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-500 mb-4'>
            Mentorlink
          </h1>
          <p className='text-gray-400 text-sm md:text-base tracking-wider uppercase'>
            By Software Development Center
          </p>
        </div>

        <Login />
      </div>

      <style jsx>{`
        @keyframes falling {
          0% {
            transform: translateY(-10vh) rotate(45deg);
          }
          100% {
            transform: translateY(110vh) rotate(45deg);
          }
        }

        .animate-falling-star {
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.8),
            0 0 8px rgba(255, 255, 255, 0.6);
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-falling-star {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div
        className='absolute w-0.5 h-0.5 bg-white animate-shooting-star'
        style={{
          left: "10%",
          top: "20%",
          animation: "shooting 4s linear infinite",
          animationDelay: "2s",
        }}>
        <div className='w-8 h-0.5 bg-gradient-to-r from-white via-white to-transparent transform -rotate-45' />
      </div>

      <style jsx>{`
        @keyframes shooting {
          0% {
            transform: translate(0, 0) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: translate(100vw, 100vh) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
