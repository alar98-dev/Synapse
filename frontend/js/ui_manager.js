/* UIManager: object-oriented wrapper for global UI controls like the overlay loader */
(function(){
  class UIManager {
    constructor() {
      this.loaderId = 'global-loader';
      this.msgId = 'global-loader-message';
    }

    _getLoader() {
      return document.getElementById(this.loaderId);
    }

    _getMessageEl() {
      return document.getElementById(this.msgId);
    }

    showLoader(message = 'Carregando...') {
      const el = this._getLoader();
      const msg = this._getMessageEl();
      if (msg && message) msg.textContent = message;
      if (!el) return;
      el.classList.remove('hidden');
      el.setAttribute('aria-hidden', 'false');
    }

    hideLoader() {
      const el = this._getLoader();
      const msg = this._getMessageEl();
      if (!el) return;
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
      if (msg) msg.textContent = 'Carregando...';
    }
  }

  window.UIManager = new UIManager();
})();
