window.initView = function() {
    console.log('Auth View Initialized');
    // Hide global UI elements while on login view
    try {
        const topbar = document.getElementById('topbar');
        const sidebar = document.getElementById('sidebar');
        if (topbar) topbar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
    } catch (e) { /* ignore */ }
    
    const form = document.getElementById('form-login');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            AppState.showLoader('Autenticando...');

            try {
                // Exchange credentials for JWT (SimpleJWT TokenObtainPairView)
                const tokenResp = await window.fetchWithLoader('/api/v1/auth/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password: password })
                }, { message: 'Autenticando...' });

                if (!tokenResp || !tokenResp.ok) {
                    let msg = 'Credenciais inválidas';
                    try {
                        const j = await tokenResp.json();
                        if (j.detail) msg = j.detail;
                        else if (j.non_field_errors) msg = j.non_field_errors.join(' ');
                    } catch (e) {}
                    throw new Error(msg);
                }

                const tokenData = await tokenResp.json();
                const access = tokenData.access || tokenData.token || null;
                if (!access) throw new Error('Resposta do servidor sem token');

                // Persist token and mark authenticated
                AppState.setContext({ auth: { isAuthenticated: true, token: access } });

                // Restore global UI elements (topbar/sidebar) before navigating
                try {
                    const topbar = document.getElementById('topbar');
                    const sidebar = document.getElementById('sidebar');
                    if (topbar) topbar.style.display = '';
                    if (sidebar) sidebar.style.display = '';
                } catch (e) { /* ignore */ }

                // Fetch current user profile using the token
                const meResp = await window.fetchWithLoader('/api/v1/auth/me/', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${access}` }
                }, { message: 'Carregando perfil...' });

                if (meResp && meResp.ok) {
                    try {
                        const me = await meResp.json();
                        AppState.setContext({ user: me });
                    } catch (e) {
                        // ignore profile parsing errors
                    }
                }

                AppState.hideLoader();
                // Protocolo Synapse (13/01/2026): Redirecionar para o ambiente SPA React em /app/
                window.location.href = '/app/dashboard';
            } catch (err) {
                console.error('Login error', err);
                AppState.hideLoader();
                alert(err && err.message ? err.message : 'Erro ao autenticar');
            }
        });
    }
};
