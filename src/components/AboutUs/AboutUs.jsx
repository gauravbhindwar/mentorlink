"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaEnvelope, FaPhone } from "react-icons/fa";
import Image from "next/image";
import { Quicksand, Righteous } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
});

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const AboutUs = () => {
  const teamMembers = [
    {
      name: "Gaurav Kumar",
      role: "Developer",
      image: "/Peoples/Developer/gaurav.jpg",
      description: "Full Stack Developer",
      github: "https://github.com/gauravkumar",
      linkedin: "https://linkedin.com/in/gauravkumar",
      email: "bhindwargaurav@gmail.com",
      phone: "+91-9006045930",
    },
    {
      name: "Shivank Goel",
      role: "Developer",
      image: "/Peoples/Developer/shivank.png",
      description: "Full Stack Developer",
      github: "https://github.com/shivankgoel",
      linkedin: "https://linkedin.com/in/shivankgoel",
      email: "shivank.goel@muj.manipal.edu",
      phone: "+91-XXXXXXXXXX",
    },
    {
      name: "Garv Kundnani",
      role: "Developer",
      image: "/Peoples/Developer/garv.png",
      description: "Frontend Developer",
      github: "https://github.com/garvkundnani",
      linkedin: "https://linkedin.com/in/garvkundnani",
      email: "garv.kundnani@muj.manipal.edu",
      phone: "+91-XXXXXXXXXX",
    },
  ];

  const facultyMembers = [
    {
      name: "Dr. Neha Chaudhary",
      role: "Faculty Guide",
      image: "/Peoples/Faculty/Neha-Chaudhary.webp",
      description: "Computer Science Department",
      linkedin: "https://linkedin.com/in/nehachaudhary",
      email: "neha.chaudhary@muj.manipal.edu",
      phone: "+91-XXXXXXXXXX",
    },
    {
      name: "Dr. Amit Garg",
      role: "Faculty Guide",
      image: "/Peoples/Faculty/Amit-Garg.webp",
      description: "Computer Science Department",
      linkedin: "https://linkedin.com/in/amitgarg",
      email: "amit.garg@muj.manipal.edu",
      phone: "+91-XXXXXXXXXX",
    },
    {
      name: "Dr. Satpal Kushwaha",
      role: "Faculty Guide",
      image: "/Peoples/Faculty/Satpal-Singh.jpeg",
      description: "Computer Science Department",
      linkedin: "https://linkedin.com/in/satypalkushwaha",
      email: "satpal.kushwaha@muj.manipal.edu",
      phone: "+91-XXXXXXXXXX",
    },
  ];

  return (
    <div className='min-h-screen bg-[#0a0a0a] overflow-y-auto custom-slider relative top-16'>
      {/* Background Effects */}
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient' />
        <div className='absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl' />
        <div className='absolute inset-0 backdrop-blur-3xl' />
      </div>

      <div
        className={`relative z-10 container mx-auto px-4 ${quicksand.className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center py-8'>
          <h1
            className={`${righteous.className} text-5xl md:text-7xl font-normal bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-blue-500 mb-8 tracking-wide`}>
            About MentorLink
          </h1>
          <p className='text-gray-300 max-w-2xl mx-auto mb-12 text-xl font-light leading-relaxed'>
            A project developed under the Software Development Center (SDC),
            Department of Computer Science Engineering, Manipal University
            Jaipur.
          </p>
        </motion.div>
        {/* Faculty Section */}
        <h2
          className={`${righteous.className} text-3xl font-normal text-blue-400 text-center mb-8 tracking-wide`}>
          Faculty Guides
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-16'>
          {facultyMembers.map((faculty) => (
            <motion.div
              key={faculty.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className='bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-lg hover:shadow-blue-500/20 hover:bg-gray-800/90 transition-all border border-gray-700'>
              <div className='w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-blue-400/50 relative'>
                <Image
                  src={faculty.image}
                  alt={faculty.name}
                  fill
                  className='object-cover'
                />
              </div>
              <h3 className='text-lg font-semibold text-white text-center mb-1'>
                {faculty.name}
              </h3>
              <p className='text-blue-400 text-center text-sm mb-1'>
                {faculty.role}
              </p>
              <p className='text-gray-400 text-center text-sm mb-2'>
                {faculty.description}
              </p>
              <div className='flex flex-col items-center gap-2 text-sm'>
                <a
                  href={`mailto:${faculty.email}`}
                  className='text-gray-400 hover:text-blue-400 flex items-center gap-2'>
                  <FaEnvelope size={14} /> {faculty.email}
                </a>
                <a
                  href={`tel:${faculty.phone}`}
                  className='text-gray-400 hover:text-blue-400 flex items-center gap-2'>
                  <FaPhone size={14} /> {faculty.phone}
                </a>
                <a
                  href={faculty.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-400 hover:text-blue-300 mt-2'>
                  <FaLinkedin size={20} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Developers Section */}
        <h2
          className={`${righteous.className} text-3xl font-normal text-orange-400 text-center mb-8 tracking-wide`}>
          Development Team
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-16'>
          {teamMembers.map((member) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.02,
                rotateY: 5,
                transition: { duration: 0.3 },
              }}
              className='bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-lg hover:shadow-orange-500/20 hover:bg-gray-800/90 transition-all border border-gray-700'>
              <motion.div
                className='w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-orange-400/50 relative'
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}>
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className='object-cover'
                />
              </motion.div>
              <h3 className='text-lg font-semibold text-white text-center mb-1'>
                {member.name}
              </h3>
              <p className='text-orange-400 text-center text-sm mb-1'>
                {member.role}
              </p>
              <p className='text-gray-400 text-center text-sm mb-2'>
                {member.description}
              </p>
              <div className='flex flex-col items-center gap-2 text-sm'>
                <motion.a
                  whileHover={{ scale: 1.1, x: 3 }}
                  href={`mailto:${member.email}`}
                  className='text-gray-400 hover:text-orange-400 flex items-center gap-2'>
                  <FaEnvelope size={14} /> {member.email}
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1, x: 3 }}
                  href={`tel:${member.phone}`}
                  className='text-gray-400 hover:text-orange-400 flex items-center gap-2'>
                  <FaPhone size={14} /> {member.phone}
                </motion.a>
                <div className='flex gap-3 mt-2'>
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                    href={member.github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-400 hover:text-white'>
                    <FaGithub size={20} />
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                    href={member.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:text-blue-300'>
                    <FaLinkedin size={20} />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className='text-center py-6 border-t border-gray-800'>
          <p className='text-gray-400 text-sm tracking-wide font-light'>
            © {new Date().getFullYear()} MentorLink - Department of Computer
            Science Engineering, Manipal University Jaipur.
            <br />
            All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AboutUs;
