import { createClient } from '@supabase/supabase-js';

async function getAdminData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: users } = await supabase
    .from('users')
    .select('*');
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*');
  
  return { users, invoices };
}

export default async function AdminPage() {
  const { users, invoices } = await getAdminData();
  
  const totalUsers = users?.length || 0;
  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const revenue = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users, track system health, and debug issues</p>
        </div>
        
        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Paid Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${revenue.toLocaleString()}</p>
          </div>
        </div>
        
        {/* User Management */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-6">Email</th>
                  <th className="text-left py-3 px-6">Plan</th>
                  <th className="text-left py-3 px-6">Credits</th>
                  <th className="text-left py-3 px-6">Created</th>
                  <th className="text-left py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.user_id} className="border-b">
                    <td className="py-3 px-6">{user.email}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.plan_type === 'agency' ? 'bg-purple-100 text-purple-800' :
                        user.plan_type === 'solo' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan_type}
                      </span>
                    </td>
                    <td className="py-3 px-6">{user.credits_used}</td>
                    <td className="py-3 px-6">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-6">
                      <button className="text-blue-600 text-sm mr-3">Impersonate</button>
                      <button className="text-red-600 text-sm">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* System Health */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">System Health</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">API Usage</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">AI API Tokens Used</p>
                    <p className="text-lg font-semibold">1.2M / 2M</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Volume</p>
                    <p className="text-lg font-semibold">45,231 sent</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  <p className="text-sm">• System backup completed</p>
                  <p className="text-sm">• New user signup: user@example.com</p>
                  <p className="text-sm">• Payment processed: $2,500</p>
                  <p className="text-sm">• Cron job executed: 09:00 UTC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
