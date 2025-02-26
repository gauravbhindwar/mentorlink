import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CardSkeleton from './CardSkeleton';
import TableSkeleton from './TableSkeleton';

const FilterSectionSkeleton = () => (
  <Box className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
    <Box sx={{ mb: 2 }}>
      <Skeleton 
        variant="rectangular" 
        height={40} 
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          mb: 2
        }}
      />
      <Skeleton 
        variant="rectangular" 
        height={40}
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          mb: 2
        }}
      />
      <Skeleton 
        variant="rectangular" 
        height={40}
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          mb: 2
        }}
      />
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Skeleton 
        variant="rectangular" 
        width={100} 
        height={35}
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      />
      <Skeleton 
        variant="rectangular" 
        width={100} 
        height={35}
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      />
    </Box>
  </Box>
);

const PageSkeleton = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Skeleton 
          variant="rectangular" 
          width={300} 
          height={48}
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}
        />
      </Box>

      {/* Main Grid Layout */}
      <div className={`flex-1 grid gap-2 p-2 ${
        isSmallScreen || isTablet ? 'grid-cols-1' : 'grid-cols-[350px,1fr]'
      }`}>
        {/* Filter Panel Skeleton */}
        <div className={`${
          isSmallScreen || isTablet 
            ? 'h-auto max-h-[40vh]' 
            : 'h-[calc(100vh-100px)]'
        } overflow-auto`}>
          <FilterSectionSkeleton />
        </div>

        {/* Content Skeleton */}
        <div className={`${
          isSmallScreen || isTablet 
            ? 'h-[calc(60vh-1rem)]' 
            : 'h-[calc(100vh-100px)]'
        } overflow-auto`}>
          <div className="bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-transparent backdrop-blur-xl rounded-3xl border border-orange-500/20 h-full">
            <div className="h-full p-4">
              {isTablet || isSmallScreen ? (
                <CardSkeleton count={5} />
              ) : (
                <span className='max-md:hidden'>
                <TableSkeleton rowsNum={8} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
