// frontend/src/components/sidebar/sidebar.js
export function renderSidebarRoot(container){
  container.innerHTML = `\n    <nav class="nav-root">\n      <a data-path="/instructor/dashboard">📊 Dashboard</a>\n      <a data-path="/instructor/courses">📚 Meus Cursos</a>\n      <button id="btn-create-course" class="btn primary">➕ Criar Curso</button>\n    </nav>`;
  container.querySelectorAll('[data-path]').forEach(a=> a.addEventListener('click', ()=> navigate(a.dataset.path)));
  const btn = document.getElementById('btn-create-course');
  if (btn) btn.addEventListener('click', ()=> alert('Abrir modal Criar Curso (stub)'));
}

export function renderSidebarCourse(container, title){
  container.innerHTML = `\n    <nav class="nav-course">\n      <a data-path="/instructor/courses">⬅ Cursos</a>\n      <div class="course-context">\n        <strong>${title}</strong>\n      </div>\n      <a class="nav-item">📄 Visão Geral</a>\n      <a class="nav-item" data-action="lessons">🎥 Aulas</a>\n      <a class="nav-item">📎 Materiais</a>\n      <a class="nav-item">👥 Alunos</a>\n    </nav>`;
  container.querySelectorAll('[data-path]').forEach(a=> a.addEventListener('click', ()=> navigate(a.dataset.path)));
  container.querySelectorAll('[data-action]').forEach(a=> a.addEventListener('click', ()=> {
    const act = a.dataset.action;
    if (act === 'lessons') navigate(`/instructor/course/${AppState.course?.id || '0'}`);
  }));
}
