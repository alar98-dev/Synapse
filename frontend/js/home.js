/**
 * home.js - Dynamic Dashboard Controller
 */
(function() {
    window.initView = function() {
        console.log('Init HomeView');
        const user = AppState.user || { name: 'Visitante', role: 'student' };
        
        document.getElementById('welcome-message').textContent = `Olá, ${user.name.split(' ')[0]}`;
        
        renderWidgets(user.role);
        loadActivity(user.role);
        loadAIInsights();
    };

    function renderWidgets(role) {
        const container = document.getElementById('stats-container');
        let widgets = [];

        if (role === 'instructor') {
            widgets = [
                { label: 'Alunos Ativos', value: '1.240', trend: '+12%', icon: '👥' },
                { label: 'Cursos Publicados', value: '8', trend: '0', icon: '📚' },
                { label: 'Receita Mensal', value: 'R$ 12.400', trend: '+5%', icon: '💰' },
                { label: 'Avaliação Média', value: '4.8', trend: '+0.1', icon: '⭐' }
            ];
            renderCTA('instrutor');
        } else {
            widgets = [
                { label: 'Cursos em Curso', value: '3', trend: 'Completo: 60%', icon: '📖' },
                { label: 'Horas Estudadas', value: '42h', trend: '+5h/semana', icon: '⏱️' },
                { label: 'Certificados', value: '12', trend: '+2 novos', icon: '🏅' },
                { label: 'Ranking Semanal', value: '#4', trend: 'Top 5%', icon: '🏆' }
            ];
            renderCTA('aluno');
        }

        container.innerHTML = widgets.map(w => `
            <div class="stat-card">
                <div class="stat-icon">${w.icon}</div>
                <div class="stat-data">
                    <span class="stat-label">${w.label}</span>
                    <span class="stat-value">${w.value}</span>
                    <span class="stat-trend ${w.trend.startsWith('+') ? 'up' : ''}">${w.trend}</span>
                </div>
            </div>
        `).join('');
    }

    function renderCTA(role) {
        const cta = document.getElementById('widget-cta');
        if (role === 'instrutor') {
            cta.innerHTML = `
                <div class="cta-content">
                    <h3>Pronto para criar algo novo?</h3>
                    <p>Use nossa IA para gerar o esboço do seu próximo curso em segundos.</p>
                    <button class="btn primary" onclick="navigate('/studio')">Abrir Estúdio</button>
                </div>
            `;
        } else {
            cta.innerHTML = `
                <div class="cta-content">
                    <h3>Continue de onde parou</h3>
                    <p>Você parou em: <strong>Introdução ao React - Aula 4</strong></p>
                    <button class="btn primary" onclick="navigate('/classroom')">Retomar Aula</button>
                </div>
            `;
        }
    }

    function loadActivity() {
        // Stub for activity feed
        const feed = document.getElementById('recent-activity');
        const items = [
            { text: 'Concluiu a aula: Introdução a IA', time: '2h atrás' },
            { text: 'Novo comentário no seu curso', time: '5h atrás' }
        ];
        feed.innerHTML = items.map(i => `
            <div class="activity-item">
                <span class="activity-text">${i.text}</span>
                <span class="activity-time">${i.time}</span>
            </div>
        `).join('');
    }

    function loadAIInsights() {
        const box = document.getElementById('ai-insights');
        setTimeout(() => {
            box.innerHTML = `
                <div class="ai-insight-item">
                    <p>💡 <strong>Oportunidade:</strong> Alunos estão buscando mais por "Python para Engenharia".</p>
                </div>
                <div class="ai-insight-item">
                    <p>📉 <strong>Alerta:</strong> Retenção caiu 5% no Módulo 2 do curso de Design.</p>
                </div>
            `;
        }, 1500);
    }
})();
