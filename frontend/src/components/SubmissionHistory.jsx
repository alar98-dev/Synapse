import React, { useEffect, useState } from 'react';

export default function SubmissionHistory({ lessonId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}/submissions/`)
      .then(res => res.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [lessonId]);

  return (
    <aside className="submission-history">
      <h3>Histórico de Submissões</h3>
      <ul data-cy="submission-history">
        {history.length === 0 && <li>Nenhuma submissão</li>}
        {history.map(s => (
          <li key={s.submission_id}>
            <strong>{s.status}</strong> — {new Date(s.timestamp).toLocaleString()} <br />
            <small>{s.result_summary}</small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
