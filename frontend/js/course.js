// course.js — controller for course detail
window.initView = function(){
  const titleEl = document.getElementById('course-title');
  const list = document.getElementById('lessons-list');
  const course = AppState.course || {id:0, title:'Curso'};
  titleEl.innerText = course.title;

  const lessons = [ {id:1, title:'Introdução'}, {id:2, title:'Decorators'} ];
  list.innerHTML = '';
  lessons.forEach(l=>{
    const li = document.createElement('li');
    li.className = 'lesson-item';
    li.innerHTML = `<span class="lesson-title">${l.title}</span><div class="lesson-actions"><button class="btn ghost">Editar</button></div>`;
    li.addEventListener('click', ()=> openLesson(l.id, l.title));
    list.appendChild(li);
  });

  document.getElementById('btn-new-lesson')?.addEventListener('click', ()=> alert('Nova aula (stub)'));
};

function openLesson(id, title){
  AppState.setContext({lesson:{id, title}});
  navigate(`/instructor/lesson/${id}`);
}
