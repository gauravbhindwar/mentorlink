import React, { useState } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";
import { IoMdClose, IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io';

const toastStyles = {
  success: {
    style: {
      background: '#22c55e',
      color: 'white',
      padding: '16px',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#22c55e',
    },
  },
  error: {
    style: {
      background: '#ef4444',
      color: 'white',
      padding: '16px',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#ef4444',
    },
  },
};

const EditMentorDialog = ({
  open,
  onClose,
  selectedMentor,
  setSelectedMentor,
  handleEditMentor,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      // Handle checkbox role selection
      const currentRoles = selectedMentor?.role || [];
      const newRoles = currentRoles.includes(value)
        ? currentRoles.filter(role => role !== value)
        : [...currentRoles, value];
      
      setSelectedMentor((prev) => ({
        ...prev,
        role: newRoles,
      }));
    } else {
      setSelectedMentor((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleRoleToggle = (role) => {
    const currentRoles = selectedMentor?.role || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setSelectedMentor(prev => ({
      ...prev,
      role: newRoles
    }));
  };

  const isFormValid = () => {
    return (
      selectedMentor?.name?.trim() &&
      selectedMentor?.email?.trim() &&
      selectedMentor?.phone_number?.trim() &&
      selectedMentor?.role?.length > 0
    );
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.patch(
        `/api/admin/manageUsers/editMentor/${selectedMentor.MUJid}`,
        {
          name: selectedMentor.name,
          email: selectedMentor.email,
          phone_number: selectedMentor.phone_number,
          role: selectedMentor.role,
          isActive: selectedMentor.isActive
        }
      );

      if (response.data.success) {
        toast.success("Mentor updated successfully", {
          style: toastStyles.success.style,
          iconTheme: toastStyles.success.iconTheme,
          position: "bottom-right",
          duration: 5000,
        });
        onClose();
        if (handleEditMentor) {
          await handleEditMentor(response.data.mentor);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.status === 'DUPLICATE_EMAIL' 
        ? "This email is already assigned to another mentor"
        : error.response?.data?.error || "Error updating mentor";

      toast.error(errorMessage, {
        style: {
          ...toastStyles.error.style,
          zIndex: 100000,
        },
        iconTheme: toastStyles.error.iconTheme,
        position: "bottom-right",
        duration: 5000,
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl mx-4 shadow-2xl border border-gray-800">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Edit Mentor Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-500 transition-colors p-2 hover:bg-gray-800 rounded-full"
          >
            <IoMdClose size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium">MUJ ID</label>
              <input
                type="text"
                name="MUJid"
                value={selectedMentor?.MUJid || ""}
                className="w-full bg-gray-800/50 text-gray-300 rounded-lg px-4 py-3 cursor-not-allowed opacity-50 border border-gray-700"
                disabled
                placeholder="MUJ ID"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={selectedMentor?.name || ""}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700 hover:border-orange-500 transition-colors"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={selectedMentor?.email || ""}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700 hover:border-orange-500 transition-colors"
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium">Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={selectedMentor?.phone_number || ""}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700 hover:border-orange-500 transition-colors"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium">Assigned Roles</label>
              <div className="relative">
                <div 
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer border border-gray-700 hover:border-orange-500 transition-colors"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor?.role?.length > 0 ? (
                      selectedMentor.role.map(role => (
                        <span key={role} className="bg-orange-500/20 border border-orange-500/50 text-orange-500 px-3 py-1 rounded-full text-sm font-medium">
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">Select roles</span>
                    )}
                  </div>
                  {isRoleDropdownOpen ? <IoMdArrowDropup className="text-orange-500" /> : <IoMdArrowDropdown className="text-orange-500" />}
                </div>

                {isRoleDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    {['mentor', 'admin', 'superadmin'].map((role) => (
                      <div
                        key={role}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-700 flex items-center justify-between first:rounded-t-lg last:rounded-b-lg ${
                          selectedMentor?.role?.includes(role) ? 'text-orange-500 bg-orange-500/10' : 'text-white'
                        }`}
                        onClick={() => handleRoleToggle(role)}
                      >
                        <span className="capitalize font-medium">{role}</span>
                        {selectedMentor?.role?.includes(role) && (
                          <span className="text-orange-500">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={selectedMentor?.isActive || false}
                  onChange={(e) => handleInputChange({
                    target: { name: 'isActive', value: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-3 text-gray-300 font-medium">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-white border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500 font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMentorDialog;
