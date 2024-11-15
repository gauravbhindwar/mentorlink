
const validateMenteeFilters = (filters) => {
  const errors = [];

  if (!filters.year || ![1, 2, 3, 4].includes(filters.year)) {
    errors.push('Invalid year');
  }

  if (!filters.term || !['odd', 'even'].includes(filters.term)) {
    errors.push('Invalid term');
  }

  if (!filters.semester || ![1, 2, 3, 4, 5, 6, 7, 8].includes(filters.semester)) {
    errors.push('Invalid semester');
  }

  if (!filters.section || !['A', 'B', 'C', 'D'].includes(filters.section)) {
    errors.push('Invalid section');
  }

  return errors;
};

export default validateMenteeFilters;