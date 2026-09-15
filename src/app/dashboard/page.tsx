import { createClient } from '@supabase/supabase-js';

async function getDashboardData(userId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId);
  
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { invoices, settings };
}

export default async function DashboardPage() {
  const userId = 'mock-user-id'; // In production, get from session
  const { invoices, settings } = await getDashboardData(userId);
  
  const totalRecovered = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
  const outstanding = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
  const activeChases = invoices?.filter(inv => inv.status === 'pending').length || 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your revenue recovery efforts</p>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recovered</p>
                <p className="text-2xl font-bold text-gray-900">${totalRecovered.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">${outstanding.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <span className="text-yellow-600">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Chases</p>
                <p className="text-2xl font-bold text-gray-900">{activeChases}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600">📧</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Activity Feed</h2>
          </div>
          <div className="p-6">
            {invoices?.length ? (
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.invoice_id} className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {invoice.status === 'paid' ? '✓' : '📧'}
                    </div>
                    <div>
                      <p className="text-sm">{invoice.client_name}</p>
                      <p className="text-xs text-gray-500">
                        {invoice.status === 'paid' ? 'Payment received' : 'AI sent reminder'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No activity yet. Add your first invoice to get started.</p>
            )}
          </div>
        </div>
        
        {/* Invoice List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Overdue Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-6">Client</th>
                  <th className="text-left py-3 px-6">Amount</th>
                  <th className="text-left py-3 px-6">Due Date</th>
                  <th className="text-left py-3 px-6">Status</th>
                  <th className="text-left py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border-b">
                    <td className="py-3 px-6">{invoice.client_name}</td>
                    <td className="py-3 px-6">${invoice.amount}</td>
                    <td className="py-3 px-6">{invoice.due_date}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <button className="text-blue-600 text-sm">Pause AI</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
