const express = require('express');
const fs = require('fs');
const { Keychain } = require('./password-manager');

const app = express();
const PORT = 3000;

let keychain; // Declare keychain variable outside the endpoint handlers

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the current directory

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

// Initialize a new keychain
app.post('/init', async (req, res) => {
    try {
        const { password } = req.body;
        keychain = await Keychain.init(password); // Initialize keychain and assign to variable
        const data = await keychain.dump();
        fs.writeFileSync('keychain.json', data);
        res.status(200).json({ message: 'Keychain initialized', data });
    } catch (error) {
        res.status(500).json({ message: 'Error initializing keychain', error: error.message });
    }
});

// Load an existing keychain
app.post('/load', async (req, res) => {
    try {
        const { password } = req.body;
        console.log('Password received for loading:', password);

        const repr = fs.readFileSync('keychain.json', 'utf8');
        console.log('Keychain data read from file:', repr);

        const keychain = await Keychain.load(password, repr);
        console.log('Keychain loaded successfully:', keychain);

        res.status(200).json({ message: 'Keychain loaded', keychain });
    } catch (error) {
        console.error('Error loading keychain:', error);
        res.status(500).json({ message: 'Error loading keychain', error: error.message });
    }
});


// Set an entry in the keychain
app.post('/set', async (req, res) => {
    try {
        const { name, value } = req.body;
        if (!name || !value) {
            throw new Error('Name and value are required');
        }
        await keychain.set(name, value); // Use the keychain instance to set the entry
        res.status(200).json({ message: 'Entry set' });
    } catch (error) {
        res.status(400).json({ message: 'Error setting entry', error: error.message });
    }
});

// Get an entry from the keychain
app.get('/get/:name', async (req, res) => {
    try {
        const name = req.params.name;
        const value = await keychain.get(name);
        if (value === null) {
            res.status(404).json({ message: 'Entry not found' });
        } else {
            res.status(200).json({ value });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error getting entry', error: error.message });
    }
});

// Remove an entry from the keychain
app.post('/remove', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await keychain.remove(name);
        if (result) {
            res.status(200).json({ message: 'Entry removed' });
        } else {
            res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error removing entry', error: error.message });
    }
});

// Dump the keychain
app.get('/dump', async (req, res) => {
    try {
        const repr = await keychain.dump();
        res.status(200).json({ repr });
    } catch (error) {
        res.status(400).json({ message: 'Error dumping keychain', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
