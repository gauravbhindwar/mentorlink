import React, { useState, useRef, useEffect } from 'react';
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
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: ''
  });

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!regex.test(email)) return "Invalid email format";
    return "";
  };

  const validateName = (name) => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return "";
  };

  const validatePhone = (phone) => {
    const regex = /^[0-9]{10}$/;
    if (!phone) return "Phone number is required";
    if (!regex.test(phone)) return "Phone number must be 10 digits";
    return "";
  };

  const validateRoles = (roles) => {
    if (!roles || roles.length === 0) return "At least one role must be selected";
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    if (name === 'isActive') {
      // Ensure boolean value for isActive
      setSelectedMentor(prev => ({
        ...prev,
        isActive: Boolean(value)
      }));
      console.log('Setting active status:', Boolean(value)); // Debug log
    } else if (name === 'role') {
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
    // Prevent superadmin role from being added
    if (role === 'superadmin') return;
    
    const currentRoles = selectedMentor?.role || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    // Ensure at least one role remains selected
    if (newRoles.length > 0) {
      setSelectedMentor(prev => ({
        ...prev,
        role: newRoles
      }));

      // Auto close if both mentor and admin roles are selected
      if (newRoles.includes('mentor') && newRoles.includes('admin')) {
        setIsRoleDropdownOpen(false);
      }
    }
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
    const validationErrors = {
      name: validateName(selectedMentor?.name),
      email: validateEmail(selectedMentor?.email),
      phone_number: validatePhone(selectedMentor?.phone_number),
      role: validateRoles(selectedMentor?.role)
    };

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(error => error !== "")) {
      toast.error("Please fix all errors before submitting", {
        style: toastStyles.error.style,
        iconTheme: toastStyles.error.iconTheme,
        position: "bottom-right",
      });
      return;
    }

    try {
      console.log('Submitting mentor update:', {
        ...selectedMentor,
        isActive: Boolean(selectedMentor.isActive)
      }); // Debug log

      const response = await axios.patch(
        `/api/admin/manageUsers/manageMentor/${selectedMentor.MUJid}`,
        {
          ...selectedMentor,
          isActive: Boolean(selectedMentor.isActive) // Ensure boolean
        }
      );

      if (response.data.success) {
        toast.success("Mentor updated successfully", {
          style: {
            background: '#22c55e',
            color: 'white',
            padding: '16px',
          },
          duration: 3000,
        });
        onClose();
        if (handleEditMentor) {
          await handleEditMentor(response.data.mentor);
        }
      } else {
        throw new Error(response.data.error || "Failed to update mentor");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Error updating mentor";
      toast.error(errorMessage, {
        style: {
          background: '#ef4444',
          color: 'white',
          padding: '16px',
        },
        duration: 3000,
      });
    }
  };

  // Add ref for dropdown
  const dropdownRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl mx-4 shadow-2xl border border-gray-800 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-800">
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
        
        <div className="p-8 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <label className="text-gray-400 text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={selectedMentor?.name || ""}
                onChange={handleInputChange}
                className={`w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                  errors.name ? 'border-red-500' : 'border-gray-700 hover:border-orange-500'
                } transition-colors`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 text-sm font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={selectedMentor?.email || ""}
                onChange={handleInputChange}
                className={`w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                  errors.email ? 'border-red-500' : 'border-gray-700 hover:border-orange-500'
                } transition-colors`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 text-sm font-medium">Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={selectedMentor?.phone_number || ""}
                onChange={handleInputChange}
                className={`w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 border ${
                  errors.phone_number ? 'border-red-500' : 'border-gray-700 hover:border-orange-500'
                } transition-colors`}
                placeholder="Enter phone number"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-xs mt-0.5">{errors.phone_number}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 text-sm font-medium">Assigned Roles</label>
              <div className="relative" ref={dropdownRef}>
                <div 
                  className={`w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer border ${
                    errors.role ? 'border-red-500' : 'border-gray-700 hover:border-orange-500'
                  } transition-colors`}
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
                {errors.role && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.role}</p>
                )}
                {isRoleDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    {/* Only show mentor and admin roles */}
                    {['mentor', 'admin'].map((role) => (
                      <div
                        key={role}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-700 flex items-center justify-between first:rounded-t-lg last:rounded-b-lg ${
                          selectedMentor?.role?.includes(role) ? 'text-orange-500 bg-orange-500/10' : 'text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent dropdown from closing
                          handleRoleToggle(role);
                        }}
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
                  checked={Boolean(selectedMentor?.isActive)}
                  onChange={(e) => handleInputChange({
                    target: { 
                      name: 'isActive', 
                      value: e.target.checked 
                    }
                  })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-3 text-gray-300 font-medium">Active Status</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-4 p-6 border-t border-gray-800 bg-gray-900/50">
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
