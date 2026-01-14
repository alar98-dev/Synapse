/* core/app.js — loader + router for new src structure */
(function(){
  const viewMap = [
    {path: '/instructor/dashboard', view: '/src/views/dashboard/index.html', script:'/src/views/dashboard/index.js', sidebar: renderSidebarRoot},
    {path: '/instructor/courses', view: '/src/views/courses/index.html', script:'/src/views/courses/index.js', sidebar: renderSidebarRoot},
    {pathPrefix: '/instructor/course/', view: '/src/views/course_detail/index.html', script:'/src/views/course_detail/index.js', sidebar: renderSidebarCourse},
    {pathPrefix: '/instructor/lesson/', view: '/src/views/lesson_detail/index.html', script:'/src/views/lesson_detail/index.js', sidebar: renderSidebarCourse},
    {path: '/instructor/classroom', view: '/src/views/classroom/index.html', script:'/src/views/classroom/index.js', sidebar: renderSidebarCourse}
  ];

  const content = () => document.getElementById('content');
  const sidebarEl = () => document.getElementById('sidebar');

  let currentViewScript = null;

  async function loadView(viewUrl, scriptUrl, sidebarFn){
    const html = await fetch(viewUrl).then(r=>r.ok? r.text(): '<div>Erro ao carregar</div>');
    content().innerHTML = html;
    if (sidebarFn) sidebarFn();
    if (currentViewScript) {
      try { document.body.removeChild(currentViewScript); } catch(e){}
      currentViewScript = null;
      window.initView = undefined;
    }
    if (scriptUrl) {
      const s = document.createElement('script');
      s.src = scriptUrl;
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

  // Sidebar functions reused by core (kept simple for now)
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

  // simple toast helper
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

  document.addEventListener('DOMContentLoaded', ()=>{
    const initial = location.pathname || '/instructor/courses';
    navigate(initial, {push:false});
  });

})();
