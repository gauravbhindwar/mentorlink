import React from 'react';
import { Card, CardContent, CardActions, Box, Skeleton } from '@mui/material';

const MentorCardSkeleton = ({ count = 3 }) => {
  return Array(count).fill(0).map((_, index) => (
    <Card
      key={index}
      sx={{
        width: '100%',
        bgcolor: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        mb: 2,
      }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Skeleton 
            variant="circular" 
            width={24} 
            height={24} 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
          />
          <Skeleton 
            variant="text" 
            width={200} 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton 
                variant="circular" 
                width={20} 
                height={20} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
              />
              <Skeleton 
                variant="text" 
                width={180} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
              />
            </Box>
          ))}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton 
            variant="circular" 
            width={40} 
            height={40} 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
          />
          <Skeleton 
            variant="circular" 
            width={40} 
            height={40} 
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
          />
        </Box>
        <Skeleton 
          variant="circular" 
          width={40} 
          height={40} 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
        />
      </CardActions>
    </Card>
  ));
};

export default MentorCardSkeleton;
