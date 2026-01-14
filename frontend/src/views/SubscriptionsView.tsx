import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Plan {
  id: number;
  name: string;
  price: string;
}

interface Subscription {
  id: number;
  plan_detail: Plan;
  status: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get('/api/v1/payments/subscriptions/');
        setSubscriptions(response.data);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando assinaturas...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Minhas Assinaturas</h1>
      
      {subscriptions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg text-center shadow">
          <p className="text-gray-600 dark:text-slate-400 mb-4">Você ainda não possui assinaturas ativas.</p>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Ver Planos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{sub.plan_detail.name}</h3>
                <p className="text-sm text-gray-500">
                  Status: <span className={sub.is_active ? 'text-green-600 font-semibold' : 'text-red-500'}>
                    {sub.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Desde: {new Date(sub.start_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">R$ {sub.plan_detail.price}</div>
                <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
                  Ver recibos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsView;
