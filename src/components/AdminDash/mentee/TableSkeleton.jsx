import { Skeleton } from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const TableSkeleton = ({ rowsNum = 5 }) => {
  return (
    <TableContainer 
      component={Paper}
      sx={{
        backgroundColor: 'transparent',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        height: '100%'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            {/* Match your table headers */}
            {Array(7).fill(0).map((_, index) => (
              <TableCell key={index}>
                <Skeleton
                  animation="wave"
                  height={20}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&::after': {
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
                    }
                  }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array(rowsNum).fill(0).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array(7).fill(0).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton
                    animation="wave"
                    height={20}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&::after': {
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
                      }
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableSkeleton;
