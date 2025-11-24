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
        const credentials = await apiService.getAllCredentials();
        displayCredentials(credentials);
    } catch (error) {
        console.error('Error loading credentials:', error);
        uiService.showAlert('Failed to load credentials');
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
                <h3>${uiService.escapeHtml(cred.type)}</h3>
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
        
        await apiService.issueCredential(type, claims);
        
        // Reset form
        document.getElementById('issueForm').reset();
        
        // Reload credentials
        loadCredentials();
        
        // Show success message
        uiService.showAlert(`Credential "${type}" issued successfully!`);
        
    } catch (error) {
        console.error('Error issuing credential:', error);
        uiService.showAlert('Error issuing credential. Please check your JSON format.');
    }
}

// Handle verify credential form submission
async function handleVerifyCredential(e) {
    e.preventDefault();
    
    const verifyJson = document.getElementById('verifyJson').value;
    const resultDiv = document.getElementById('verifyResult');
    
    try {
        const credential = JSON.parse(verifyJson);
        
        const result = await apiService.verifyCredential(credential);
        
        if (result.valid) {
            resultDiv.className = 'verify-result valid';
            resultDiv.innerHTML = '<strong>✓ Valid Credential</strong><p>The credential signature is valid and has not been tampered with.</p>';
        } else {
            resultDiv.className = 'verify-result invalid';
            resultDiv.innerHTML = `<strong>✗ Invalid Credential</strong><p>${uiService.escapeHtml(result.error || 'Verification failed')}</p>`;
        }
        
    } catch (error) {
        resultDiv.className = 'verify-result invalid';
        resultDiv.innerHTML = '<strong>✗ Error</strong><p>Invalid JSON format. Please check your input.</p>';
    }
}

// View credential details
async function viewCredential(id) {
    try {
        const credential = await apiService.getCredential(id);
        
        if (credential.error) {
            uiService.showAlert('Credential not found');
            return;
        }
        
        const detailsDiv = document.getElementById('credentialDetails');
        const credentialJson = JSON.stringify(credential, null, 2);
        detailsDiv.innerHTML = `
            <h3>${uiService.escapeHtml(credential.type)}</h3>
            <p><strong>ID:</strong> ${uiService.escapeHtml(credential.id)}</p>
            <p><strong>Issuer:</strong> ${uiService.escapeHtml(credential.issuer)}</p>
            <p><strong>Issued At:</strong> ${uiService.escapeHtml(new Date(credential.issuedAt).toLocaleString())}</p>
            <h4>Claims:</h4>
            <div class="json-display">${uiService.escapeHtml(JSON.stringify(credential.claims, null, 2))}</div>
            <h4>Full Credential JSON:</h4>
            <div class="json-display">${uiService.escapeHtml(credentialJson)}</div>
            <button class="btn copy-btn" id="copyCredentialBtn">Copy JSON</button>
        `;
        
        // Attach event listener to the copy button
        document.getElementById('copyCredentialBtn').addEventListener('click', () => {
            copyToClipboard(credentialJson);
        });
        
        uiService.showModal('credentialModal');
        
    } catch (error) {
        console.error('Error viewing credential:', error);
        uiService.showAlert('Failed to load credential details');
    }
}

// Share credential
async function shareCredential(id) {
    try {
        const credential = await apiService.getCredential(id);
        
        if (credential.error) {
            uiService.showAlert('Credential not found');
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
        uiService.showModal('shareModal');
        
    } catch (error) {
        console.error('Error sharing credential:', error);
        uiService.showAlert('Failed to share credential');
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
    if (!uiService.showConfirm('Are you sure you want to delete this credential?')) {
        return;
    }
    
    try {
        const result = await apiService.deleteCredential(id);
        
        if (result.success) {
            loadCredentials();
            uiService.showAlert('Credential deleted successfully');
        } else {
            uiService.showAlert('Failed to delete credential');
        }
        
    } catch (error) {
        console.error('Error deleting credential:', error);
        uiService.showAlert('Failed to delete credential');
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        // Use modern Clipboard API (supported in all modern browsers)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            uiService.showAlert('Copied to clipboard!');
            return;
        }
    } catch (error) {
        console.warn('Clipboard API failed:', error);
    }
    
    const userConfirmed = uiService.showConfirm(
        'Automatic copy failed. Please copy the text manually.\n\n' +
        'Click OK to see the text in a prompt, then copy it.'
    );
    
    if (userConfirmed) {
        uiService.showPrompt('Copy this text:', text);
    }
}

// Close modal
function closeModal(modalId) {
    if (modalId) {
        uiService.hideModal(modalId);
    } else {
        // Fallback for backward compatibility
        uiService.hideModal('credentialModal');
        uiService.hideModal('shareModal');
    }
    
    // Clear share data when closing share modal
    if (modalId === 'shareModal') {
        currentShareCredential = null;
        currentShareUrl = null;
    }
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

