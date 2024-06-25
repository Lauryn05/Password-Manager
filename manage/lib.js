const crypto = require('crypto');

/**
 * Converts a string to an ArrayBuffer.
 */
function stringToBuffer(str) {
  return Buffer.from(str, 'utf-8');
}

/**
 * Converts an ArrayBuffer to a string.
 */
function bufferToString(buffer) {
  return Buffer.from(buffer).toString('utf-8');
}

/**
 * Encodes a buffer to a base64 string.
 */
function encodeBuffer(buffer) {
  return buffer.toString('base64');
}

/**
 * Decodes a base64 string to a buffer.
 */
function decodeBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

/**
 * Generates random bytes of specified length.
 */
function getRandomBytes(length) {
  return crypto.randomBytes(length);
}

module.exports = {
  stringToBuffer,
  bufferToString,
  encodeBuffer,
  decodeBuffer,
  getRandomBytes
};
