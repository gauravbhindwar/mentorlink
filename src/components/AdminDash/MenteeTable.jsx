'use client';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';

const MenteeTable = ({ mentees, onEditClick, isSmallScreen }) => {
  const columns = [
    {
      field: 'serialNumber',
      headerName: 'S.No',
      width: 70,
      renderCell: (params) => {
        const index = mentees.findIndex(mentee => mentee.mujid === params.row.mujid);
        return index + 1;
      },
      sortable: false,
    },
    { field: 'mujid', headerName: 'Mujid', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'semester', headerName: 'Semester', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Button
          size={isSmallScreen ? "small" : "medium"}
          variant="outlined"
          onClick={() => onEditClick(params.row)}
          sx={{ 
            borderRadius: '12px', 
            fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
            textTransform: 'capitalize',
            margin: 'auto',
            color: '#f97316', // orange-500
            borderColor: '#f97316',
            '&:hover': {
              borderColor: '#ea580c', // orange-600
              backgroundColor: 'rgba(249, 115, 22, 0.1)'
            }
          }}
        >
          Edit
        </Button>
      ),
    },
    { field: 'yearOfRegistration', headerName: 'Year of Registration', width: 180 },
    { field: 'fatherName', headerName: 'Father\'s Name', width: 200 },
    { field: 'motherName', headerName: 'Mother\'s Name', width: 200 },
    { field: 'dateOfBirth', headerName: 'Date of Birth', width: 150 },
    { field: 'parentsPhone', headerName: 'Parents\' Phone', width: 150 },
    { field: 'parentsEmail', headerName: 'Parents\' Email', width: 250 },
    { field: 'mentorMujid', headerName: 'Mentor Mujid', width: 150 },
  ].map(col => ({
    ...col,
    headerAlign: 'center',
    align: 'center',
    flex: 1,
    minWidth: col.minWidth || 150,
    renderCell: col.field === 'actions' 
      ? (params) => (
          <Button
            size={isSmallScreen ? "small" : "medium"}
            variant="outlined"
            onClick={() => onEditClick(params.row)}
            sx={{ 
              borderRadius: '12px', 
              fontSize: { xs: '0.8rem', sm: '0.9rem' }, 
              textTransform: 'capitalize',
              margin: 'auto',
              color: '#f97316', // orange-500
              borderColor: '#f97316',
              '&:hover': {
                borderColor: '#ea580c', // orange-600
                backgroundColor: 'rgba(249, 115, 22, 0.1)'
              }
            }}
          >
            Edit
          </Button>
        )
      : col.renderCell // Keep original renderCell if it exists
  }));

  return (
    <div style={{ 
      width: '100%', 
      padding: '0 16px', 
      marginBottom: '16px' 
    }}>
      <div style={{ 
        height: '600px', 
        width: '100%' 
      }}>
        <DataGrid
          rows={mentees}
          columns={columns}
          getRowId={(row) => row.mujid}
          autoHeight
          sx={{
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            '& .MuiDataGrid-main': {
              border: 'none',
              overflow: 'unset',
              paddingRight: '16px',
            },
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
              '&:focus': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-row': {
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              },
              minHeight: '60px !important',
              maxHeight: 'unset !important',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
              color: '#f97316',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px',
              paddingRight: '16px',
              minHeight: '60px !important',
              maxHeight: 'unset !important',
            },
            '& .MuiDataGrid-columnHeader': {
              '&:focus': {
                outline: 'none',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              color: '#f97316',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '2px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 16px',
            },
            '& .MuiTablePagination-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: 'transparent',
              '&::-webkit-scrollbar': {
                width: '12px',
                height: '12px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                margin: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(249, 115, 22, 0.5)',
                borderRadius: '6px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(249, 115, 22, 0.7)',
                },
              },
            },
            '& .MuiButtonBase-root': {
              color: '#f97316',
            },
            '& .MuiDataGrid-menuIcon': {
              display: 'block',
              color: '#f97316',
              '& .MuiSvgIcon-root': {
                color: '#f97316',
              },
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
              },
            },
            '& .MuiDataGrid-sortIcon': {
              color: '#f97316',
            },
            '& .MuiDataGrid-panel': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiButtonBase-root': {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            },
            '& .MuiDataGrid-toolbarContainer': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '8px 16px',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader--sortable:hover': {
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
            },
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
              },
            },
            '& .MuiDataGrid-menuList': {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
            },
            '& .MuiSvgIcon-root': {
              color: '#f97316',
            },
          }}
          disableSelectionOnClick
          disableColumnMenu={false}
          disableColumnFilter={false}
          loading={!mentees.length}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            columns: {
              columnVisibilityModel: {
                yearOfRegistration: false,
                fatherName: false,
                motherName: false,
                dateOfBirth: false,
                parentsPhone: false,
                parentsEmail: false,
                mentorMujid: false,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          getRowHeight={() => 'auto'}
          headerHeight={60}
        />
      </div>
    </div>
  );
};

export default MenteeTable;
