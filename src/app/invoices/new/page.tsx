export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-600 mt-2">Add a new invoice to track</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3"
                placeholder="Enter client name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md p-3"
                placeholder="Enter client email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md p-3"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select className="w-full border border-gray-300 rounded-md p-3">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>INR</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md p-3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3"
                placeholder="e.g., INV-2024-001"
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-6">
              <button type="button" className="px-6 py-3 border border-gray-300 rounded-md">
                Cancel
              </button>
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
