'use client';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Typography, TablePagination } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMemo, useState, useEffect } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MenteeDetailsDialog from './MenteeDetailsDialog';
// import axios from 'axios';
import TableSkeleton from './TableSkeleton';

// const CustomLoadingOverlay = () => (
//   <Box sx={{
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: '100%',
//     gap: 2
//   }}>
//     <CircularProgress sx={{ color: '#f97316' }} />
//     <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
//       Loading data...
//     </Typography>
//   </Box>
// );

// const CustomNoRowsOverlay = () => (
//   <Box sx={{
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: '100%',
//     gap: 2
//   }}>
//     <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
//       No data available
//     </Typography>
//   </Box>
// );

const StyledPaginationItem = styled(IconButton)(() => ({
  padding: '4px',
  color: 'rgba(249, 115, 22, 0.7)',
  '&:hover': {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    color: '#f97316',
  },
  '&.Mui-disabled': {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  transition: 'all 0.2s ease',
}));

// Update CustomPagination to handle actual data
const CustomPagination = ({ total }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '& .MuiTablePagination-root': {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        '& .MuiTablePagination-selectIcon': {
          color: '#f97316',
        },
        '& .MuiTablePagination-select': {
          color: 'rgba(255, 255, 255, 0.9)',
        },
      }}
    >
      <TablePagination
        component="div"
        count={total}
        page={0}
        onPageChange={() => {}}
        rowsPerPage={10}
        onRowsPerPageChange={() => {}}
        labelRowsPerPage="Rows:"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          '.MuiTablePagination-actions': {
            display: 'none',
          },
        }}
      />
      <StyledPaginationItem
        size="small"
        onClick={() => document.querySelector('.MuiTablePagination-actions button:first-of-type')?.click()}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: '1rem' }} />
      </StyledPaginationItem>
      <StyledPaginationItem
        size="small"
        onClick={() => document.querySelector('.MuiTablePagination-actions button:last-of-type')?.click()}
      >
        <ArrowForwardIosIcon sx={{ fontSize: '1rem' }} />
      </StyledPaginationItem>
    </Box>
  );
};

const CustomHeaderComponent = () => (
  <Box sx={{
    p: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
    background: 'rgba(0, 0, 0, 0.8)',
  }}>
    <Typography variant="h6" sx={{ 
      color: '#ea580c', 
      fontWeight: 600,
      textShadow: '0 0 10px rgba(249, 115, 22, 0.3)'
    }}>
      Mentee Records
    </Typography>
  </Box>
);

// Update CustomFooterComponent to pass total count
const CustomFooterComponent = ({ total }) => (
  <Box sx={{
    p: 1.5,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(249, 115, 22, 0.3)',
    background: 'linear-gradient(to right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
  }}>
    <Box className="flex items-center gap-2">
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        Total Records: {total}
      </Typography>
    </Box>
    <CustomPagination total={total} />
  </Box>
);

const ActionButtons = ({ row, onEditClick, setDetailsDialog, setDeleteDialog }) => (
  <Box sx={{ 
    display: 'flex', 
    gap: 1,
    justifyContent: 'center', // Center horizontally
    alignItems: 'center',     // Center vertically
    width: '100%',           // Take full width of cell
    height: '100%'          // Take full height of cell
  }}>
    <IconButton
      size="small"
      onClick={() => setDetailsDialog({ open: true, mentee: row })}
      sx={{
        color: '#3b82f6',
        '&:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      }}
    >
      <InfoIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      onClick={() => onEditClick(row)}
      sx={{
        color: '#f97316',
        '&:hover': {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
        },
      }}
    >
      <EditOutlinedIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      onClick={() => setDeleteDialog({ open: true, mujid: row.MUJid })}
      sx={{
        color: '#ef4444',
        '&:hover': {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
      }}
    >
      <DeleteOutlineIcon fontSize="small" />
    </IconButton>
  </Box>
);

// Update the container height since it's now in its own container
const MenteeTable = ({ emailFilter, mentees, onEditClick, onDeleteClick, isLoading, currentFilters }) => {
  // Remove isDataReady state since we don't need it
  const [mounted, setMounted] = useState(false);
  const [localData, setLocalData] = useState([]);
  // const [baseData, setBaseData] = useState([]);
  // const previousMentees = useRef([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mujid: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, mentee: null });

  // Add handleConfirmDelete function
  const handleConfirmDelete = async () => {
    if (deleteDialog.mujid) {
      try {
        await onDeleteClick([deleteDialog.mujid]);
        
        // Update local data
        setLocalData(prev => prev.filter(mentee => mentee.MUJid !== deleteDialog.mujid));
        // setBaseData(prev => prev.filter(mentee => mentee.MUJid !== deleteDialog.mujid));
        
      } catch (error) {
        console.error('Error deleting mentee:', error);
      } finally {
        setDeleteDialog({ open: false, mujid: null });
      }
    }
  };

  // Initialize mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle data updates - simplified
  useEffect(() => {
    if (Array.isArray(mentees)) {
      setLocalData(mentees);
      // setBaseData(mentees);
    }
  }, [mentees]);

  // Process data for table
  // Update the processedMentees function to ensure unique keys
  const processedMentees = useMemo(() => {
    if (!mounted || !localData.length) return [];
    
    // Filter by email if emailFilter exists
    const menteesToProcess = emailFilter 
      ? localData.filter(mentee => 
          mentee.email?.toLowerCase().includes(emailFilter.toLowerCase()) ||
          mentee.mentorEmailid?.toLowerCase().includes(emailFilter.toLowerCase())
        )
      : localData;

    return menteesToProcess.map((mentee, index) => {
      // Create a unique composite key using multiple fields
      const uniqueKey = `${mentee._id || ''}-${mentee.MUJid || ''}-${mentee.timestamp || Date.now()}-${index}`;
      
      return {
        ...mentee,
        // Use the uniqueKey as the id
        id: uniqueKey,
        MUJid: (mentee?.MUJid || '').toUpperCase(),
        name: mentee?.name || '',
        email: mentee?.email || '',
        mentorEmailid: mentee?.mentorEmailid || '',
        semester: mentee?.semester || '',
        section: mentee?.section || '',
        // Add searchScore for better sorting of results
        searchScore: emailFilter ? 
          ((mentee.email?.toLowerCase().includes(emailFilter.toLowerCase()) ? 2 : 0) +
           (mentee.mentorEmailid?.toLowerCase().includes(emailFilter.toLowerCase()) ? 1 : 0)) 
          : 0
      };
    }).sort((a, b) => b.searchScore - a.searchScore); // Sort by search relevance when filtering
  }, [mounted, localData, emailFilter]);

  // Simplify loading condition - show skeleton only when initially loading
  if (isLoading && !localData.length) {
    return <TableSkeleton rowsNum={8} />;
  }

  // Add this near other column definitions
  const emailSearchColumn = {
    field: 'email',
    headerName: 'Mentee Email',
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => {
      const value = params.value?.toString() || '';
      return (
        <Box sx={{
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {value}
        </Box>
      );
    },
  };

  const mentorEmailColumn = {
    field: 'mentorEmailid',
    headerName: 'Mentor Email',
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => {
      const value = params.value?.toString() || '';
      return (
        <Box sx={{
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {value}
        </Box>
      );
    },
  };

  // Update columns definition to use ActionButtons component
  const columns = [
    {
      field: 'serialNumber',
      headerName: 'S.No',
      width: 70,
      renderCell: (params) => {
        // Find index using processedMentees array instead of params.api
        return processedMentees.findIndex(row => row.id === params.row.id) + 1;
      },
      sortable: false,
      hideSortIcons: true, // Add this to remove sort icons
    },
    {
      field: 'MUJid',
      headerName: 'Mentee MUJ ID',
      flex: 1,
      minWidth: 130,
    },
    
    {
      field: 'name',
      headerName: 'Mentee Name',
      flex: 1.2,
      minWidth: 180,
    },
    emailSearchColumn,
    mentorEmailColumn,
    {
      field: 'semester',
      headerName: 'Semester',
      width: 100,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      align: 'center',        // Center header text
      headerAlign: 'center',  // Center header
      renderCell: (params) => (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActionButtons
            row={params.row}
            onEditClick={onEditClick}
            setDetailsDialog={setDetailsDialog}
            setDeleteDialog={setDeleteDialog}
          />
        </div>
      ),
    },
  ];

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
    }}>
      {/* Loading overlay for subsequent data fetches */}
      {isLoading && localData.length > 0 && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
          borderRadius: 2
        }}>
          <CircularProgress sx={{ color: '#f97316' }} />
        </Box>
      )}
      
      <DataGrid
        rows={processedMentees}
        columns={columns}
        loading={isLoading && localData.length > 0}
        getRowId={(row) => row.id} // Use the new id field directly
        components={{
          LoadingOverlay: () => (
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1
            }}>
              <CircularProgress sx={{ color: '#f97316' }} />
            </Box>
          ),
          NoRowsOverlay: () => (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {currentFilters ? 'No mentees found' : 'Select filters to load data'}
              </Typography>
            </Box>
          ),
          Toolbar: GridToolbar,
          Header: CustomHeaderComponent,
          Footer: CustomFooterComponent,
          // No need for separate Pagination component as it's included in CustomFooterComponent
          // Other components...
        }}
        componentsProps={{
          columnHeaders: {
            sx: {
              transition: 'none !important',
            },
          },
          virtualScroller: {
            sx: {
              scrollBehavior: 'smooth',
            },
          },
          footer: {
            totalRecords: processedMentees.length, // Pass total records count
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
          sorting: {
            sortModel: [{ field: 'serialNumber', sort: 'asc' }],
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        paginationMode="client"
        disableColumnFilter
        disableColumnMenu
        columnBuffer={5}
        rowBuffer={10}
        rowHeight={60}
        headerHeight={56}
        pagination
        disableSelectionOnClick={true}
        sx={{
          height: '100%',
          '& .MuiDataGrid-main': {
            overflow: 'auto',
            height: 'calc(100% - 108px)', // Adjust this to leave space for header and footer
            minHeight: 'auto',
            maxHeight: 'none',
          },
          '& .MuiDataGrid-virtualScroller': {
            overflow: 'auto !important',
            className: 'custom-scrollbar', // Add custom scrollbar class
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(249, 115, 22, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(249, 115, 22, 0.7)',
              },
            },
            height: '100% !important',
            minHeight: { xs: '300px', lg: '200px' },
            maxHeight: { xs: '500px', lg: 'unset !important' },
            scrollBehavior: 'smooth',
            '@media (prefers-reduced-motion: no-preference)': {
              scrollBehavior: 'smooth',
            },
            animation: 'fadeIn 0.2s ease-out',
            minHeight: 'auto',
            maxHeight: 'none',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(249, 115, 22, 0.05)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(249, 115, 22, 0.3)',
              borderRadius: '10px',
              border: '2px solid transparent',
              backgroundClip: 'content-box',
              '&:hover': {
                background: 'rgba(249, 115, 22, 0.5)',
                backgroundClip: 'content-box',
              },
            },
            '&::-webkit-scrollbar-corner': {
              background: 'transparent',
            },
          },
          // Add custom scrollbar for Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(249, 115, 22, 0.3) rgba(249, 115, 22, 0.05)',
          '& .MuiDataGrid-virtualScrollerContent': {
            minWidth: 'fit-content',
            height: '100%',
          },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            width: '100%',
            height: '100%',
          },
          width: '100%',
          height: '100%',
          minHeight: '400px',
          border: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            fontSize: '0.95rem',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60px !important',
            maxHeight: 'unset !important',
            whiteSpace: 'normal',
            lineHeight: '1.5',
            transition: 'all 0.2s ease',
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
              transform: 'translateY(-1px)',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            },
          },
          transition: 'all 0.3s ease',
          '& .MuiDataGrid-columnHeader': {
            transition: 'background-color 0.2s ease',
            '& .MuiDataGrid-columnSeparator': {
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              transition: 'background-color 0.3s ease',
            },
          },
          '& .MuiDataGrid-columnSeparator': {
            transition: 'none !important',
          },
          '& .MuiDataGrid-columnHeaders': {
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            transition: 'none !important',
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#f97316',
            opacity: 0.5,
          },
          '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
            opacity: 1,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '@keyframes fadeIn': {
            from: { opacity: 0.8 },
            to: { opacity: 1 }
          },
          '& .MuiIconButton-root': {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
            }
          },
          '& .MuiDataGrid-columnHeader': {
            transition: 'background-color 0.2s ease',
          },
          '& .MuiDataGrid-cell': {
            transition: 'background-color 0.2s ease',
          },
          '& .MuiDataGrid-footerContainer': {
            transition: 'opacity 0.2s ease',
            position: 'sticky',
            bottom: 0,
            padding: '8px 16px', // Reduced padding
            borderTop: '1px solid rgba(249, 115, 22, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            minHeight: '52px', // Reduced height
            height: 'auto',
          },
          animation: 'none',
          '& *': {
            animation: 'none !important',
          },
          '& .MuiTablePagination-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            marginLeft: 'auto',
            '& .MuiTablePagination-select': {
              color: 'white',
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#f97316',
            },
            '& .MuiTablePagination-displayedRows': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
            padding: '0.25rem 1rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            minheight: '20px',
          },
        }}
      />
      
      {/* Details Dialog */}
      <Dialog 
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, mentee: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Mentee Details
        </DialogTitle>
        <DialogContent sx={{ my: 2 }}>
          {/* Render mentee details here */}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button
            onClick={() => setDetailsDialog({ open: false, mentee: null })}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              } 
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, mujid: null })}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ my: 2 }}>
          Are you sure you want to delete this mentee? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, mujid: null })}
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              } 
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Update MenteeDetailsDialog */}
      <MenteeDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, mentee: null })}
        mentee={detailsDialog.mentee} // Pass the selected mentee data
      />
    </Box>
  );
};

export default MenteeTable;