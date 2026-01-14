/* app.js — loader + simple router for SPA without framework */
(function(){
  const viewMap = [
    {path: '/auth', view: 'auth.html', script:'auth.js', sidebar: null},
    {path: '/instructor/dashboard', view: 'dashboard.html', script:'dashboard.js', sidebar: renderSidebarRoot},
    {path: '/instructor/courses', view: 'courses.html', script:'courses.js', sidebar: renderSidebarRoot},
    {pathPrefix: '/instructor/course/', view: 'course_detail.html', script:'course.js', sidebar: renderSidebarCourse},
    {pathPrefix: '/instructor/lesson/', view: 'lesson_detail.html', script:'lesson.js', sidebar: renderSidebarCourse},
    {path: '/instructor/classroom', view: 'classroom.html', script:'classroom.js', sidebar: renderSidebarCourse}
  ];

  const content = () => document.getElementById('content');
  const sidebarEl = () => document.getElementById('sidebar');

  let currentViewScript = null;

  async function loadView(view, script, sidebarFn){
    const html = await fetch(`views/${view}`).then(r=>r.ok? r.text(): '<div>Erro ao carregar</div>');
    const html = await fetch(`views/${view}`).then(r=>r.ok? r.text(): '<div>Erro ao carregar</div>');
    content().innerHTML = html;
    if (sidebarFn) sidebarFn();
    // remove previous view script if any
    if (currentViewScript) {
      try { document.body.removeChild(currentViewScript); } catch(e){}
      currentViewScript = null;
      window.initView = undefined;
    }
    if (script) {
      const s = document.createElement('script');
      s.src = `js/${script}`;
      s.defer = true;
      s.onload = ()=>{ if (typeof window.initView === 'function') window.initView(); };
      document.body.appendChild(s);
      currentViewScript = s;
    }
    if (script) {
      const s = document.createElement('script');
      s.src = `js/${script}`;
      s.defer = true;
      s.onload = ()=>{ if (typeof window.initView === 'function') window.initView(); };
      document.body.appendChild(s);
      currentViewScript = s;
    }
  }

  function matchRoute(path){
    for(const m of viewMap){
      if (m.path && m.path === path) return m;
      if (m.pathPrefix && path.startsWith(m.pathPrefix)) return m;
    }
    return viewMap[1]; // default to courses
  }

  function navigate(path, opts={push:true}){
    const route = matchRoute(path);
    if (opts.push) history.pushState({path}, '', path);
    loadView(route.view, route.script, route.sidebar);
  }

  window.navigate = navigate;

  window.addEventListener('popstate', ()=>{
    navigate(location.pathname, {push:false});
  });

  // Simple sidebar renderers (can be moved to sidebar.js)
  function renderSidebarRoot(){
    const s = sidebarEl();
    s.innerHTML = `\n      <nav class="nav-root">\n        <a data-path="/instructor/dashboard">📊 Dashboard</a>\n        <a data-path="/instructor/courses">📚 Meus Cursos</a>\n        <button id="btn-create-course" class="btn primary">➕ Criar Curso</button>\n        <a data-path="/instructor/classroom">🏫 Sala de Aula (Demo)</a>\n      </nav>`;
    s.querySelectorAll('[data-path]').forEach(a=> a.addEventListener('click', ()=> navigate(a.dataset.path)));
    const btn = document.getElementById('btn-create-course');
    if (btn) btn.addEventListener('click', ()=> alert('Abrir modal Criar Curso (stub)'));
  }

  function renderSidebarCourse(){
    const s = sidebarEl();
    const title = (window.AppState && AppState.course && AppState.course.title) ? AppState.course.title : 'Curso';
    s.innerHTML = `\n      <nav class="nav-course">\n        <a data-path="/instructor/courses">⬅ Cursos</a>\n        <div class="course-context">\n          <strong>${title}</strong>\n        </div>\n        <a class="nav-item">📄 Visão Geral</a>\n        <a class="nav-item" data-action="lessons">🎥 Aulas</a>\n        <a class="nav-item">📎 Materiais</a>\n        <a class="nav-item">👥 Alunos</a>\n      </nav>`;
    s.querySelectorAll('[data-path]').forEach(a=> a.addEventListener('click', ()=> navigate(a.dataset.path)));
    s.querySelectorAll('[data-action]').forEach(a=> a.addEventListener('click', ()=> {
      const act = a.dataset.action;
      if (act === 'lessons') navigate(`/instructor/course/${AppState.course?.id || '0'}`);
    }));
  }

  // Toast helper
  const toastRoot = ()=> document.getElementById('toast-root');
  window.Toast = {
    show({message, type='info', timeout=3000}){
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = message;
      toastRoot().appendChild(el);
      setTimeout(()=> el.classList.add('visible'), 10);
      setTimeout(()=> { el.classList.remove('visible'); setTimeout(()=> el.remove(), 300); }, timeout);
    }
  };

  // Boot: default route — send unauthenticated users to /auth
  document.addEventListener('DOMContentLoaded', ()=>{
    const initial = location.pathname && location.pathname !== '/' ? location.pathname : null;
    if (window.AppState && window.AppState.auth && window.AppState.auth.isAuthenticated) {
      navigate(initial || '/instructor/courses', {push:false});
    } else {
      // redirect to auth view on root for unauthenticated visitors
      navigate('/auth', {push:false});
    }
  });

})();
