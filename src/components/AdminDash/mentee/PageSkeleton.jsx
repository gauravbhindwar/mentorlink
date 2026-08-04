import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// import CardSkeleton from './CardSkeleton';
// import TableSkeleton from './TableSkeleton';

// const FilterSectionSkeleton = () => (
//   <Box className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-4">
//     {/* Year and Session Fields */}
//     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
//       {/* Academic Year */}
//       <Skeleton 
//         variant="rectangular" 
//         height={56} 
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//       {/* Academic Session */}
//       <Skeleton 
//         variant="rectangular" 
//         height={56}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//       {/* Semester */}
//       <Skeleton 
//         variant="rectangular" 
//         height={56}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//       {/* Search Field */}
//       <Skeleton 
//         variant="rectangular" 
//         height={56}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//     </Box>

//     {/* Action Buttons */}
//     <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 'auto' }}>
//       <Skeleton 
//         variant="rectangular" 
//         height={40}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px',
//           gridColumn: 'span 2'
//         }}
//       />
//       <Skeleton 
//         variant="rectangular" 
//         height={40}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px',
//           gridColumn: 'span 2'
//         }}
//       />
//       <Skeleton 
//         variant="rectangular" 
//         height={40}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//       <Skeleton 
//         variant="rectangular" 
//         height={40}
//         sx={{ 
//           bgcolor: 'rgba(255, 255, 255, 0.1)',
//           borderRadius: '12px'
//         }}
//       />
//     </Box>
//   </Box>
// );

const PageSkeleton = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header Skeleton */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 3,
        px: 4
      }}>
        <Skeleton 
          variant="text" 
          width={300} 
          height={48} 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            display: { xs: 'none', lg: 'block' }
          }} 
        />
      </Box>

      {/* Main Content Grid */}
      <div className={`grid gap-2 p-2 ${
        isSmallScreen || isTablet 
          ? 'grid-cols-1' 
          : 'grid-cols-[350px,1fr]'
      }`}>
        {/* Filter Panel Skeleton */}
        <div className={`${
          isSmallScreen || isTablet 
            ? 'h-auto max-h-[40vh]' 
            : 'h-[calc(100vh-160px)]'
        }`}>
          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 2,
            height: '100%'
          }}>
            {/* Filter Controls Skeleton */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={48}
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
                />
              ))}
              
              {/* Action Buttons Skeleton */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    width={i === 0 ? '50%' : '25%'}
                    height={40}
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </div>

        {/* Table/Cards Section Skeleton */}
        <div className={`${
          isSmallScreen || isTablet 
            ? 'h-[calc(60vh-1rem)]' 
            : 'h-[calc(100vh-160px)]'
        }`}>
          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 2,
            height: '100%'
          }}>
            {isTablet || isSmallScreen ? (
              // Mobile/Tablet Card View Skeleton
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={180}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2
                    }}
                  />
                ))}
              </Box>
            ) : (
              // Desktop Table View Skeleton
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Table Header */}
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
                
                {/* Table Rows */}
                {[...Array(8)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={52}
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
                  />
                ))}
                
                {/* Table Footer */}
                <Skeleton
                  variant="rectangular"
                  height={52}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0 0 8px 8px'
                  }}
                />
              </Box>
            )}
          </Box>
        </div>
      </div>

      {/* Shimmer Effect Animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .MuiSkeleton-root {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2),
            rgba(255, 255, 255, 0.1)
          ) !important;
          background-size: 1000px 100% !important;
          animation: shimmer 2s infinite linear !important;
        }
      `}</style>
    </div>
  );
};

export default PageSkeleton;
