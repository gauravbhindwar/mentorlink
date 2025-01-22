// Import everything from mentee's academicUtils
import {
  determineAcademicPeriod,
  determineAcademicPeriodServer,
  clearAcademicPeriodCache,
  generateAcademicSessions,
  getCurrentAcademicYear
} from '../../mentee/utils/academicUtils';

// Re-export all the utilities
export {
  determineAcademicPeriod,
  determineAcademicPeriodServer,
  clearAcademicPeriodCache,
  generateAcademicSessions,
  getCurrentAcademicYear
};

// Keep only mentor-specific utilities if needed
export const validateAcademicYear = (value) => {
  if (!value || typeof value !== 'string') return false;
  const regex = /^(\d{4})-(\d{4})$/;
  if (!regex.test(value)) return false;
  const [startYear, endYear] = value.split('-').map(Number);
  return !isNaN(startYear) && !isNaN(endYear) && endYear === startYear + 1;
};

export const generateYearSuggestions = (input) => {
  if (!input) return [];
  const currentYear = new Date().getFullYear();
  const suggestions = [];
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    const academicYear = `${year}-${year + 1}`;
    if (academicYear.startsWith(input)) {
      suggestions.push(academicYear);
    }
  }
  return suggestions;
};
