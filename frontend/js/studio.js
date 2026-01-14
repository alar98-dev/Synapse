/**
 * studio.js - Course Management Controller
 */
(function() {
    window.initView = function() {
        console.log('Init StudioView');
        loadCourses();
        setupModals();
        
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadCourses(btn.dataset.filter);
            };
        });
    };

    function setupModals() {
        // We'll use a simple prompt for now to keep it efficient, 
        // or a real modal if the HTML has it.
        const btnCreate = document.getElementById('btn-create-course-header'); // Assuming we add one
        if (btnCreate) {
            btnCreate.onclick = async () => {
                const title = prompt('Título do novo curso:');
                if (!title) return;
                
                try {
                    const resp = await fetch('/api/v1/courses/', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ title, description: '', level: 'beginner' })
                    });
                    if (resp.ok) {
                        const newCourse = await resp.json();
                        Toast.show({message: 'Curso criado!', type: 'success'});
                        loadCourses();
                    }
                } catch (err) {
                    Toast.show({message: 'Erro ao criar curso', type: 'error'});
                }
            };
        }
    }

    async function loadCourses(filter = 'all') {
        const grid = document.getElementById('studio-course-grid');
        if (!grid) return;
        
        try {
            const resp = await fetch('/api/v1/courses/');
            if (!resp.ok) throw new Error('Failed to fetch courses');
            const courses = await resp.json();

            const filtered = filter === 'all' ? courses : courses.filter(c => c.is_published === (filter === 'active'));

            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state">Nenhum curso encontrado.</div>';
                return;
            }

            grid.innerHTML = filtered.map(c => `
                <div class="course-card" onclick="navigate('/builder', {mode: 'edit', id: '${c.id}'})">
                    <div class="card-image" style="background-color: var(--bg-deep); display: flex; align-items: center; justify-content: center; color: var(--text-dim)">
                        <span class="status-badge ${c.is_published ? 'active' : 'draft'}">${c.is_published ? 'active' : 'draft'}</span>
                        <i class='bx bx-book' style="font-size: 3rem;"></i>
                    </div>
                    <div class="card-body">
                        <h3>${c.title}</h3>
                        <div class="card-meta">
                            <span>👥 ${c.enrolled_count || 0} alunos</span>
                            <span>⭐ ${c.rating || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn ghost small">Editar</button>
                        <button class="btn ghost small" onclick="event.stopPropagation(); navigate('/analytics')">📈</button>
                        <button class="btn ghost small" onclick="event.stopPropagation(); alert('Opções')">•••</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            Toast.show({message: 'Erro ao carregar cursos', type: 'error'});
        }
    }
})();
