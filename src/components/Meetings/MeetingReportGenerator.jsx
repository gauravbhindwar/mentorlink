'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';

const MeetingReportGenerator = () => {
  const [filters, setFilters] = useState({
    year: '',
    term: '',
    semester: '',
    section: ''
  });
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isMOMDialogOpen, setIsMOMDialogOpen] = useState(false);
  const [isConsolidateDialogOpen, setIsConsolidateDialogOpen] = useState(false);
  const [momDetails, setMomDetails] = useState({
    date: '',
    attendees: '',
    agenda: '',
    discussion: '',
    actionItems: ''
  });

  const [actionMenu, setActionMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    reportType: '',
    selectedMOM: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMomDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
  };

  const handleGenerateMOM = () => {
    // Logic to generate MOM report
    console.log('Generating MOM report with details:', momDetails);
    setIsMOMDialogOpen(false);
  };

  const handleGenerateConsolidate = () => {
    // Logic to generate consolidated report
    console.log('Generating consolidated report');
    setIsConsolidateDialogOpen(false);
  };

  const handleReportAction = (action, type, momId = '') => {
    if (action === 'show') {
      console.log(`Showing ${type} report`, momId);
    } else if (action === 'download') {
      console.log(`Downloading ${type} report as PDF`, momId);
    }
    setActionMenu(prev => ({ ...prev, isOpen: false }));
  };

  const renderMOMButtons = () => (
    <div className="flex gap-2 mt-2">
      {['MOM 1', 'MOM 2', 'MOM 3'].map(type => (
        <button
          key={type}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActionMenu({
              isOpen: true,
              position: { x: rect.left, y: rect.bottom + window.scrollY },
              reportType: 'mom',
              selectedMOM: type
            });
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-sm"
        >
          {type}
        </button>
      ))}
    </div>
  );

  const handleConsolidateClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom + window.scrollY },
      reportType: 'consolidate',
      selectedMOM: ''
    });
  };

  const filterControls = [
    {
      name: 'year',
      options: [2021, 2022, 2023, 2024]
    },
    {
      name: 'term',
      options: ['odd', 'even']
    },
    {
      name: 'semester',
      getDynamicOptions: (term) => {
        if (term === 'odd') return [1, 3, 5, 7];
        if (term === 'even') return [2, 4, 6, 8];
        return [];
      }
    },
    {
      name: 'section',
      options: ['A', 'B', 'C', 'D', 'E', 'F']
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative pt-20">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 mb-10"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Meeting Report Generator
          </motion.h1>
        </motion.div>

        {/* New Filter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {filterControls.map((control) => (
            <select
              key={control.name}
              value={filters[control.name]}
              onChange={(e) => setFilters(prev => ({ ...prev, [control.name]: e.target.value }))}
              className="bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-4 py-2 backdrop-blur-sm min-w-[120px]
                        hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none
                        transition-all duration-200"
            >
              <option value="" className="bg-gray-900 text-gray-100">
                {control.name.charAt(0).toUpperCase() + control.name.slice(1)}
              </option>
              {(control.getDynamicOptions 
                ? control.getDynamicOptions(filters.term)
                : control.options
              ).map(option => (
                <option key={option} value={option} className="bg-gray-900 text-gray-100">
                  {option}
                </option>
              ))}
            </select>
          ))}
          
          <button
            onClick={handleSearch}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Search
          </button>
        </motion.div>

        {/* Report Type Bubbles */}
        <motion.div 
          className="flex flex-col items-center gap-6 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="group relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedReport('mom')}
          >
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-1">
              <div className="bg-black rounded-full p-6">
                <h3 className="text-xl font-bold text-white mb-2">MOM Report</h3>
                {selectedReport === 'mom' && renderMOMButtons()}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="group relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={handleConsolidateClick}
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1">
              <div className="bg-black rounded-full p-6">
                <h3 className="text-xl font-bold text-white">Consolidate Report</h3>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isMOMDialogOpen && (
          <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" open={isMOMDialogOpen} onClose={() => setIsMOMDialogOpen(false)}>
            <div className="min-h-screen px-4 text-center">
              <Dialog.Overlay className="fixed inset-0 bg-black/30" />
              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Generate MOM Report
                </Dialog.Title>
                <div className="mt-2">
                  <input
                    type="date"
                    name="date"
                    value={momDetails.date}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Date"
                  />
                  <input
                    type="text"
                    name="attendees"
                    value={momDetails.attendees}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Attendees"
                  />
                  <textarea
                    name="agenda"
                    value={momDetails.agenda}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Agenda"
                    rows="2"
                  />
                  <textarea
                    name="discussion"
                    value={momDetails.discussion}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Discussion"
                    rows="2"
                  />
                  <textarea
                    name="actionItems"
                    value={momDetails.actionItems}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all mb-2"
                    placeholder="Action Items"
                    rows="2"
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handleGenerateMOM}
                  >
                    Generate Report
                  </button>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}

        {isConsolidateDialogOpen && (
          <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" open={isConsolidateDialogOpen} onClose={() => setIsConsolidateDialogOpen(false)}>
            <div className="min-h-screen px-4 text-center">
              <Dialog.Overlay className="fixed inset-0 bg-black/30" />
              <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Generate Consolidated Report
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Click the button below to generate a consolidated report of all meetings.
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handleGenerateConsolidate}
                  >
                    Generate Report
                  </button>
                </div>
              </motion.div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {actionMenu.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setActionMenu(prev => ({ ...prev, isOpen: false }))}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Report Options</h2>
                  <button
                    onClick={() => setActionMenu(prev => ({ ...prev, isOpen: false }))}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    &times;
                  </button>
                </div>
                <button
                  onClick={() => handleReportAction('show', actionMenu.reportType, actionMenu.selectedMOM)}
                  className="block w-full text-left px-6 py-3 mb-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg"
                >
                  Show Report
                </button>
                <button
                  onClick={() => handleReportAction('download', actionMenu.reportType, actionMenu.selectedMOM)}
                  className="block w-full text-left px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors rounded-lg"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

// Make sure to add the default export
export default MeetingReportGenerator;
