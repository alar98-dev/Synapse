import React, { useEffect, useState } from 'react'

export default function ChatWidget({ courseId, userId }: { courseId?: number, userId?: string }){
  const [messages, setMessages] = useState<Array<{id:number,from:string,text:string}>>([])
  const [text, setText] = useState('')

  useEffect(()=>{
    // demo: seed messages (in real use fetch history)
    setMessages([{id:1,from:'Aluno',text:'Olá, professor!'}, {id:2,from:'Instrutor',text:'Olá! vamos começar.'}])
  }, [courseId])

  function send(){
    if(!text.trim()) return
    const m = {id: Date.now(), from: userId||'Você', text}
    setMessages(prev => [...prev, m])
    setText('')
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">Chat da Aula</div>
      <div className="chat-body">
        {messages.map(m=> (
          <div key={m.id} className={`chat-msg ${m.from=== (userId||'Você') ? 'me' : 'other'}`}>
            <div className="from">{m.from}</div>
            <div className="text">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma mensagem..." />
        <button className="btn primary" onClick={send}>Enviar</button>
      </div>
    </div>
  )
}
