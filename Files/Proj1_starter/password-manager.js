"use strict";

/********* External Imports ********/

const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require('crypto').webcrypto;
const crypto = require('crypto');

/********* Constants ********/

const PBKDF2_ITERATIONS = 100000; // number of iterations for PBKDF2 algorithm
const MAX_PASSWORD_LENGTH = 64;   // we can assume no password is longer than this many characters

/********* Implementation ********/
class Keychain {
  /**
   * Initializes the keychain using the provided information. Note that external
   * users should likely never invoke the constructor directly and instead use
   * either Keychain.init or Keychain.load. 
   * Arguments:
   *  You may design the constructor with any parameters you would like. 
   * Return Type: void
   */
  constructor(data, secrets) {
    this.data = data || {};
    this.secrets = secrets || {};
  }

  /** 
    * Creates an empty keychain with the given password.
    *
    * Arguments:
    *   password: string
    * Return Type: Keychain
    */
  static async init(password) {
    const salt = getRandomBytes(16);
    const key = await this.#deriveKey(password, salt);
    return new Keychain(
      { salt: bufferToString(salt), entries: {} },
      { key }
    );
  }

  /**
    * Loads the keychain state from the provided representation (repr). The
    * repr variable will contain a JSON encoded serialization of the contents
    * of the KVS (as returned by the dump function). The trustedDataCheck
    * is an *optional* SHA-256 checksum that can be used to validate the 
    * integrity of the contents of the KVS. If the checksum is provided and the
    * integrity check fails, an exception should be thrown. You can assume that
    * the representation passed to load is well-formed (i.e., it will be
    * a valid JSON object).Returns a Keychain object that contains the data
    * from repr. 
    *
    * Arguments:
    *   password:           string
    *   repr:               string
    *   trustedDataCheck: string
    * Return Type: Keychain
    */
  static async load(password, repr, trustedDataCheck) {
    const [encryptedDataString, checksum] = JSON.parse(repr);
    if (trustedDataCheck && trustedDataCheck !== checksum) {
      throw new Error("Integrity check failed");
    }

    const encryptedData = stringToBuffer(encryptedDataString);
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const key = await this.#deriveKey(password, iv);
    const decryptedDataString = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const dataString = bufferToString(decryptedDataString);
    const data = JSON.parse(dataString);
    return new Keychain(data, { key });
  }

  /**
    * Returns a JSON serialization of the contents of the keychain that can be 
    * loaded back using the load function. The return value should consist of
    * an array of two strings:
    *   arr[0] = JSON encoding of password manager
    *   arr[1] = SHA-256 checksum (as a string)
    * As discussed in the handout, the first element of the array should contain
    * all of the data in the password manager. The second element is a SHA-256
    * checksum computed over the password manager to preserve integrity.
    *
    * Return Type: array
    */ 
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

    const combinedData = Buffer.concat([iv, new Uint8Array(encryptedData)]);
    const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
    return JSON.stringify([bufferToString(combinedData), checksum]);
  }

  /**
    * Fetches the data (as a string) corresponding to the given domain from the KVS.
    * If there is no entry in the KVS that matches the given domain, then return
    * null.
    *
    * Arguments:
    *   name: string
    * Return Type: Promise<string>
    */
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

  /** 
  * Inserts the domain and associated data into the KVS. If the domain is
  * already in the password manager, this method should update its value. If
  * not, create a new entry in the password manager.
  *
  * Arguments:
  *   name: string
  *   value: string
  * Return Type: void
  */
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

  /**
    * Removes the record with name from the password manager. Returns true
    * if the record with the specified name is removed, false otherwise.
    *
    * Arguments:
    *   name: string
    * Return Type: Promise<boolean>
  */
  async remove(name) {
    if (this.data.entries[name]) {
      delete this.data.entries[name];
      return true;
    }
    return false;
  }

  /**
   * Helper function to derive a key from a password and salt
   * Arguments:
   *   password: string
   *   salt: ArrayBuffer
   * Return Type: Promise<CryptoKey>
   */
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
