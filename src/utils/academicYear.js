export function getCurrentAcademicYear() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const startYear = currentMonth > 6 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  
  return { startYear, endYear };
}

export function generateAcademicSessions(academicYear) {
  if (!academicYear) return [];
  
  const [startYear, endYear] = academicYear.split('-').map(Number);
  if (!startYear || !endYear) return [];
  
  return [
    `JULY-DECEMBER ${startYear}`,
    `JANUARY-JUNE ${endYear}`
  ];
}

export function validateAcademicYear(value) {
  if (!value || typeof value !== 'string') return false;
  
  const regex = /^(\d{4})-(\d{4})$/;
  if (!regex.test(value)) return false;
  
  const [startYear, endYear] = value.split('-').map(Number);
  return !isNaN(startYear) && !isNaN(endYear) && endYear === startYear + 1;
}

export function generateYearSuggestions(input) {
  if (!input) return [];
  
  const currentYear = new Date().getFullYear();
  const suggestions = [];
  
  // Generate last 5 years suggestions
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    const academicYear = `${year}-${year + 1}`;
    if (academicYear.startsWith(input)) {
      suggestions.push(academicYear);
    }
  }
  return suggestions;
}