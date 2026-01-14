window.initView = async function(mode) {
    console.log('Dashboard initialized - Premium Mode');
    
    // Update user info
    const user = AppState.get('user');
    const nameDisplay = document.getElementById('user-name-display');
    if (user && nameDisplay) {
        nameDisplay.textContent = user.username || user.first_name || 'Expert';
    }

    // Fetch real stats
    try {
        const resp = await fetch('/api/v1/core/dashboard/stats/');
        if (resp.ok) {
            const stats = await resp.json();
            document.getElementById('stat-active-learners').textContent = stats.total_students || 0;
            document.getElementById('stat-active-courses').textContent = stats.active_courses || 0;
            document.getElementById('stat-total-materials').textContent = stats.total_materials || 0;
            document.getElementById('stat-lessons-today').textContent = stats.lessons_today || 0;
        }
    } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
    }
    
    // Add 3D-ish hover effect to stats cards
    const cards = document.querySelectorAll('.stats-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // Animate AI Insight entry
    const insight = document.querySelector('.ai-insight');
    if (insight) {
        insight.style.opacity = '0';
        insight.style.transform = 'translateY(20px)';
        setTimeout(() => {
            insight.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            insight.style.opacity = '1';
            insight.style.transform = 'translateY(0)';
        }, 100);
    }
};
