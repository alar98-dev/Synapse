/* app.js — Enterprise SPA Router */
(function(){
  // Rotas Públicas: Únicas acessíveis sem autenticação
  const publicRoutes = {
    '/auth': { view: 'auth.html', script: 'auth.js', shell: 'minimal' },
    '/support': { view: 'support.html', script: 'support.js', shell: 'minimal' }
  };


  const content = () => document.getElementById('content');
  const sidebarEl = () => document.getElementById('sidebar');
  const appShell = () => document.getElementById('app-shell');

    // Carregamento dinâmico de recursos protegidos
    async function ensureProtectedFeatures() {
      if (window.ProtectedApp) return true;
      if (!AppState.auth.isAuthenticated) return false;
      
      try {
        const script = document.createElement('script');
        script.src = '/js/protected_features.js';
        script.async = false;
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
        });
      } catch (e) {
        return false;
      }
    }

    // Template para o Header (Injetado apenas sob demanda)
    const getHeaderHTML = (user) => `
    <header id="topbar" class="topbar">
      <div class="topbar-left">
        <div class="logo-container" onclick="navigate('/')">
          <span class="logo-text">SYNAPSE</span>
        </div>
        <nav id="breadcrumb" class="breadcrumb"></nav>
      </div>
        
      <div class="topbar-center">
        <div class="global-search">
          <i class='bx bx-search'></i>
          <input type="text" placeholder="Buscar em todo o ecossistema...">
        </div>
      </div>

      <div class="topbar-right">
        <button class="icon-btn">🔔</button>
        <div class="user-profile">
          <div class="avatar-small" id="user-avatar-initials">${(user?.name || user?.username || 'U').substring(0, 2).toUpperCase()}</div>
          <span class="user-name" id="user-display-name">${user?.username || user?.name || 'User'}</span>
          <div class="user-dropdown">
            <div class="dropdown-header">
              <strong>${user?.name || user?.username || 'Usuário'}</strong>
              <span>${(user?.role || 'user').toUpperCase()}</span>
            </div>
            <hr>
            <a onclick="navigate('/profile')">👤 Meu Perfil</a>
            <a onclick="navigate('/org')">🏢 Instituição</a>
            <hr>
            <a onclick="AppState.logout()" class="logout-link">🚪 Sair do Sistema</a>
          </div>
        </div>
      </div>
    </header>
    `;

  let currentViewScript = null;

  async function loadView(routeConfig) {
    const { view, script, sidebar, shell } = routeConfig;
    
    // Update Layout Shell class
    if (appShell()) {
      appShell().className = `app-shell shell-${shell || 'default'}`;
    }

    // Ensure shell elements match the requested shell type.
    // For 'minimal' shell (e.g. login) we remove header/sidebar from the DOM
    // For non-minimal shells we recreate them if missing so authenticated users see the full UI.
    (async function ensureShellElements() {
      try {
        const topbar = document.getElementById('topbar');
        const sidebarElObj = document.getElementById('sidebar');

        if (shell === 'minimal') {
          if (topbar && topbar.parentNode) topbar.parentNode.removeChild(topbar);
          if (sidebarElObj && sidebarElObj.parentNode) sidebarElObj.parentNode.removeChild(sidebarElObj);
          document.querySelector('.main-container')?.classList.remove('with-sidebar');
          return;
        }

        // Non-minimal: ensure topbar exists
        if (!topbar && AppState.auth.isAuthenticated) {
          const container = appShell();
          if (container) {
            const header = document.createElement('div');
            header.innerHTML = getHeaderHTML(AppState.get('user'));
            container.insertBefore(header.firstElementChild, container.firstChild);
          }
        }

        // Ensure sidebar container exists
        if (!sidebarElObj && AppState.auth.isAuthenticated) {
          // Buscamos ou criamos o main-container se não existir
          let mc = document.querySelector('.main-container');
          if (!mc) {
             mc = document.createElement('div');
             mc.className = 'main-container with-sidebar';
             // Mover o content para dentro do main-container se estiver fora
             const cnt = content();
             if (cnt && cnt.parentNode === appShell()) {
                appShell().appendChild(mc);
                mc.appendChild(cnt);
             }
          }
          
          const aside = document.createElement('aside');
          aside.id = 'sidebar';
          aside.className = 'sidebar';
          mc.insertBefore(aside, mc.querySelector('.content-area'));
        }
      } catch (e) {
        console.warn('ensureShellElements error', e);
      }
    })();

    try {
      const response = await fetch(`/views/${view}`);
      if (!response.ok) throw new Error(`Failed to load view: ${view}`);
      
      const html = await response.text();
      content().innerHTML = html;
      
      if (sidebar && window.ProtectedApp) {
        const renderer = window.ProtectedApp.renderSidebars[sidebar];
        const sEl = sidebarEl();
        if (renderer && sEl) {
          sEl.innerHTML = renderer();
          bindSidebarEvents(sEl);
        }
      }
      
      // Remove previous script
      if (currentViewScript) {
        try { document.body.removeChild(currentViewScript); } catch(e){}
        currentViewScript = null;
        window.initView = undefined;
      }

      // Load new script
      if (script) {
        const s = document.createElement('script');
        s.src = `/js/${script}`;
        s.defer = true;
        s.onload = () => { 
          if (typeof window.initView === 'function') window.initView(AppState.ui.viewMode);
        };
        document.body.appendChild(s);
        currentViewScript = s;
      }

      AppState.ui.activeView = view;
      AppState.renderBreadcrumb();

    } catch (err) {
      console.error('Navigation Error:', err);
      content().innerHTML = `<div class="error-container" style="padding: 2rem; text-align: center; color: var(--text-muted);">
        <i class="ri-error-warning-line" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
        <h3>Módulo em Desenvolvimento</h3>
        <p>A vista "${view}" ainda está sendo implementada pelo sistema.</p>
        <button class="btn btn-primary" onclick="navigate('/')" style="margin-top: 1rem;">Voltar à Home</button>
      </div>`;
    }
  }

  function matchRoute(path) {
    if (publicRoutes[path]) {
        return publicRoutes[path];
    }
    
    if (AppState.auth.isAuthenticated && window.ProtectedApp) {
        const pr = window.ProtectedApp.routes[path];
        if (pr) {
            if (pr.redirect) return matchRoute(pr.redirect);
            
            // Check if user role is allowed for this route
            const user = AppState.user;
            const userRole = user?.role || 'student';
            if (pr.roles && !pr.roles.includes(userRole)) {
                console.warn(`Access denied for role ${userRole} to path ${path}`);
                if (window.Toast) {
                   window.Toast.show({ message: 'Você não tem permissão para acessar esta área.', type: 'error' });
                }
                return window.ProtectedApp.routes['/'] || { view: 'home.html', script: 'home.js', shell: 'default' };
            }

            return pr;
        }
    }

    if (!AppState.auth.isAuthenticated) {
        return publicRoutes['/auth'];
    }
    
    return { view: '404.html', script: null, shell: 'minimal' };
  }

  async function navigate(path, opts = { push: true, mode: 'default' }) {
    console.log(`Navigating to: ${path}`, opts);
    
    if (AppState.auth.isAuthenticated) {
      await ensureProtectedFeatures();
    }

    if (!AppState.auth.isAuthenticated && !publicRoutes[path]) {
      path = '/auth';
    } else if (AppState.auth.isAuthenticated && path === '/auth') {
      path = '/';
    }

    AppState.ui.viewMode = opts.mode || 'default';
    AppState.ui.params = opts; // Store full opts for view consumption
    
    const route = matchRoute(path);
    if (opts.push) history.pushState({ path, ...opts }, '', path);
    loadView(route);
  }

  window.navigate = navigate;

  window.addEventListener('popstate', (event) => {
    const path = location.pathname;
    const mode = (event.state && event.state.mode) ? event.state.mode : 'default';
    navigate(path, { push: false, mode });
  });

  function bindSidebarEvents(container) {
    container.querySelectorAll('[data-path]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(a.dataset.path);
      });
      // Active state
      if (a.dataset.path === location.pathname || (location.pathname === '/' && a.dataset.path === '/')) {
        a.classList.add('active');
      }
    });
  }

  // Breadcrumb
  AppState.renderBreadcrumb = function() {
      const bc = document.getElementById('breadcrumb');
      if (!bc) return;
      const path = location.pathname.split('/').filter(x => x);
      let html = '<span onclick="navigate(\'/\')">Home</span>';
      path.forEach((p, i) => {
          html += ` <i class="ri-arrow-right-s-line"></i> <span>${p.charAt(0).toUpperCase() + p.slice(1)}</span>`;
      });
      bc.innerHTML = html;
  };

  // Toast System
  const toastRoot = () => document.getElementById('toast-root');
  window.Toast = {
    show({ message, type = 'info', timeout = 3000 }) {
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      el.innerHTML = `<span>${message}</span>`;
      toastRoot().appendChild(el);
      setTimeout(() => el.classList.add('visible'), 10);
      setTimeout(() => { 
        el.classList.remove('visible'); 
        setTimeout(() => el.remove(), 300); 
      }, timeout);
    }
  };

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    navigate(location.pathname || '/', { push: false });
  });

})();
