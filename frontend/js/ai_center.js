window.initView = async function() {
    console.log("Iniciando Centro de Inteligência...");
    setupTerminal();
};

function setupTerminal() {
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('ai-terminal-output');
    
    if (!input || !output) return;

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const cmd = input.value;
            input.value = '';
            
            // Add user line
            const userLine = document.createElement('div');
            userLine.className = 'term-line';
            userLine.innerHTML = `<span style="color: #4caf50;">$</span> ${cmd}`;
            output.appendChild(userLine);
            
            // Real AI response
            try {
                const resp = await fetch('/api/v1/cognition/sessions/probe/', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt: cmd, provider: 'mock' })
                });
                const result = await resp.json();
                
                const aiLine = document.createElement('div');
                aiLine.className = 'term-line';
                if (resp.ok) {
                    aiLine.innerHTML = `> ${result.response || 'No response'}`;
                } else {
                    aiLine.innerHTML = `<span style="color: #f44336;">> Error: ${result.error || 'Unknown error'}</span>`;
                }
                output.appendChild(aiLine);
                output.scrollTop = output.scrollHeight;
            } catch (err) {
                const aiLine = document.createElement('div');
                aiLine.className = 'term-line';
                aiLine.innerHTML = `<span style="color: #f44336;">> Connection error</span>`;
                output.appendChild(aiLine);
            }
        }
    });
}

window.addAgent = function() {
    alert("Funcionalidade para criar novo Agente de IA em desenvolvimento.");
}
