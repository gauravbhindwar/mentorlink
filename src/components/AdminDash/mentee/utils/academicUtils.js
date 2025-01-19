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
