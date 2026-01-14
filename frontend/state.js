// Global app state (simple and serializable)
window.AppState = {
  user: JSON.parse(localStorage.getItem('synapse_user')) || null, // {id, name, role, organization}
  auth: {
    isAuthenticated: !!localStorage.getItem('synapse_token'),
    token: localStorage.getItem('synapse_token') || null
  },
  ui: {
    sidebarCollapsed: false,
    currentTheme: 'dark',
    activeView: null,
    viewMode: 'default' // e.g., 'edit', 'preview', 'view'
  },
  course: null,
  lesson: null,
  
  get(prop) {
    return this[prop];
  },

  setContext(ctx) {
    if (ctx.course !== undefined) this.course = ctx.course;
    if (ctx.lesson !== undefined) this.lesson = ctx.lesson;
    if (ctx.user !== undefined) {
      this.user = ctx.user;
      localStorage.setItem('synapse_user', JSON.stringify(ctx.user));
    }
    if (ctx.auth !== undefined) {
      this.auth = { ...this.auth, ...ctx.auth };
      if (ctx.auth.token) localStorage.setItem('synapse_token', ctx.auth.token);
      if (ctx.auth.isAuthenticated === false) {
        localStorage.removeItem('synapse_token');
        localStorage.removeItem('synapse_user');
      }
    }
    this.renderBreadcrumb();
  },

  logout() {
    this.setContext({
      auth: { isAuthenticated: false, token: null },
      user: null
    });
    localStorage.clear();
    sessionStorage.clear();
    // Forçamos o reload para garantir limpeza total de memória e bundles protegidos
    window.location.href = '/auth';
  },

  renderBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    if(!bc) return;
    const parts = ['Synapse'];
    if (this.course) parts.push(this.course.title || 'Curso');
    if (this.lesson) parts.push(this.lesson.title || 'Aula');
    bc.innerText = parts.join(' / ');
  }
  ,

  /* Global loader controls: use AppState.showLoader(message?) and AppState.hideLoader() */
  showLoader(message) {
    try {
      if (window.UIManager && typeof window.UIManager.showLoader === 'function') {
        return window.UIManager.showLoader(message);
      }
      const el = document.getElementById('global-loader');
      const msg = document.getElementById('global-loader-message');
      if (msg && message) msg.textContent = message;
      if (el) {
        el.classList.remove('hidden');
        el.setAttribute('aria-hidden', 'false');
      }
    } catch (e) { console.warn('showLoader error', e); }
  },

  hideLoader() {
    try {
      if (window.UIManager && typeof window.UIManager.hideLoader === 'function') {
        return window.UIManager.hideLoader();
      }
      const el = document.getElementById('global-loader');
      const msg = document.getElementById('global-loader-message');
      if (el) {
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
      }
      if (msg) msg.textContent = 'Carregando...';
    } catch (e) { console.warn('hideLoader error', e); }
  }
};

window.addEventListener('DOMContentLoaded', () => AppState.renderBreadcrumb());
// ensure body classes reflect saved auth on load
window.addEventListener('DOMContentLoaded', () => {
  if (window.AppState && window.AppState.auth && window.AppState.auth.isAuthenticated) {
    document.body.classList.add('authenticated');
    document.body.classList.remove('unauthenticated');
  } else {
    document.body.classList.add('unauthenticated');
    document.body.classList.remove('authenticated');
  }
});

/* Convenience fetch wrapper that shows the global loader while the request is pending.
   Usage: window.fetchWithLoader(url, options, { message, autoHide=true })
*/
window.fetchWithLoader = async function(resource, options = {}, opts = {}) {
  const { message = 'Carregando...', autoHide = true } = opts;
  try {
    if (window.FetchService && typeof window.FetchService.fetchWithLoader === 'function') {
      return await window.FetchService.fetchWithLoader(resource, options, { message, autoHide });
    }
    AppState.showLoader(message);
    const resp = await fetch(resource, options);
    return resp;
  } catch (err) {
    throw err;
  } finally {
    if (autoHide) AppState.hideLoader();
  }
};

