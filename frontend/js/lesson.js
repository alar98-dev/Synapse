// lesson.js — controller for lesson detail
window.initView = function(){
  const title = (AppState.lesson && AppState.lesson.title) || 'Aula';
  document.getElementById('lesson-title').innerText = title;
  // placeholder for chapter list and content editor/player
};
