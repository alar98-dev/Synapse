**Frontend Islands Architecture — HTML/JS + React/TSX**

Resumo
- Arquitetura recomendada: Progressive Enhancement / Islands Architecture.
- Base: SPA leve em HTML + modular JS (fetch + Promise).
- React/TSX: usado apenas para componentes dinâmicos complexos (ilhas), carregados sob demanda.

Por que essa decisão
- Evita que Vite/esbuild quebre ao rastrear entradas não-TSX. Mantém carregamento rápido.
- Permite evolução gradual: páginas HTML/JS funcionam sem dependências pesadas; React é adotado onde agrega.

Regras e princípios (obrigatórias)
1. Single Page Shell: `frontend/index.html` permanece a shell; views menores são partials HTML em `/frontend/src/views/*/index.html`.
2. JS Modular: cada view tem `index.js` para comportamento; carregue por `core/app.js` via `fetch()` e `dynamic <script>`.
3. React/TSX apenas como "ilhas":
   - Crie componentes React dentro de `/frontend/src/islands/<name>/` com `index.tsx` e um `mount()` export.
   - Não importe TSX diretamente em HTML partials. Em vez disso, no `index.js` da view faça import dinâmico: `import('/frontend/src/islands/MyIsland/index.js').then(m=>m.mount(el, props))`.
4. Isolamento: cada ilha gerencia seu próprio bundle (Vite code-splitting) e não assume estado global grande.
5. Fetch/API: as views continuam usando `fetch('/api/v1/...')` e Promises; React islands recebem dados via props ou re-fetch.
6. Entradas Vite: evite apontar Vite para a pasta inteira com muitas extensões. Use entradas claras no `vite.config.js` se necessário.

Padrão de implementação (exemplo)

1) Partial HTML (view): `/frontend/src/views/course_detail/index.html`
```html
<section>
  <h1 id="course-title"></h1>
  <div id="course-island" data-course-id="42"></div>
</section>
<script src="/frontend/src/views/course_detail/index.js"></script>
```

2) View JS (`index.js`) — carrega ilha React sob demanda
```js
window.initView = function(){
  const mountPoint = document.getElementById('course-island');
  import('/frontend/src/islands/CourseEditor/index.js').then(m=>{
    m.mount(mountPoint, { courseId: mountPoint.dataset.courseId });
  });
}
```

3) Island (React) — `/frontend/src/islands/CourseEditor/index.tsx`
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'

export function mount(el: HTMLElement, props:any){
  const root = createRoot(el)
  root.render(<CourseEditor {...props} />)
}

export default function CourseEditor({courseId}){ return <div>Editor {courseId}</div> }
```

Vite / build notes
- Vite fará code-splitting para imports dinâmicos (`import('/path/to/island')`).
- Garanta que `vite.config.js` não force escaneamento de arquivos HTML parciais como entradas (use `optimizeDeps`/`build.rollupOptions.input` quando necessário).

Guidelines para LLM (auto-geração de componentes)
- Prompt template: inclua "target: islands architecture", file paths, desired props, and whether to include types (TSX) or plain JS.
- Example prompt cue: "Generate an island component at /frontend/src/islands/ChatWidget/index.tsx with mount(el, props) and CSS module file; props: {courseId:number, userId:string}. Keep bundle small."
- LLMs must output: `index.tsx` (component + mount), optionally `index.css`, and a tiny usage snippet for `view/index.js` showing dynamic import.

Checklist antes de commitar
- Cada island exporta `mount(el, props)`.
- Views do dynamic import e chamam `mount` apenas quando `el` existe.
- Não referenciar `document.write` ou carregar TSX synchronously in HTML.

Conclusão
- Essa abordagem mantém a simplicidade do SPA leve, evita erros de build por entradas malformadas e permite introduzir React com segurança apenas onde necessário.

---
Arquivo criado automaticamente pelo assistente para documentar arquitetura front-end (Islands).
