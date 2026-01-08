import { useState, useEffect, useCallback } from "react";

export function useForm(initialValues = {}, validationSchema = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    
    setValue(name, fieldValue);
    
    if (touched[name]) {
      validateField(name, fieldValue);
    }
  }, [touched, setValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
    validateField(name, values[name]);
  }, [values, setFieldTouched]);

  const validateField = useCallback((name, value) => {
    if (validationSchema[name]) {
      const error = validationSchema[name](value);
      setError(name, error);
      return !error;
    }
    return true;
  }, [validationSchema, setError]);

  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors = {};

    Object.keys(validationSchema).forEach((field) => {
      const error = validationSchema[field](values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validateForm]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setError,
    setTouched,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
  };
}
