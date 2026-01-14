/* protected_features.js - Carregado apenas APÓS autenticação */
(function(){
  window.ProtectedApp = {
    routes: {
      '/': { view: 'dashboard.html', script: 'dashboard.js', shell: 'default', sidebar: 'renderSidebarMain', roles: ['staff', 'teacher', 'student', 'monitor'] },
      '/dashboard': { redirect: '/' },
      '/catalog': { view: 'catalog.html', script: 'catalog.js', shell: 'default', sidebar: 'renderSidebarMain', roles: ['staff', 'teacher', 'student', 'monitor'] },
      '/classroom': { view: 'classroom.html', script: 'classroom.js', shell: 'classroom', sidebar: 'renderSidebarClassroom', roles: ['staff', 'teacher', 'student', 'monitor'] },
      '/my-learning': { view: 'my_learning.html', script: 'my_learning.js', shell: 'default', sidebar: 'renderSidebarMain', roles: ['staff', 'teacher', 'student', 'monitor'] },
      '/studio': { view: 'studio_manager.html', script: 'studio.js', shell: 'default', sidebar: 'renderSidebarAuthoring', roles: ['staff', 'teacher'] },
      '/builder': { view: 'course_builder.html', script: 'builder.js', shell: 'default', sidebar: 'renderSidebarAuthoring', roles: ['staff', 'teacher'] },
      '/live': { view: 'live_manager.html', script: 'live.js', shell: 'default', sidebar: 'renderSidebarAuthoring', roles: ['staff', 'teacher'] },
      '/org': { view: 'org_manager.html', script: 'org_manager.js', shell: 'default', sidebar: 'renderSidebarAdmin', roles: ['staff'] },
      '/finance': { view: 'finance.hub.html', script: 'finance.js', shell: 'default', sidebar: 'renderSidebarAdmin', roles: ['staff'] },
      '/analytics': { view: 'analytics.html', script: 'analytics.js', shell: 'default', sidebar: 'renderSidebarAdmin', roles: ['staff', 'teacher'] },
      '/submissions': { view: 'submissions_manager.html', script: 'submissions.js', shell: 'default', sidebar: 'renderSidebarAuthoring', roles: ['staff', 'teacher'] },
      '/ai-center': { view: 'ai_center.html', script: 'ai_center.js', shell: 'default', sidebar: 'renderSidebarMain', roles: ['staff', 'teacher'] },
      '/control': { view: 'control_panel.html', script: 'control.js', shell: 'default', sidebar: 'renderSidebarAdmin', roles: ['staff'] },
      '/profile': { view: 'profile.html', script: 'profile.js', shell: 'default', sidebar: 'renderSidebarMain', roles: ['staff', 'teacher', 'student', 'monitor'] }
    },

    renderSidebars: {
      renderSidebarMain() {
        const user = AppState.user;
        const isStaffOrTeacher = ['staff', 'teacher'].includes(user?.role);
        
        return `
          <div class="sidebar-nav">
              <nav class="nav-group">
                <label>Explorar</label>
                <a data-path="/" class="nav-link"><i class='bx bx-grid-alt'></i> Dashboard</a>
                <a data-path="/catalog" class="nav-link"><i class='bx bx-compass'></i> Catálogo</a>
                <a data-path="/my-learning" class="nav-link"><i class='bx bx-book-open'></i> Aprendizado</a>
              </nav>
              ${isStaffOrTeacher ? `
              <nav class="nav-group">
                <label>Inteligência</label>
                <a data-path="/ai-center" class="nav-link"><i class='bx bx-bot'></i> AI Center</a>
              </nav>` : ''}
              <div class="sidebar-footer">
                <a data-path="/profile" class="nav-link"><i class='bx bx-user-circle'></i> Perfil</a>
                ${isStaffOrTeacher ? `<a data-path="/studio" class="nav-link"><i class='bx bx-customize'></i> Studio</a>` : ''}
                <a data-path="/support" class="nav-link"><i class='bx bx-help-circle'></i> Suporte</a>
              </div>
          </div>
        `;
      },
      renderSidebarAuthoring() {
        const user = AppState.user;
        const isStaff = user?.role === 'staff';

        return `
          <div class="sidebar-nav">
              <nav class="nav-group">
                <label>Estúdio</label>
                <a data-path="/studio" class="nav-link"><i class='bx bx-customize'></i> Gerenciar Cursos</a>
                <a data-path="/builder" class="nav-link"><i class='bx bx-paint-roll'></i> Novo Conteúdo</a>
                <a data-path="/submissions" class="nav-link"><i class='bx bx-code-block'></i> Submissões</a>
                <a data-path="/live" class="nav-link"><i class='bx bx-broadcast'></i> Sessões ao Vivo</a>
              </nav>
              <nav class="nav-group">
                <label>Resultados</label>
                <a data-path="/analytics" class="nav-link"><i class='bx bx-stats'></i> Desempenho</a>
              </nav>
              <div class="sidebar-footer">
                <a data-path="/" class="nav-link"><i class='bx bx-left-arrow-alt'></i> Portal</a>
                ${isStaff ? `<a data-path="/org" class="nav-link"><i class='bx bx-cog'></i> Admin</a>` : ''}
              </div>
          </div>
        `;
      },
      renderSidebarAdmin() {
        return `
          <div class="sidebar-nav">
              <nav class="nav-group">
                <label>Organização</label>
                <a data-path="/org" class="nav-link"><i class='bx bx-cog'></i> Configurações</a>
                <a data-path="/finance" class="nav-link"><i class='bx bx-credit-card'></i> Financeiro</a>
              </nav>
              <nav class="nav-group">
                <label>Sistema</label>
                <a data-path="/control" class="nav-link"><i class='bx bx-server'></i> Control Panel</a>
              </nav>
              <div class="sidebar-footer">
                <a data-path="/" class="nav-link"><i class='bx bx-left-arrow-alt'></i> Portal</a>
              </div>
          </div>
        `;
      },
      renderSidebarClassroom() {
        return `<div class="classroom-nav" style="padding: 1.5rem; color: var(--text-muted); font-size: 0.8rem;">
            Conteúdo da Aula...
        </div>`;
      }
    }
  };
})();
