const API_BASE_URL = 'http://localhost:3000/credentials';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadCredentials();
    setupEventListeners();
});

// Global variables for share functionality
let currentShareCredential = null;
let currentShareUrl = null;

// Setup event listeners
function setupEventListeners() {
    // Issue credential form
    document.getElementById('issueForm').addEventListener('submit', handleIssueCredential);
    
    // Verify credential form
    document.getElementById('verifyForm').addEventListener('submit', handleVerifyCredential);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const credentialModal = document.getElementById('credentialModal');
        const shareModal = document.getElementById('shareModal');
        if (event.target === credentialModal) {
            closeModal('credentialModal');
        }
        if (event.target === shareModal) {
            closeModal('shareModal');
        }
    });
}

// Load all credentials
async function loadCredentials() {
    try {
        const response = await fetch(API_BASE_URL);
        const credentials = await response.json();
        displayCredentials(credentials);
    } catch (error) {
        console.error('Error loading credentials:', error);
        showError('Failed to load credentials');
    }
}

// Display credentials in the list
function displayCredentials(credentials) {
    const listContainer = document.getElementById('credentialsList');
    
    if (credentials.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No credentials yet. Issue your first credential above!</p>';
        return;
    }
    
    listContainer.innerHTML = credentials.map(cred => `
        <div class="credential-item">
            <div class="credential-info">
                <h3>${escapeHtml(cred.type)}</h3>
                <p>Issued: ${new Date(cred.issuedAt).toLocaleDateString()}</p>
                <p>ID: ${cred.id.substring(0, 8)}...</p>
            </div>
            <div class="credential-actions">
                <button class="btn btn-small btn-primary" onclick="viewCredential('${cred.id}')">View</button>
                <button class="btn btn-small btn-secondary" onclick="shareCredential('${cred.id}')">Share</button>
                <button class="btn btn-small btn-danger" onclick="deleteCredential('${cred.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Handle issue credential form submission
async function handleIssueCredential(e) {
    e.preventDefault();
    
    const type = document.getElementById('credentialType').value;
    const claimsJson = document.getElementById('claimsJson').value;
    
    try {
        const claims = JSON.parse(claimsJson);
        
        const response = await fetch(`${API_BASE_URL}/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, claims }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to issue credential');
        }
        
        const credential = await response.json();
        
        // Reset form
        document.getElementById('issueForm').reset();
        
        // Reload credentials
        loadCredentials();
        
        // Show success message
        alert(`Credential "${type}" issued successfully!`);
        
    } catch (error) {
        console.error('Error issuing credential:', error);
        alert('Error issuing credential. Please check your JSON format.');
    }
}

// Handle verify credential form submission
async function handleVerifyCredential(e) {
    e.preventDefault();
    
    const verifyJson = document.getElementById('verifyJson').value;
    const resultDiv = document.getElementById('verifyResult');
    
    try {
        const credential = JSON.parse(verifyJson);
        
        const response = await fetch(`${API_BASE_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential }),
        });
        
        const result = await response.json();
        
        if (result.valid) {
            resultDiv.className = 'verify-result valid';
            resultDiv.innerHTML = '<strong>✓ Valid Credential</strong><p>The credential signature is valid and has not been tampered with.</p>';
        } else {
            resultDiv.className = 'verify-result invalid';
            resultDiv.innerHTML = `<strong>✗ Invalid Credential</strong><p>${result.error || 'Verification failed'}</p>`;
        }
        
    } catch (error) {
        resultDiv.className = 'verify-result invalid';
        resultDiv.innerHTML = '<strong>✗ Error</strong><p>Invalid JSON format. Please check your input.</p>';
    }
}

// View credential details
async function viewCredential(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const credential = await response.json();
        
        if (credential.error) {
            alert('Credential not found');
            return;
        }
        
        const detailsDiv = document.getElementById('credentialDetails');
        const credentialJson = JSON.stringify(credential, null, 2);
        detailsDiv.innerHTML = `
            <h3>${escapeHtml(credential.type)}</h3>
            <p><strong>ID:</strong> ${credential.id}</p>
            <p><strong>Issuer:</strong> ${credential.issuer}</p>
            <p><strong>Issued At:</strong> ${new Date(credential.issuedAt).toLocaleString()}</p>
            <h4>Claims:</h4>
            <div class="json-display">${JSON.stringify(credential.claims, null, 2)}</div>
            <h4>Full Credential JSON:</h4>
            <div class="json-display">${JSON.stringify(credential, null, 2)}</div>
            <button class="btn copy-btn" id="copyCredentialBtn">Copy JSON</button>
        `;
        
        // Attach event listener to the copy button
        document.getElementById('copyCredentialBtn').addEventListener('click', () => {
            copyToClipboard(credentialJson);
        });
        
        document.getElementById('credentialModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error viewing credential:', error);
        alert('Failed to load credential details');
    }
}

// Share credential
async function shareCredential(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const credential = await response.json();
        
        if (credential.error) {
            alert('Credential not found');
            return;
        }
        
        const credentialJson = JSON.stringify(credential, null, 2);
        
        // Generate a shareable link
        const baseUrl = window.location.origin || 'http://localhost:8080';
        const shareUrl = `${baseUrl}${window.location.pathname}?credential=${encodeURIComponent(credentialJson)}`;
        
        // Store for use in modal
        currentShareCredential = credentialJson;
        currentShareUrl = shareUrl;
        
        // Display share URL in modal
        document.getElementById('shareUrlDisplay').textContent = shareUrl;
        
        // Show the share modal
        document.getElementById('shareModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error sharing credential:', error);
        alert('Failed to share credential');
    }
}

// Copy JSON from share modal
async function copyShareJson() {
    if (currentShareCredential) {
        await copyToClipboard(currentShareCredential);
    }
}

// Copy URL from share modal
async function copyShareUrl() {
    if (currentShareUrl) {
        await copyToClipboard(currentShareUrl);
    }
}

// Delete credential
async function deleteCredential(id) {
    if (!confirm('Are you sure you want to delete this credential?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadCredentials();
            alert('Credential deleted successfully');
        } else {
            alert('Failed to delete credential');
        }
        
    } catch (error) {
        console.error('Error deleting credential:', error);
        alert('Failed to delete credential');
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        // Use modern Clipboard API (supported in all modern browsers)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
            return;
        }
    } catch (error) {
        console.warn('Clipboard API failed:', error);
    }
    
    const userConfirmed = confirm(
        'Automatic copy failed. Please copy the text manually.\n\n' +
        'Click OK to see the text in a prompt, then copy it.'
    );
    
    if (userConfirmed) {
        prompt('Copy this text:', text);
    }
}

// Close modal
function closeModal(modalId) {
    if (modalId) {
        document.getElementById(modalId).style.display = 'none';
    } else {
        // Fallback for backward compatibility
        document.getElementById('credentialModal').style.display = 'none';
        document.getElementById('shareModal').style.display = 'none';
    }
    
    // Clear share data when closing share modal
    if (modalId === 'shareModal') {
        currentShareCredential = null;
        currentShareUrl = null;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check for credential in URL (for sharing)
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const credentialParam = urlParams.get('credential');
    
    if (credentialParam) {
        try {
            const credential = JSON.parse(decodeURIComponent(credentialParam));
            document.getElementById('verifyJson').value = JSON.stringify(credential, null, 2);
            // Auto-verify
            setTimeout(() => {
                document.getElementById('verifyForm').dispatchEvent(new Event('submit'));
            }, 500);
        } catch (error) {
            console.error('Error parsing credential from URL:', error);
        }
    }
});

