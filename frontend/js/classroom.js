/**
 * classroom.js - Unified Learning Experience
 */
(function() {
    window.initView = function() {
        console.log('Init ClassroomView');
        loadCurriculum();
        setupPlayer();
        
        window.toggleDrawer = function(id) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden');
        };
    };

    function loadCurriculum() {
        const nav = document.getElementById('curriculum-nav');
        const modules = [
            { title: 'Módulo 1: Fundamentos', lessons: ['Intro', 'História', 'Primeiros Passos'] },
            { title: 'Módulo 2: Intermediário', lessons: ['Componentes', 'Estado', 'Props'] }
        ];

        nav.innerHTML = modules.map((m, idx) => `
            <div class="module-group">
                <div class="module-title">${m.title}</div>
                <div class="lesson-items">
                    ${m.lessons.map(l => `<a class="lesson-item" onclick="loadLesson('${l}')">${l}</a>`).join('')}
                </div>
            </div>
        `).join('');
    }

    window.loadLesson = function(title) {
        document.getElementById('current-lesson-title').textContent = title;
        Toast.show({ message: `Carregando: ${title}`, type: 'info' });
    };

    function setupPlayer() {
        // Player initialization
    }
})();
