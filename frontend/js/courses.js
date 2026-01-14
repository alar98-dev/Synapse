// courses.js — view controller for /instructor/courses
window.initView = function(){
  const grid = document.getElementById('courses-grid');
  const empty = document.getElementById('courses-empty');

  
  const data = [
    {id:1, title:'Python Avançado', lessons:12, published:true},
    {id:2, title:'Introdução ao Django', lessons:5, published:false}
  ];

  grid.innerHTML = '';
  if (!data.length) { empty.hidden = false; }
  data.forEach(c=>{
    const card = document.createElement('article');
    card.className = 'card course-card';
    card.innerHTML = `\n      <div class="card-body">\n        <h3 class="card-title">${c.title}</h3>\n        <p class="card-meta">${c.lessons} aulas</p>\n        <div class="card-actions">\n          <button class="btn ghost edit">✏️ Editar</button>\n          <button class="btn outline preview">👁️ Visualizar</button>\n          <button class="btn primary pub-toggle">${c.published? '🚀 Pausar':'🚀 Publicar'}</button>\n        </div>\n      </div>`;
    card.querySelector('.edit').addEventListener('click', ()=> openCourse(c.id));
    card.querySelector('.preview').addEventListener('click', ()=> Toast.show({message:'Preview (stub)'}));
    card.querySelector('.pub-toggle').addEventListener('click', ()=> Toast.show({message:'Status alterado (stub)'}));
    grid.appendChild(card);
  });

  document.getElementById('empty-create')?.addEventListener('click', ()=> alert('Abrir criar curso'));
};

function openCourse(id){
  AppState.setContext({course:{id, title: id===1? 'Python Avançado':'Curso'}});
  navigate(`/instructor/course/${id}`);
}
