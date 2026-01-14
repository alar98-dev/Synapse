// frontend/src/views/lesson_detail/index.js
window.initView = function(){
  const title = (AppState.lesson && AppState.lesson.title) || 'Aula';
  document.getElementById('lesson-title').innerText = title;
  // placeholder for chapter list and content editor/player
};
