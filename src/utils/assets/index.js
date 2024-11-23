
export const getMUJLogo = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/muj-logo.svg`;
  }
  return '/muj-logo.svg';
};