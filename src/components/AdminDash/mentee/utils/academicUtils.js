export const calculateCurrentSemester = (yearOfRegistration) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  let yearsCompleted = currentYear - yearOfRegistration;
  let semesterInCurrentYear;
  if (currentMonth >= 8 && currentMonth <= 11) {
    semesterInCurrentYear = 1;
  } else if ((currentMonth >= 12) || (currentMonth >= 1 && currentMonth <= 6)) {
    semesterInCurrentYear = 2;
  } else {
    semesterInCurrentYear = 2;
  }
  let totalSemesters = (yearsCompleted * 2) + semesterInCurrentYear;
  return Math.min(totalSemesters, 8);
};

export const getCurrentAcademicYear = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
};

export const generateAcademicSessions = (academicYear) => {
  if (!academicYear) return [];
  const [startYear, endYear] = academicYear.split('-');
  return [
    `JULY-DECEMBER ${startYear}`,
    `JANUARY-JUNE ${endYear}`
  ];
};

export const generateSemesterOptions = (academicSession) => {
  if (!academicSession) return [];
  const sessionParts = academicSession.split(' ');
  const sessionPeriod = sessionParts[0];
  if (sessionPeriod === 'JULY-DECEMBER') {
    return [1, 3, 5, 7];
  } else if (sessionPeriod === 'JANUARY-JUNE') {
    return [2, 4, 6, 8];
  }
  return [];
};

export const determineAcademicPeriod = () => {
  // Try to get from localStorage first
  const storedPeriod = localStorage.getItem('academicPeriod');
  if (storedPeriod) {
    return JSON.parse(storedPeriod);
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

  let academicYear, academicSession;

  // Determine academic year (e.g., "2023-2024")
  if (currentMonth >= 7) { // July onwards
    academicYear = `${currentYear}-${currentYear + 1}`;
  } else {
    academicYear = `${currentYear - 1}-${currentYear}`;
  }

  // Determine academic session
  if (currentMonth >= 7 && currentMonth <= 12) {
    academicSession = `JULY-DECEMBER ${currentYear}`;
  } else {
    academicSession = `JANUARY-JUNE ${currentYear}`;
  }

  // Store in localStorage
  const academicPeriod = { academicYear, academicSession };
  localStorage.setItem('academicPeriod', JSON.stringify(academicPeriod));

  return academicPeriod;
};

export const clearAcademicPeriodCache = () => {
  localStorage.removeItem('academicPeriod');
};
