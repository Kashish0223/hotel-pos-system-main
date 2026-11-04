/** 
 * Sets a cookie with the specified name, value, and expiration time.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 * @param {number|string|Date} [expTime] - The expiration time as a timestamp, ISO string, or Date object.
 */
export const setCookies = (name, value, expTime) => {
  let expires = "";
  if (expTime) {
    const expirationDate = new Date(expTime);
    expires = "; expires=" + expirationDate.toUTCString();
  }
  document.cookie = `${name}=${value}${expires}; path=/`;
};

/**
 * Retrieves the value of a specified cookie.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} - The value of the cookie, or null if not found.
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

/**
 * Removes a specified cookie by setting its expiration date to the past.
 * @param {string} name - The name of the cookie to remove.
 */
export const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};
