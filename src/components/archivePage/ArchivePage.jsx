"use client";
import { useState } from "react";
import Navbar from "<@/components/subComponents/NavbarNewNew";
import { motion } from "framer-motion";
import YearSessionSelector from "./archiveComponents/YearSessionSelector";
import ArchiveResults from "./archiveComponents/ArchiveResults";

const ArchivePage = () => {
  const [searchParams, setSearchParams] = useState(null);

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 h-screen flex flex-col pt-[60px]">
        <motion.div 
          className="flex items-center justify-between px-4 lg:px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mt-5 mb-2">
            Archive Center
          </h1>
        </motion.div>

        <div className="flex-1 grid grid-cols-[400px,1fr] gap-4 p-4 h-[calc(100vh-100px)]">
          <motion.div 
            className="h-full w-[400px]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <YearSessionSelector onSearch={handleSearch} />
          </motion.div>

          {searchParams && (
            <motion.div
              className="h-full min-w-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ArchiveResults searchParams={searchParams} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
