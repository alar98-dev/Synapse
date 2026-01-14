// frontend/src/core/state.js
window.AppState = {
  course: null,
  lesson: null,
  setContext(ctx) {
    if (ctx.course !== undefined) this.course = ctx.course;
    if (ctx.lesson !== undefined) this.lesson = ctx.lesson;
    renderBreadcrumb();
  }
};

function renderBreadcrumb(){
  const bc = document.getElementById('breadcrumb');
  if(!bc) return;
  const parts = ['Meus Cursos'];
  if (AppState.course) parts.push(AppState.course.title || 'Curso');
  if (AppState.lesson) parts.push(AppState.lesson.title || 'Aula');
  bc.innerText = parts.join(' / ');
}

window.addEventListener('DOMContentLoaded', ()=> renderBreadcrumb());
