/**
 * Password Validation Utility
 * 
 * Requirements:
 * - At least 8 characters long
 * - At least one uppercase or lowercase letter
 * - At least one number
 * - At least one special character
 * - No more than 3 consecutive same characters (e.g., 'aaaa' is not allowed, but 'aaa' is ok)
 */

/**
 * Validates password against all requirements
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Check for at least one letter (uppercase or lowercase)
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check for more than 3 consecutive same characters
  if (/(.)\1{3,}/.test(password)) {
    errors.push("Password must not contain more than 3 consecutive same characters");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Gets password strength level
 * @param {string} password - The password to check
 * @returns {string} - 'weak', 'medium', 'strong'
 */
export const getPasswordStrength = (password) => {
  const { isValid } = validatePassword(password);
  
  if (!isValid) return 'weak';
  
  let strength = 0;
  
  // Additional strength checks
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/.test(password)) strength++;
  if (password.length >= 16) strength++;
  
  if (strength >= 3) return 'strong';
  if (strength >= 1) return 'medium';
  return 'weak';
};

/**
 * Real-time password validation regex (for use in forms)
 */
export const passwordRegex = {
  minLength: /.{8,}/,
  hasLetter: /[a-zA-Z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  noConsecutive: /^(?!.*(.)\1{3,}).*$/
};
