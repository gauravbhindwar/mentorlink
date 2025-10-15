"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronUp, FiHelpCircle } from "react-icons/fi";

const FAQPage = () => {
    const [openItems, setOpenItems] = useState(new Set());

    const toggleItem = (index) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };
    const faqData = [
        {
            question: "How do I edit mentee details?",
            answer: "To edit mentee details, follow these steps:\n1. Navigate to Mentor Dashboard\n2. Click on 'View Mentee'\n3. Use the search functionality to find the specific mentee\n4. Click on the ✏️ (edit) icon in the Actions column next to the mentee's name\n5. In the dialog box that opens, click on the ✏️ icon at the top right corner\n6. Edit the required details in the form\n7. Click 'Save Changes' to apply your modifications",
        },
        {
            question: "How do I schedule a meeting?",
            answer: "To schedule a meeting, follow these steps:\n1. Navigate to Mentor Dashboard\n2. Click on 'Schedule Meeting'\n3. Select the semester and a list of your mentees will appear\n4. Enter the meeting details including topic, date and time, mode (online/offline), and venue or meeting link\n5. Click on 'Schedule Meeting' to confirm\n6. All selected mentees will automatically receive an email with the meeting details",
        },
        {
            question: "How do I submit my meeting reports?",
            answer: "To submit meeting reports, follow these steps:\n  1. Navigate to Mentor Dashboard\n  2. Go to the right column under 'Manage Meetings' section\n  3. Select the semester\n  4. Locate the desired meeting\n  5. Click on 'Submit Report'\n  6. Fill out the form with meeting details\n  7. Mark meeting attendance\n  8. Submit the report\n\nNote: The 'Manage Meetings' section is only visible if there are scheduled meetings, and the 'Submit Report' option will only appear after the meeting has been held (when the scheduled meeting time has passed).",
        },
        {
            question: "How do I download my meeting reports?",
            answer: "To download meeting reports, follow these steps:\n  1. Navigate to Mentor Dashboard\n  2. Go to the right column under 'Manage Meetings' section\n  3. Select the semester\n  4. Locate the desired meeting\n  5. Click on 'Download MOM Report'\n\nNote: The download report option is only visible if the meeting report has already been submitted.",
        },
        {
            question: "How do I generate a consolidated report?",
            answer: "To generate a consolidated report, follow these steps:\n  1. Navigate to Mentor Dashboard\n  2. Click on 'Consolidated Meeting Report'\n  3. Select the semester from the top right dropdown\n  4. Click on 'Download PDF Report' located right below the semester selector\n\nNote: This option will only be visible after reports for at least 3 meetings for the selected semester have been submitted.",
        },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-4 md:px-6 pt-20 pb-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8 mb-8"
                >
                    <motion.div
                        className="flex items-center justify-center gap-3 mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <FiHelpCircle className="text-3xl md:text-4xl text-orange-500" />
                        <motion.h1
                            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Frequently Asked Questions
                        </motion.h1>
                    </motion.div>
                    <motion.p
                        className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Find answers to common questions about mentor dashboard
                        features
                    </motion.p>
                </motion.div>

                {/* FAQ Container */}
                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                        {faqData.map((item, index) => (
                            <motion.div
                                key={index}
                                className="border-b border-white/5 last:border-b-0"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                            >
                                <button
                                    className="w-full px-6 py-6 text-left hover:bg-white/5 transition-all duration-300 focus:outline-none focus:bg-white/5"
                                    onClick={() => toggleItem(index)}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg md:text-xl font-semibold text-white pr-4">
                                            {item.question}
                                        </h3>
                                        <motion.div
                                            animate={{
                                                rotate: openItems.has(index)
                                                    ? 180
                                                    : 0,
                                                scale: openItems.has(index)
                                                    ? 1.1
                                                    : 1,
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className="flex-shrink-0"
                                        >
                                            {openItems.has(index) ? (
                                                <FiChevronUp className="text-orange-500 text-xl" />
                                            ) : (
                                                <FiChevronDown className="text-orange-500 text-xl" />
                                            )}
                                        </motion.div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {openItems.has(index) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeInOut",
                                            }}
                                            className="overflow-hidden"
                                        >
                                            {" "}
                                            <div className="px-0 pb-6">
                                                <motion.div
                                                    initial={{
                                                        y: -10,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        y: 0,
                                                        opacity: 1,
                                                    }}
                                                    exit={{
                                                        y: -10,
                                                        opacity: 0,
                                                    }}
                                                    transition={{ delay: 0.1 }}
                                                    className="bg-gradient-to-r from-orange-500/10 to-transparent p-3 rounded-lg border-l-4 border-orange-500"
                                                >
                                                    {" "}
                                                    <p className="text-gray-300 leading-relaxed text-base md:text-lg whitespace-pre-line">
                                                        {item.answer}
                                                    </p>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* Additional Help Section */}
                    {/* <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Still have questions?
                            </h3>
                            <p className="text-gray-300 mb-4">
                                If you can't find the answer you're looking for,
                                feel free to contact the admin team.
                            </p>
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow:
                                        "0 0 20px rgba(249, 115, 22, 0.4)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:from-orange-600 hover:to-pink-600"
                            >
                                Contact Support
                            </motion.button>
                        </div>
                    </motion.div> */}
                </motion.div>
            </div>
        </div>
    );
};

export default FAQPage;