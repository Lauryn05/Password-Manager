# Password-Manager
### Table of content
. Project Overview
. Installation and Setup
. SubtleCrypto API
. Key Processes
. Short-Answer Questions

### Project Overview
This is a simple secure password manager using Node.js, Express, and the SubtleCrypto API, which allows users to securely store, retrieve, and manage their passwords through various endpoints. The server uses AES-GCM encryption for secure data storage and retrieval, ensuring that passwords are protected at all times.

A keychain is implemented in password-manager.js and provides methods for initializing, loading, setting, getting, and removing entries. Keychain data is encrypted using AES-GCM, and keys are derived using PBKDF2 with a random salt.

## Installation and Setup
1. Clone the Repository
git clone https://github.com/Lauryn05/Password-Manager
cd Password-Manager/

2.	Install Dependencies
npm install

3.	Run the Server
node server.js

4.	Access the Application
Open your browser and go to http://localhost:3000

### SubtleCrypto API
GET /: Serves the index.html file.
POST /init: Initializes a new keychain with a given password.
 . Request body: { "password": "your_password" }
 . Response: { "message": "Keychain initialized", "data": < keychain-data> }
POST /load: Loads an existing keychain from keychain.json using a given password.
 . Request body: { "password": "your_password" }
 . Response: { "message": "Keychain loaded", "keychain": < keychain-data > }
POST /set: Sets a new entry in the keychain.
 .Request body: { "name": "entry_name", "value": "entry_value" }
 .Response: { "message": "Entry set" }
GET /get/: Retrieves an entry from the keychain.
 . Response: { "value": "entry_value" }
POST /remove: Removes an entry from the keychain.
 . Request body: { "name": "entry_name" }
 . Response: { "message": "Entry removed" }
GET /dump: Dumps the entire keychain.
 . Response: { "repr": < keychain-data > }

### Key Processes
1.	Initializing the Keychain: Creates a new keychain with a password that will be used to derive a cryptographic key for encryption.
    . Process:
    A random salt is generated.
    The password is used along with the salt to derive an encryption key using the PBKDF2 algorithm.
    An empty keychain is created and stored in memory.
    The keychain data (including the salt) is saved to a file (keychain.json).
2.	Loading an Existing Keychain: Loads an existing keychain from a file using a password.
    . Process:
    The keychain data is read from the file.
    The password and salt are used to derive the decryption key.
    The encrypted keychain data is decrypted using the derived key.
    The keychain is restored in memory.
3.	Setting an Entry in the Keychain: Stores a new password or secret in the keychain.
	. Process:
    The value (e.g., password) is encrypted using the key derived from the user's password.
    The encrypted value is stored in the keychain with the provided name as the key.
4.	Getting an Entry from the Keychain: Retrieve a stored password or secret from the keychain.
	. Process:
    The encrypted value is fetched from the keychain using the provided name.
    The value is decrypted using the derived key.
    The decrypted value is returned to the user.
5.	Removing an Entry from the Keychain: Delete a stored password or secret from the keychain.
	. Process: The entry is removed from the keychain data structure.
6.	Dumping the Keychain: Export the entire keychain data in an encrypted form.
	. Process:
	The keychain data is encrypted using the derived key.
	The encrypted data, along with the salt, is returned or saved to a file.

### Short-Answer Questions
1.	Briefly describe your method for preventing the adversary from learning information about the lengths of the passwords stored in your password manager.
The method involves encrypting passwords with a fixed-length IV and padding the ciphertext, making all entries appear the same length.

2.	Briefly describe your method for preventing swap attacks (Section 2.2). Provide an argument for why the attack is prevented in your scheme.
Swap attacks are prevented by including a checksum with each entry. This ensures that any modification to the encrypted data is detectable.

3.	In our proposed defense against the rollback attack (Section 2.2), we assume that we can store the SHA-256 hash in a trusted location beyond the reach of an adversary. Is it necessary to assume that such a trusted location exists, in order to defend against rollback attacks? Yes. Briefly justify your answer.
For storing the checksum to ensure data integrity. Without this, rollback attacks cannot be reliably prevented.

4.	Because HMAC is a deterministic MAC (that is, its output is the same if it is run multiple times with the same input), we were able to look up domain names using their HMAC values. There are also randomized MACs, which can output different tags on multiple runs with the same input. Explain how you would do the look up if you had to use a randomized MAC instead of HMAC. Is there a performance penalty involved, and if so, what?
Lookups with randomized MACs require storing an index for each entry, resulting in lower performance due to the additional storage and retrieval operations.

5.	In our specification, we leak the number of records in the password manager. Describe an approach to reduce the information leaked about the number of records. Specifically, if there are k records, your scheme should only leak log2(k) (that is, if k1 and k2 are such that log2(k1)   =   log2(k2) , the attacker should not be able to distinguish between a case where the true number of records is k1 and another case where the true number of records is k2).
Grouping entries and adding dummy entries ensures that the number of records falls within a specific range, only leaking log2(k) information.
 
6.	What is a way we can add multi-user support for specific sites to our password manager system without compromising security for other sites that these users may wish to store passwords of? That is, if Alice and Bob wish to access one stored password (say for nytimes) that either of them can get and update, without allowing the other to access their passwords for other websites.
Multi-user support is implemented by encrypting shared entries with a key derived from both users' passwords and a site-specific identifier, ensuring access control without compromising security for other entries.


