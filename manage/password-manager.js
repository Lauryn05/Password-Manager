"use strict";

/********* External Imports ********/

const { stringToBuffer, bufferToString, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;
const crypto = require('crypto');

/********* Constants ********/

const PBKDF2_ITERATIONS = 100000; // number of iterations for PBKDF2 algorithm

/********* Implementation ********/
class Keychain {
  constructor(data, secrets) {
    this.data = data || { entries: {} };
    this.secrets = secrets || {};
  }

  static async init(password) {
    const salt = getRandomBytes(16);
    const key = await this.#deriveKey(password, salt);
    return new Keychain(
      { salt: bufferToString(salt), entries: {} },
      { key }
    );
  }

  static async load(password, repr, trustedDataCheck) {
    try {
      console.log('Load called with password:', password);
      console.log('Keychain representation:', repr);
  
      const [encryptedDataString, checksum] = JSON.parse(repr);
      console.log('Encrypted data:', encryptedDataString);
      console.log('Checksum:', checksum);
  
      if (trustedDataCheck && trustedDataCheck !== checksum) {
        throw new Error("Integrity check failed");
      }
  
      const encryptedData = stringToBuffer(encryptedDataString);
      const iv = encryptedData.slice(0, 12);
      const ciphertext = encryptedData.slice(12);
  
      console.log('IV:', iv);
  
      const key = await this.#deriveKey(password, iv);
      console.log('Derived key:', key);
  
      const decryptedData = await subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        ciphertext
      );
  
      const dataString = bufferToString(decryptedData);
      const data = JSON.parse(dataString);
  
      console.log('Decrypted data:', data);
  
      return new Keychain(data, { key });
    } catch (error) {
      console.error('Error in Keychain.load:', error);
      throw error;
    }
  }  

  async dump() {
    const dataString = JSON.stringify(this.data);
    const iv = getRandomBytes(12);
    const encryptedData = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.secrets.key,
      stringToBuffer(dataString)
    );

    const encryptedBytes = new Uint8Array(encryptedData);
    const combinedData = Buffer.concat([iv, encryptedBytes]);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    return JSON.stringify([bufferToString(combinedData), checksum]);
  }

  async get(name) {
    if (!this.data.entries[name]) {
      return null;
    }
    const encryptedData = stringToBuffer(this.data.entries[name]);
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    const decryptedData = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.secrets.key,
      ciphertext
    );
    return bufferToString(decryptedData);
  }

  async set(name, value) {
    const iv = getRandomBytes(12);
    const encryptedData = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.secrets.key,
      stringToBuffer(value)
    );
    const combinedData = Buffer.concat([iv, new Uint8Array(encryptedData)]);
    this.data.entries[name] = bufferToString(combinedData);
  }

  async remove(name) {
    if (this.data.entries[name]) {
      delete this.data.entries[name];
      return true;
    }
    return false;
  }

  static async #deriveKey(password, salt) {
    const keyMaterial = await subtle.importKey(
      "raw",
      stringToBuffer(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
}

module.exports = { Keychain };