"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import YearSessionSelector from "./archiveComponents/YearSessionSelector";
import ArchiveResults from "./archiveComponents/ArchiveResults";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { ArchiveDataProvider } from '@/context/ArchiveDataContext';
import dynamic from 'next/dynamic';
import searchAnimation from '@/assets/animations/searchData.json';

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const ArchivePage = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const resizeRef = useRef(null);

  // Add useEffect for initial load
  useEffect(() => {
    // Simulate minimal loading time to prevent FOUC
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      // Calculate new width with boundaries
      const newWidth = Math.min(Math.max(e.clientX, 250), 600);
      setSidebarWidth(newWidth);
      
      // Prevent text selection while resizing
      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className='fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden'>
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
          <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>
      </div>
    );
  }

  return (
    <ArchiveDataProvider>
      <div className='fixed inset-0 bg-[#0a0a0a] text-white md:overflow-hidden overflow-auto'>
        <div className='absolute inset-0 z-0'>
          <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
          <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
          <div className='absolute inset-0 backdrop-blur-3xl' />
        </div>

        <div className='relative z-10 min-h-screen md:h-screen flex flex-col md:flex-row pt-[60px]'>
          {/* Mobile Session Selector - Always visible */}
          <div className='block md:hidden px-4 py-2'>
            <YearSessionSelector onSearch={handleSearch} isMobile={true} />
          </div>

          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='relative h-[calc(100vh-60px)] hidden md:block'
                style={{ width: sidebarWidth }}
              >
                <div className="h-full p-4 opacity-100">
                  <YearSessionSelector onSearch={handleSearch} />
                </div>
                
                {/* Enhanced resizer handle */}
                <div
                  ref={resizeRef}
                  onMouseDown={startResizing}
                  className={`absolute top-0 right-0 h-full w-[6px] group
                            flex items-center justify-center cursor-col-resize
                            transition-all duration-300 z-50
                            before:content-[''] before:absolute before:inset-y-0 
                            before:left-1/2 before:-translate-x-1/2 before:w-[6px] 
                            before:opacity-0 before:transition-all before:duration-300
                            before:bg-orange-500/20
                            hover:before:opacity-100 hover:w-[12px]
                            ${isResizing ? 'w-[12px] before:opacity-100 before:bg-orange-500/40' : ''}`}
                >
                  <div className={`absolute inset-y-[15%] left-1/2 w-[2px] h-[70%] 
                                rounded-full transition-all duration-300
                                bg-orange-500/20 -translate-x-1/2
                                group-hover:bg-orange-500/60 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.6)]
                                ${isResizing ? 'bg-orange-500/80 shadow-[0_0_16px_rgba(249,115,22,0.8)]' : ''}`} 
                  />
                  
                  {/* Enhanced grip dots */}
                  <div className={`flex flex-col gap-1.5 transition-all duration-300
                                 opacity-60 group-hover:opacity-100 group-hover:gap-2
                                 ${isResizing ? 'gap-2 opacity-100' : ''}`}>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-[2px] h-[2px] rounded-full 
                                 transition-all duration-300
                                 bg-orange-500/40 group-hover:bg-orange-500
                                 group-hover:w-[3px] group-hover:h-[3px]
                                 ${isResizing ? 'w-[3px] h-[3px] bg-orange-500' : ''}
                                 hover:scale-150`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='relative flex-1 min-w-0 h-[calc(100vh-60px)] p-4'>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className='absolute -left-3 top-3 z-50 bg-orange-500 hover:bg-orange-600 
                        text-white p-1.5 rounded-md shadow-lg transition-all duration-200 
                        hover:scale-105 active:scale-95 cursor-pointer hidden md:block'
            >
              {isSidebarOpen ? <IoChevronBack size={16} /> : <IoChevronForward size={16} />}
            </button>

            <motion.div
              initial={false}
              animate={{
                marginLeft: isSidebarOpen ? "0.5rem" : "1rem",
              }}
              transition={{ duration: 0.3 }}
              className='h-full'
            >
              {searchParams ? (
                <ArchiveResults searchParams={searchParams} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-64 h-64">
                    {typeof window !== 'undefined' && (
                      <Lottie
                        animationData={searchAnimation}
                        loop={true}
                        autoplay={true}
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-400">Select Academic Details</h3>
                  <p className="mt-2 text-sm text-gray-500">Choose the academic year and session to view archived data</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {isResizing && (
          <div 
            className="fixed inset-0 z-50 bg-transparent cursor-col-resize"
            style={{ pointerEvents: 'all' }}
          />
        )}
      </div>
    </ArchiveDataProvider>
  );
};

export default ArchivePage;
