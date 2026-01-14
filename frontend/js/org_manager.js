window.initView = async function() {
    console.log("Iniciando Gestão Institucional...");
    showOrgTab('general');
};

window.showOrgTab = function(tab) {
    const container = document.getElementById('org-tab-content');
    if (!container) return;

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-settings a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('onclick').includes(tab));
    });

    const tabs = {
        general: `
            <div class="settings-section active">
                <h3>Dados de Registro</h3>
                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Nome da Instituição</label>
                        <input type="text" value="Synapse Academy">
                    </div>
                    <div class="form-group">
                        <label>CNPJ / Registro</label>
                        <input type="text" value="00.000.000/0001-00">
                    </div>
                    <div class="form-group">
                        <label>Domínio Principal</label>
                        <input type="text" value="academy.synapse.com">
                    </div>
                    <div class="form-group">
                        <label>E-mail de Suporte</label>
                        <input type="email" value="suporte@synapse.com">
                    </div>
                </div>
                <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
                <button class="btn btn-primary">Salvar Alterações</button>
            </div>
        `,
        branding: `
            <div class="settings-section active">
                <h3>Branding & Identidade</h3>
                <p>Personalize a aparência do seu ecossistema para seus alunos.</p>
                <div class="branding-preview" style="display: flex; gap: 2rem; margin-top: 1.5rem;">
                    <div style="flex: 1;">
                        <div class="form-group">
                            <label>Logo (Light Mode)</label>
                            <div style="padding: 1rem; background: #fff; border-radius: 8px; margin-bottom: 0.5rem; text-align: center;">
                                <img src="/static/logo-dark.png" style="height: 40px;" onerror="this.src='https://placehold.co/150x40?text=LOGO+DARK'">
                            </div>
                            <input type="file">
                        </div>
                        <div class="form-group">
                            <label>Cor Primária</label>
                            <input type="color" value="#a280ff" style="height: 50px;">
                        </div>
                    </div>
                    <div style="flex: 1;">
                         <div class="form-group">
                            <label>Logo (Dark Mode)</label>
                            <div style="padding: 1rem; background: #1a1a1a; border-radius: 8px; margin-bottom: 0.5rem; text-align: center;">
                                <img src="/static/logo-white.png" style="height: 40px;" onerror="this.src='https://placehold.co/150x40?text=LOGO+WHITE'">
                            </div>
                            <input type="file">
                        </div>
                        <div class="form-group">
                            <label>Favicon</label>
                            <input type="file">
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary">Atualizar Visual</button>
            </div>
        `,
        units: `
            <div class="settings-section active">
                <h3>Unidades e Polos</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead>
                        <tr style="text-align: left; color: var(--text-muted); font-size: 0.8rem;">
                            <th style="padding: 1rem;">NOME</th>
                            <th>ESTADO</th>
                            <th>ALUNOS</th>
                            <th>STATUS</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-top: 1px solid var(--border);">
                            <td style="padding: 1rem;">Sede Principal - SP</td>
                            <td>São Paulo</td>
                            <td>850</td>
                            <td><span class="badge" style="background: rgba(76, 175, 80, 0.2); color: #4caf50;">Ativo</span></td>
                            <td><button class="btn-text" style="color: var(--primary);">Editar</button></td>
                        </tr>
                        <tr style="border-top: 1px solid var(--border);">
                            <td style="padding: 1rem;">Polo EAD - Curitiba</td>
                            <td>Paraná</td>
                            <td>434</td>
                            <td><span class="badge" style="background: rgba(76, 175, 80, 0.2); color: #4caf50;">Ativo</span></td>
                            <td><button class="btn-text" style="color: var(--primary);">Editar</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `,
        security: `
             <div class="settings-section active">
                <h3>Segurança & Autenticação</h3>
                <div class="form-group">
                    <label>Provedor de SSO</label>
                    <select>
                        <option>Nativo (E-mail/Senha)</option>
                        <option>Google Workspace</option>
                        <option>Microsoft Azure AD</option>
                        <option>SAML 2.0</option>
                    </select>
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 1rem; margin-top: 2rem;">
                    <input type="checkbox" checked style="width: 20px;">
                    <div>
                        <strong>Exigir 2FA (MFA)</strong>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Obrigatório para todos os administradores e instrutores.</p>
                    </div>
                </div>
            </div>
        `
    };

    container.innerHTML = tabs[tab] || 'Seção não encontrada';
};
