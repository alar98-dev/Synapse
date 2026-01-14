(function() {
    window.initView = async function() {
        console.log('Init SubmissionsView');
        loadSubmissions();
        setupFilters();
        
        document.querySelector('.close-modal')?.addEventListener('click', () => {
             document.getElementById('submission-modal').classList.add('hidden');
        });
    };

    async function loadSubmissions() {
        const body = document.getElementById('submissions-table-body');
        try {
            const resp = await fetch('/api/v1/submissions/');
            if (!resp.ok) throw new Error('Falha ao carregar submissões');
            const data = await resp.json();
            
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Nenhuma submissão encontrada.</td></tr>';
                return;
            }

            body.innerHTML = data.map(s => `
                <tr>
                    <td>${s.user_display || s.user}</td>
                    <td>${s.problem_title || s.problem}</td>
                    <td>${new Date(s.created_at).toLocaleString()}</td>
                    <td><span class="status-badge ${s.status}">${s.status}</span></td>
                    <td>
                        <button class="btn ghost small" onclick="viewSubmission(${s.id})">🔍 Ver</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            body.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">${err.message}</td></tr>`;
        }
    }

    window.viewSubmission = async function(id) {
        try {
            const resp = await fetch(`/api/v1/submissions/${id}/`);
            if (!resp.ok) throw new Error('Falha ao carregar detalhes');
            const s = await resp.json();

            document.getElementById('submission-code').textContent = s.code;
            document.getElementById('submission-log').textContent = s.result_summary || 'Nenhum log disponível.';
            document.getElementById('submission-modal').classList.remove('hidden');
        } catch (err) {
            Toast.show({message: err.message, type: 'error'});
        }
    }

    function setupFilters() {
        // Implement filters if needed
    }
})();
