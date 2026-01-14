/**
 * builder.js - Course Builder / Editor Controller
 */
(function() {
    window.initView = function(mode) {
        console.log('Init BuilderView in mode:', mode);
        
        setupTabs();
        setupModuleEvents();
        setupSave();

        if (mode === 'edit' && AppState.ui.params && AppState.ui.params.id) {
            loadCourseData(AppState.ui.params.id);
        }
    };

    async function loadCourseData(courseId) {
        const titleEl = document.getElementById('builder-course-title');
        if (titleEl) titleEl.textContent = 'Carregando curso...';

        try {
            const resp = await fetch(`/api/v1/courses/${courseId}/`);
            if (!resp.ok) throw new Error('Não foi possível carregar o curso.');
            const course = await resp.json();

            if (titleEl) titleEl.textContent = `Editando: ${course.title}`;
            
            // Fill settings form
            const form = document.querySelector('.settings-form');
            if (form) {
                const titleInput = form.querySelector('input');
                const descTextarea = form.querySelector('textarea');
                if (titleInput) titleInput.value = course.title || '';
                if (descTextarea) descTextarea.value = course.description || '';
            }

            renderCourseStructure(course);
        } catch (err) {
            console.error(err);
            Toast.show({message: err.message, type: 'error'});
        }
    }

    function setupSave() {
        const btnSave = document.getElementById('btn-save-course');
        if (btnSave) {
            btnSave.onclick = async () => {
                const courseId = AppState.ui.params?.id;
                const form = document.querySelector('.settings-form');
                if (!form) return;

                const data = {
                    title: form.querySelector('input').value,
                    description: form.querySelector('textarea').value
                };

                try {
                    const method = courseId ? 'PATCH' : 'POST';
                    const url = courseId ? `/api/v1/courses/${courseId}/` : '/api/v1/courses/';
                    
                    const resp = await fetch(url, {
                        method,
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(data)
                    });

                    if (resp.ok) {
                        const saved = await resp.json();
                        Toast.show({message: 'Curso salvo com sucesso!', type: 'success'});
                        if (!courseId) navigate('/builder', {mode: 'edit', id: saved.id});
                    }
                } catch (err) {
                    Toast.show({message: 'Erro ao salvar curso', type: 'error'});
                }
            };
        }
    }

    function renderCourseStructure(course) {
        const list = document.getElementById('module-list');
        if (!list) return;
        list.innerHTML = '';

        if (!course.modules || course.modules.length === 0) {
            list.innerHTML = '<div class="empty-state">Nenhum módulo criado. Clique em "Adicionar Módulo".</div>';
            return;
        }

        course.modules.sort((a,b) => a.order - b.order).forEach(mod => {
            const modEl = createModuleElement(mod);
            list.appendChild(modEl);
        });
    }

    function createModuleElement(mod) {
        const moduleEl = document.createElement('div');
        moduleEl.className = 'module-item card';
        moduleEl.dataset.id = mod.id;
        moduleEl.innerHTML = `
            <div class="module-header" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-deep); border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                    <span class="drag-handle">≡</span>
                    <input type="text" class="module-title-input" value="${mod.title}" style="background: transparent; border: 1px solid transparent; color: inherit; padding: 0.2rem; flex: 1;">
                </div>
                <div class="module-actions">
                    <button class="btn icon-only ghost btn-add-lesson">➕ Aula</button>
                    <button class="btn icon-only ghost delete">🗑️</button>
                </div>
            </div>
            <div class="lesson-list" style="padding: 0.5rem 1rem;">
                ${(mod.lessons || []).sort((a,b)=>a.order-b.order).map(lesson => `
                    <div class="lesson-item" data-id="${lesson.id}" style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9rem;">${lesson.lesson_type === 'video' ? '🎥' : '📄'} ${lesson.title}</span>
                        <div class="lesson-actions">
                             <button class="btn icon-only ghost small">✏️</button>
                        </div>
                    </div>
                `).join('')}
                ${mod.lessons && mod.lessons.length === 0 ? '<div style="padding: 1rem; text-align: center; color: var(--text-dim); font-size: 0.8rem;">Vazio</div>' : ''}
            </div>
        `;

        moduleEl.querySelector('.btn-add-lesson').onclick = () => alert('Criar Aula para módulo ' + mod.id);
        
        return moduleEl;
    }

    function setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panes = document.querySelectorAll('.builder-tab-pane');

        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.add('hidden'));
                
                btn.classList.add('active');
                const target = btn.dataset.tab;
                const pane = document.getElementById(`tab-${target}`);
                if (pane) pane.classList.remove('hidden');
            };
        });
    }

    function setupModuleEvents() {
        const btnAdd = document.getElementById('btn-add-module');
        if (!btnAdd) return;
        btnAdd.onclick = async () => {
            const courseId = AppState.ui.params?.id;
            if (!courseId) {
                Toast.show({message: 'Salve o curso primeiro', type: 'warning'});
                return;
            }

            try {
                const resp = await fetch('/api/v1/modules/', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        course: courseId,
                        title: 'Novo Módulo',
                        order: document.querySelectorAll('.module-item').length
                    })
                });
                if (resp.ok) {
                    const mod = await resp.json();
                    const list = document.getElementById('module-list');
                    if (list) {
                        const empty = list.querySelector('.empty-state');
                        if (empty) empty.remove();
                        list.appendChild(createModuleElement(mod));
                    }
                }
            } catch (err) {
                Toast.show({message: 'Erro ao criar módulo', type: 'error'});
            }
        };

        const btnGenerate = document.getElementById('btn-generate-ai');
        if (btnGenerate) {
            btnGenerate.onclick = () => {
                Toast.show({ message: 'A IA está processando seu pedido...', type: 'info' });
                setTimeout(() => {
                    Toast.show({ message: 'Estrutura gerada com sucesso!', type: 'success' });
                }, 2000);
            };
        }
    }
})();
