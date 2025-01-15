
export function getCurrentAcademicYear() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // If current month is after June, academic year starts in current year
  // Otherwise, academic year started in previous year
  const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  
  return { startYear, endYear };
}