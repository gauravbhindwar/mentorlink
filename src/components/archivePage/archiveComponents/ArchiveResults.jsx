'use client';
import React, { useState, useEffect, useMemo } from 'react'; // Add React to imports
import { Box, CircularProgress, Typography, Card, Grid, InputAdornment, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
// import axios from 'axios';
import { BsPersonVcard, BsPeopleFill, BsCalendarWeek } from 'react-icons/bs';
import { Search as SearchIcon } from '@mui/icons-material';
import ArchiveReportGenerator from './ArchiveReportGenerator';
import useArchiveStore from '@/store/archiveStore';
import { IoDocumentText } from 'react-icons/io5'; // Add this import
import { IoCopy } from "react-icons/io5"; // Add this import


const columns = [
    { 
        field: 'serialNumber',    
        headerName: 'S.No',
        flex: 0.7,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'MUJid', 
        headerName: 'MUJ ID', 
        flex: 1,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'name', 
        headerName: 'Name', 
        flex: 1.2,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'email', 
        headerName: 'Email', 
        flex: 1.5,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'phone_number', 
        headerName: 'Phone', 
        flex: 1,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
    },
    { 
        field: 'mentee_count', 
        headerName: 'Mentees', 
        flex: 0.8,
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => params.row?.mentees?.length || 0,
    },
];

const menteeColumns = [
  { field: 'serialNumber', headerName: 'S.No', flex: 0.7 },
  { field: 'MUJid', headerName: 'MUJ ID', flex: 1 },
  { field: 'name', headerName: 'Name', flex: 1.2 },
  { field: 'email', headerName: 'Email', flex: 1.5 },
  { field: 'semester', headerName: 'Semester', flex: 0.8 },
  { field: 'mentorName', headerName: 'Mentor Name', flex: 1.2 },
  { field: 'mentorMUJid', headerName: 'Mentor ID', flex: 1 }
].map(col => ({
  ...col,
  headerClassName: 'super-app-theme--header',
  headerAlign: 'center',
  align: 'center'
}));

const formatDateTime = (dateValue, timeValue) => {
  if (!dateValue) return 'N/A';

  try {
    let date;
    // Handle different date formats
    if (typeof dateValue === 'string') {
      // Check if date is in DD/MM/YYYY format
      if (dateValue.includes('/')) {
        const [day, month, year] = dateValue.split('/');
        date = new Date(year, month - 1, day);
      } 
      // Check if date is in YYYY-MM-DD format
      else if (dateValue.includes('-')) {
        date = new Date(dateValue);
      } 
      // Try parsing as ISO string
      else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'Invalid Date';
    }

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return 'Invalid Date';
    }

    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    return timeValue ? `${formattedDate}, ${timeValue}` : formattedDate;
  } catch (error) {
    console.error('Date formatting error:', error, { dateValue, timeValue });
    return 'Invalid Date';
  }
};

const meetingColumns = [
  { field: 'serialNumber', headerName: 'S.No', flex: 0.7 },
  { field: 'meeting_id', headerName: 'Meeting ID', flex: 1.2 },
  { field: 'mentorName', headerName: 'Mentor', flex: 1.2 },
  { 
    field: 'datetime',
    headerName: 'Date & Time', 
    flex: 1.2,
    renderCell: (params) => {
      if (!params.row) return 'N/A';
      
      const { meeting_date, meeting_time, date, time } = params.row;
      const dateValue = meeting_date || date;
      const timeValue = meeting_time || time;

      return (
        <Typography>
          {formatDateTime(dateValue, timeValue)}
        </Typography>
      );
    }
  },
  { 
    field: 'venue', 
    headerName: 'Venue', 
    flex: 1.2,
    renderCell: (params) => {
      const value = params.value || 'N/A';
      const isLink = value.toLowerCase().includes('http') || 
                    value.toLowerCase().includes('meet.google') || 
                    value.toLowerCase().includes('zoom');
      
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: '100%'
        }}>
          <Typography sx={{ 
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {value}
          </Typography>
          {isLink && (
            <Box
              component="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(value);
                // Optional: Add toast notification here
                alert('Link copied to clipboard!');
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
                borderRadius: 1,
                border: 'none',
                cursor: 'pointer',
                bgcolor: 'rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(249, 115, 22, 0.2)',
                }
              }}
            >
              <IoCopy size={16} />
            </Box>
          )}
        </Box>
      );
    }
  },
  { 
    field: 'attendance',
    headerName: 'Attendance', 
    flex: 1,
    renderCell: (params) => {
      const present = params.row.present || 0;
      const total = params.row.attendees || 0;
      const percentage = total ? Math.round((present / total) * 100) : 0;
      
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          color: percentage > 75 ? '#4ade80' : percentage > 50 ? '#fbbf24' : '#f87171'
        }}>
          <Typography>{`${present}/${total}`}</Typography>
          <Typography sx={{ 
            fontSize: '0.75rem',
            opacity: 0.8 
          }}>{`(${percentage}%)`}</Typography>
        </Box>
      );
    }
  },
  { 
    field: 'isReportFilled', 
    headerName: 'Report Status', 
    flex: 1,
    renderCell: (params) => (
      <Typography
        sx={{ 
          color: params.value ? '#4ade80' : '#f87171',
          fontWeight: 600
        }}
      >
        {params.value ? 'Filled' : 'Pending'}
      </Typography>
    )
  }
].map(col => ({
  ...col,
  headerClassName: 'super-app-theme--header',
  headerAlign: 'center',
  align: 'center'
}));

const ActionCard = ({ title, icon, count, onClick, isActive }) => (
  <Card 
    onClick={onClick}
    sx={{
      p: 1.5, // Reduced from p: 2
      cursor: 'pointer',
      backgroundColor: isActive ? 'rgba(22, 163, 74, 0.2)' : 'rgba(26, 26, 26, 0.8)',
      border: `1px solid ${isActive ? '#22c55e' : 'rgba(249, 115, 22, 0.2)'}`,
      borderRadius: 2, // Reduced from 3
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        backgroundColor: isActive ? 'rgba(22, 163, 74, 0.3)' : 'rgba(26, 26, 26, 0.9)',
        boxShadow: isActive ? '0 8px 20px rgba(34, 197, 94, 0.3)' : '0 8px 20px rgba(249, 115, 22, 0.2)',
      },
      '&:active': {
        transform: 'translateY(-2px)',
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}> {/* Reduced gap */}
      <Box sx={{ 
        p: 1, // Reduced padding
        borderRadius: 1.5,
        backgroundColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
        color: isActive ? '#22c55e' : '#f97316',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon} {/* Simply render the icon directly instead of using cloneElement */}
      </Box>
      <Box>
        <Typography sx={{ 
          color: isActive ? '#22c55e' : '#f97316', 
          fontSize: '0.8rem' // Reduced font size
        }}>
          {title}
        </Typography>
        <Typography sx={{ 
          color: 'white', 
          fontWeight: 'bold', 
          fontSize: '1rem' // Reduced font size
        }}>
          {count || '0'}
        </Typography>
      </Box>
    </Box>
  </Card>
);

const ArchiveResults = ({ searchParams }) => {
  const store = useArchiveStore();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25); // Changed default to 25
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('mentors');
  // const [isLoading, setIsLoading] = useState(false); // Add this line
  // const [allData, setAllData] = useState([]);

  // Initial data fetch
  useEffect(() => {
    if (searchParams) {
      store.setSearchParams(searchParams); // Add this line
      store.fetchInitialData(searchParams);
    }
  }, [searchParams]);

  // Handle view changes with optimized loading
  const handleViewChange = async (newView) => {
    try {
      setActiveView(newView);
      setPage(0);
      setPageSize(25); // Reset to default page size
      
      // Don't fetch data for reports view
      if (newView === 'reports') {
        return;
      }
      
      if (!store.data[newView]?.size) {
        await store.fetchViewData(newView, searchParams);
      }
    } catch (error) {
      console.error(`Error changing view to ${newView}:`, error);
    }
  };

  // Get current data based on active view - Updated
  const currentData = useMemo(() => {
    const data = Array.from(store.data[activeView]?.values() || []);
    return data.map((item, index) => ({
      ...item,
      id: item.id || `${activeView}-${index}`,
      serialNumber: item.serialNumber || index + 1
    }));
  }, [activeView, store.data]);

  // Filter data - Keep all items in memory
  const filteredData = useMemo(() => {
    if (!currentData) return [];
    if (!searchTerm) return currentData;

    const searchLower = searchTerm.toLowerCase();
    return currentData.filter(item => {
      // Check all string and number fields
      const searchableValues = [
        item.MUJid,
        item.name,
        item.email,
        item.phone_number,
        item.meeting_id,
        item.mentorName,
        item.venue,
        item.semester?.toString(),
        // Add mentor-specific fields
        item.mentorEmail,
        item.mentorMUJid,
        // Add any additional fields you want to search
      ];

      return searchableValues.some(value => 
        value?.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [currentData, searchTerm]);

  // Paginate data client-side
  // const paginatedData = useMemo(() => {
  //   const start = page * pageSize;
  //   const end = start + pageSize;
  //   return filteredData.slice(start, end);
  // }, [filteredData, page, pageSize]);

  // const handleDownload = async () => {
  //   try {
  //     const response = await axios.get('/api/archive/downloadReport', {
  //       params: searchParams,
  //       responseType: 'blob'
  //     });
      
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', `archive-report-${searchParams.academicYear}-${searchParams.academicSession}.xlsx`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   } catch (err) {
  //     setError(`Error downloading report: ${err.message}`);
  //   }
  // };

  // Update renderSearchAndDownload to conditionally render
  const renderSearchAndDownload = () => {
    // Don't show search box on reports tab
    if (activeView === 'reports') return null;

    return (
      <div className="flex gap-2 items-center mb-2"> {/* Added margin bottom */}
        <TextField
          size="small" // Changed to small
          fullWidth
          variant="outlined"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              cursor: 'text',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: 'rgba(249, 115, 22, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: '#f97316',
                boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#f97316',
              },
            },
          }}
        />
      </div>
    );
  };

  // const handlePageChange = (params) => {
  //   store.fetchPageData(activeView, params.page, params.pageSize);
  // };

  return (
    <div className="archive-results-container">
      <div className="flex flex-col gap-2"> {/* Reduced gap from 4 to 2 */}
        <div className="flex items-center">
          <Grid container spacing={1}> {/* Reduced spacing from 2 to 1 */}
            <Grid item xs={12}>
              <Grid container spacing={1}> {/* Reduced spacing */}
                {/* Action Cards - Add Reports card */}
                <Grid item xs={12} md={3}>
                  <ActionCard
                    title="View Mentors"
                    icon={<BsPersonVcard size={24} />}
                    count={store.stats.mentors}
                    onClick={() => handleViewChange('mentors')}
                    isActive={activeView === 'mentors'}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <ActionCard
                    title="View Mentees"
                    icon={<BsPeopleFill size={24} />}
                    count={store.stats.mentees}
                    onClick={() => handleViewChange('mentees')}
                    isActive={activeView === 'mentees'}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <ActionCard
                    title="View Meetings"
                    icon={<BsCalendarWeek size={24} />}
                    count={store.stats.meetings}
                    onClick={() => handleViewChange('meetings')}
                    isActive={activeView === 'meetings'}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <ActionCard
                    title="Reports"
                    icon={<IoDocumentText size={24} />}
                    count={store.stats.meetings} // Using meetings count as reports count
                    onClick={() => handleViewChange('reports')}
                    isActive={activeView === 'reports'}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              {renderSearchAndDownload()}
            </Grid>
          </Grid>
        </div>

        <Box sx={{ 
          height: 'calc(100vh - 220px)', // Adjusted height for better table visibility
          overflow: 'auto'
        }}>
          {store.loading ? (
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <CircularProgress sx={{ color: '#f97316' }} />
            </Box>
          ) : store.error ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: 'white',
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography sx={{ color: '#f87171' }}>
                {store.error}
              </Typography>
            </Box>
          ) : activeView === 'reports' ? (
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: 2,
              backgroundColor: 'rgba(26, 26, 26, 0.6)',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Generate Reports
              </Typography>
              {searchParams ? (
                <ArchiveReportGenerator
                  meetings={Array.from(store.data.meetings?.values() || [])}
                  mentors={Array.from(store.data.mentors?.values() || [])}
                  searchParams={searchParams}
                  inlineModeStyles={{
                    height: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 0,
                    padding: 0,
                  }}
                />
              ) : (
                <Typography sx={{ color: 'gray' }}>
                  Please select an academic year and session to generate reports.
                </Typography>
              )}
            </Box>
          ) : (
            <DataGrid
              rows={filteredData} // Changed from paginatedData to filteredData
              columns={activeView === 'mentees' ? menteeColumns : 
                      activeView === 'meetings' ? meetingColumns : 
                      columns}
              paginationMode="client"
              pageSizeOptions={[25, 50, 100]}
              density="compact"
              getRowHeight={() => 45}
              disableRowSelectionOnClick
              getRowId={(row) => row.id || `fallback-${row.serialNumber}`}
              paginationModel={{
                page,
                pageSize
              }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              loading={store.loading}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'name', sort: 'asc' }],
                },
                pagination: {
                  paginationModel: { 
                    pageSize: 25,
                    page: 0
                  },
                },
              }}
              componentsProps={{
                pagination: {
                  labelRowsPerPage: "Rows:",
                  showFirstButton: true,
                  showLastButton: true,
                }
              }}
              sx={{
                height: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                // Add custom scrollbar styles
                '& ::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'transparent',
                },
                '& ::-webkit-scrollbar-track': {
                  background: 'rgba(249, 115, 22, 0.05)',
                  borderRadius: '8px',
                },
                '& ::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(249, 115, 22, 0.3)',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(249, 115, 22, 0.5)',
                  },
                },
                '& ::-webkit-scrollbar-corner': {
                  backgroundColor: 'transparent',
                },
                '& .MuiDataGrid-cell': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#1a1a1a',
                    borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
                },
                '& .MuiDataGrid-columnHeader': {
                    color: '#f97316',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    backgroundColor: '#1a1a1a',
                    '&:focus': {
                        outline: 'none',
                    },
                    '&:focus-within': {
                        outline: 'none',
                    },
                },
                '& .MuiDataGrid-iconButtonContainer': {
                    visibility: 'visible',
                    width: 'auto',
                    padding: '4px',
                },
                '& .MuiDataGrid-sortIcon': {
                    color: '#f97316',
                    opacity: 1,
                },
                '& .MuiDataGrid-columnHeaderDraggableContainer': {
                    width: '100%',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                    padding: '0 8px',
                },
                '& .MuiDataGrid-columnSeparator': {
                    color: 'rgba(249, 115, 22, 0.2)',
                },
                '& .MuiDataGrid-footerContainer': {
                  position: 'sticky',
                  bottom: 0,
                  backgroundColor: '#1a1a1a',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  zIndex: 2,
                  padding: '0.5rem',
                  '& .MuiTablePagination-root': {
                    color: 'white',
                    overflow: 'hidden',
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: 'white',
                  },
                  '& .MuiTablePagination-select': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                  },
                  '& .MuiIconButton-root': {
                    color: 'white',
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                },
                '& .MuiDataGrid-row': {
                    minHeight: '40px !important', // Reduced row height
                    maxHeight: '40px !important',
                    backgroundColor: 'inherit',
                },
                '& .MuiDataGrid-menuIcon': {
                    color: 'white',
                },
                '& .MuiDataGrid-pagination': {
                    color: 'white',
                },
                '& .MuiTablePagination-root': {
                    color: 'white',
                },
                '& .MuiTablePagination-select': {
                    color: 'white',
                },
                '& .MuiTablePagination-selectIcon': {
                    color: 'white',
                },
                '& .MuiIconButton-root': {
                    color: 'white',
                },
                '& .MuiDataGrid-overlay': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            />
          )}
        </Box>
      </div>

      <style jsx>{`
        .archive-results-container {
            height: calc(100vh - 80px); // Reduced from 96px
            border-radius: 16px; // Reduced from 24px
            border: 1px solid rgba(249, 115, 22, 0.2);
            padding: 12px; // Reduced from 16px
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            background: rgba(26, 26, 26, 0.6);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            gap: 12px; // Reduced from 16px
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ArchiveResults;
