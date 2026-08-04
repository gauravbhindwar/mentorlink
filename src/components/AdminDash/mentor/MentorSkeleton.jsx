import { Skeleton } from "@mui/material";

const MentorSkeleton = () => {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="flex items-center px-6 py-4 border-b border-white/10">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex-1">
            <Skeleton
              variant="text"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                width: '80%',
                height: 24
              }}
            />
          </div>
        ))}
      </div>

      {/* Rows Skeleton */}
      {[...Array(8)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center px-6 py-4 border-b border-white/5 hover:bg-white/5"
        >
          {[...Array(6)].map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton
                variant="text"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  width: colIndex === 0 ? '40%' : '60%',
                  height: 20
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MentorSkeleton;
