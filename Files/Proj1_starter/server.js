const express = require('express');
const bodyParser = require('body-parser');
const { Keychain } = require('./password-manager');

const app = express();
app.use(bodyParser.json());
let keychain = null;

app.post('/init', async (req, res) => {
  const { password } = req.body;
  keychain = await Keychain.init(password);
  res.send({ status: 'Keychain initialized' });
});

app.post('/load', async (req, res) => {
  const { password, repr, trustedDataCheck } = req.body;
  try {
    keychain = await Keychain.load(password, repr, trustedDataCheck);
    res.send({ status: 'Keychain loaded' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.post('/set', async (req, res) => {
  const { name, value } = req.body;
  if (keychain) {
    try {
      await keychain.set(name, value);
      res.send({ status: 'Entry set' });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  } else {
    res.status(400).send({ error: 'Keychain not initialized' });
  }
});

app.get('/get/:name', async (req, res) => {
  const name = req.params.name;
  if (keychain) {
    try {
      const value = await keychain.get(name);
      res.send({ value });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  } else {
    res.status(400).send({ error: 'Keychain not initialized' });
  }
});

app.post('/remove', async (req, res) => {
  const { name } = req.body;
  if (keychain) {
    try {
      const result = await keychain.remove(name);
      res.send({ result });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  } else {
    res.status(400).send({ error: 'Keychain not initialized' });
  }
});

app.get('/dump', async (req, res) => {
  if (keychain) {
    try {
      const repr = await keychain.dump();
      res.send({ repr });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  } else {
    res.status(400).send({ error: 'Keychain not initialized' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
