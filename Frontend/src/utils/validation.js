// Validation utilities
export const validators = {
  required: (value) => (!value ? "This field is required" : ""),
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value ? "Email is required" : !emailRegex.test(value) ? "Please enter a valid email" : "";
  },
  phone: (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return !value ? "Phone number is required" : !phoneRegex.test(value) ? "Please enter a valid phone number" : "";
  },
  minLength: (min) => (value) => {
    return value && value.length < min ? `Must be at least ${min} characters` : "";
  },
  maxLength: (max) => (value) => {
    return value && value.length > max ? `Must be no more than ${max} characters` : "";
  },
  numeric: (value) => {
    return value && isNaN(value) ? "Must be a number" : "";
  },
  positive: (value) => {
    return value && parseFloat(value) <= 0 ? "Must be a positive number" : "";
  },
};

// Form validation helper
export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach((field) => {
    const value = data[field];
    const fieldValidators = schema[field];
    
    if (Array.isArray(fieldValidators)) {
      for (const validator of fieldValidators) {
        const error = validator(value);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    } else if (typeof fieldValidators === "function") {
      const error = fieldValidators(value);
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
