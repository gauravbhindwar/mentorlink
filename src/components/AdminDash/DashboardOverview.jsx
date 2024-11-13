import { Card, Grid, Typography, Box } from '@mui/material';

const DashboardOverview = () => {
  const stats = {
    totalMentors: 45,
    totalMentees: 120,
    activeAssignments: 89,
    pendingAssignments: 12
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Dashboard Overview</Typography>
      <Grid container spacing={3}>
        {Object.entries(stats).map(([key, value]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3">{value}</Typography>
              <Typography variant="subtitle1">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardOverview;