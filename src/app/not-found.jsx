'use client';

import dynamic from 'next/dynamic';
import Link from "next/link";
import Navbar from "@/components/subComponents/Navbar";
import notFoundAnimation from "../assets/animations/404.json";

const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => <div className="w-[300px] h-[300px] animate-pulse bg-gray-700 rounded-lg" />
});

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100">
        <div className="w-[300px] h-[300px]">
          <Lottie
            animationData={notFoundAnimation}
            loop={true}
            className="w-full h-full"
          />
        </div>
        <p className="text-xl font-bold select-none text-gray-300">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-lg font-bold shadow-lg hover:from-purple-700 hover:to-blue-700 hover:scale-105 active:scale-90 transition duration-300 select-none"
          >
            Go Back
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-lg font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-90 transition duration-300 select-none"
          >
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
