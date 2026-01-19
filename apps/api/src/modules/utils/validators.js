/**
 * Input Validation Utilities
 * Common validation and sanitization functions
 */

class Validators {
  /**
   * Check if string is a valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized string
   */
  static sanitizeString(input, maxLength = 1000) {
    if (!input) {
      return '';
    }

    let sanitized = String(input).trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Check if string is a valid email
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if string is a valid phone number
   * @param {string} phone - Phone number
   * @returns {boolean} True if valid phone
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    // Check if it's 10 or 11 digits
    return /^1?\d{10}$/.test(cleaned);
  }

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number
   * @returns {string} Sanitized phone number
   */
  static sanitizePhone(phone) {
    if (!phone) {
      return '';
    }

    // Remove all non-numeric characters
    return String(phone).replace(/\D/g, '');
  }

  /**
   * Check if value is a positive integer
   * @param {any} value - Value to check
   * @returns {boolean} True if positive integer
   */
  static isPositiveInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Check if value is within range
   * @param {number} value - Value to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} True if within range
   */
  static isInRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string
   * @returns {string} Sanitized HTML
   */
  static sanitizeHtml(html) {
    if (!html) {
      return '';
    }

    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate date string
   * @param {string} dateStr - Date string
   * @returns {boolean} True if valid date
   */
  static isValidDate(dateStr) {
    if (!dateStr) {
      return false;
    }

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * Sanitize object by removing dangerous properties
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const dangerous = ['__proto__', 'constructor', 'prototype'];
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (!dangerous.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

module.exports = Validators;
