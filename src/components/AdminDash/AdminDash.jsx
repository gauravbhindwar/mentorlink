'use client';

import { useState, useEffect } from 'react';
import FilterSection from './FilterSection';
import MenteeTable from './MenteeTable';
import AddMenteeDialog from './AddMenteeDialog'; // From previous implementation
import { useMediaQuery } from '@mui/material';

const AdminDash = () => {
  const [filters, setFilters] = useState({
    year: '',
    term: '',
    semester: '',
    section: ''
  });
  const [mentees, setMentees] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editMentee, setEditMentee] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleSearch = (data) => {
    setMentees(data);
  };

  const handleSearchAll = (data) => {
    setMentees(data);
  };

  const handleAddNew = () => {
    setEditMentee(null); // Clear any existing edit state
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (mentee) => {
    setEditMentee(mentee);
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditMentee(null);
  };

  const handleDialogSubmit = async (formData) => {
    try {
      if (editMentee) {
        // Update existing mentee
        const response = await fetch(`/api/mentees/${editMentee._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update mentee');
      } else {
        // Add new mentee
        const response = await fetch('/api/mentees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to add mentee');
      }
      
      // Refresh mentee list
      handleSearchAll();
      handleDialogClose();
    } catch (error) {
      console.error('Error:', error);
      // Add error handling (e.g., show error toast)
    }
  };

  const handleReset = () => {
    setFilters({
      year: '',
      term: '',
      semester: '',
      section: ''
    });
    setMentees([]);
  };

  return (
    <div>
      <FilterSection 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onSearchAll={handleSearchAll}
        onAddNew={handleAddNew}
        onReset={handleReset}
      />
      <MenteeTable 
        mentees={mentees}
        onEditClick={handleEditClick}
        isSmallScreen={isSmallScreen}
      />
      <AddMenteeDialog
        open={isAddDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        mentee={editMentee}
      />
    </div>
  );
};

export default AdminDash;