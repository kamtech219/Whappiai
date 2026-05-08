/**
 * Utility functions for formatting strings
 */

/**
 * Extracts the username part from an email or JID, avoiding array allocations.
 * If there is no '@', it returns the original string.
 * @param {string} str - The email or JID string
 * @returns {string} - The extracted username or original string
 */
function getUsername(str) {
    if (!str) return '';
    const idx = str.indexOf('@');
    return idx === -1 ? str : str.substring(0, idx);
}

module.exports = {
    getUsername
};
