import React from 'react';
import { Box, Skeleton } from '@mui/material';

const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <Skeleton
              variant="text"
              width="40%"
              height={24}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
          
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width={`${Math.random() * (95 - 70) + 70}%`}
                height={20}
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
              />
            ))}
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Skeleton
              variant="rounded"
              width={60}
              height={32}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Skeleton
              variant="rounded"
              width={60}
              height={32}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
        </Box>
      ))}
    </div>
  );
};

export default CardSkeleton;
