/**
 * UI Service - Handles DOM manipulation and UI updates
 */

class UIService {
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showAlert(message) {
    alert(message);
  }

  showConfirm(message) {
    return confirm(message);
  }

  showPrompt(message, defaultValue) {
    return prompt(message, defaultValue);
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }
}

const uiService = new UIService();

