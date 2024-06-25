const serverUrl = 'http://localhost:3000'; // Update this to match your server's URL

async function initKeychain() {
    const password = document.getElementById('init-password').value;
    const response = await fetch(`${serverUrl}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const result = await response.json();
    alert(result.status);
}

async function loadKeychain() {
    const password = document.getElementById('load-password').value;
    const repr = document.getElementById('load-repr').value;
    const trustedDataCheck = document.getElementById('load-checksum').value;
    const response = await fetch(`${serverUrl}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, repr, trustedDataCheck })
    });
    const result = await response.json();
    if (response.ok) {
        alert(result.status);
    } else {
        alert(result.error);
    }
}

async function setEntry() {
    const name = document.getElementById('set-name').value;
    const value = document.getElementById('set-value').value;
    const response = await fetch(`${serverUrl}/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value })
    });
    const result = await response.json();
    if (response.ok) {
        alert(result.status);
    } else {
        alert(result.error);
    }
}

async function getEntry() {
    const name = document.getElementById('get-name').value;
    const response = await fetch(`${serverUrl}/get/${name}`);
    const result = await response.json();
    if (response.ok) {
        document.getElementById('get-value').innerText = result.value;
    } else {
        alert(result.error);
    }
}

async function removeEntry() {
    const name = document.getElementById('remove-name').value;
    const response = await fetch(`${serverUrl}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const result = await response.json();
    if (response.ok) {
        alert(result.result ? 'Entry removed' : 'Entry not found');
    } else {
        alert(result.error);
    }
}

async function dumpKeychain() {
    const response = await fetch(`${serverUrl}/dump`);
    const result = await response.json();
    if (response.ok) {
        document.getElementById('dump-repr').value = JSON.stringify(result.repr);
    } else {
        alert(result.error);
    }
}
