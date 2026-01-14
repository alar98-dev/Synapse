import React, { useEffect, useState } from 'react';

export default function SubmissionLogs({ submissionId }) {
  const [logs, setLogs] = useState('');

  useEffect(() => {
    if (!submissionId) return;

    const source = new EventSource(`/api/submissions/${submissionId}/stream`);
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'log') setLogs(prev => prev + data.text + '\n');
      } catch (err) {
        setLogs(prev => prev + e.data + '\n');
      }
    };
    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [submissionId]);

  return (
    <div className="submission-logs" data-cy="stream-logs">
      <pre>{logs || 'Aguardando logs...'}</pre>
    </div>
  );
}
