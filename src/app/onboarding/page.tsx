export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Astrix AI</h1>
          <p className="text-gray-600">Let's get you set up in 3 simple steps</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8">
          {/* Step 1: Connect Payment Gateway */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">1</div>
              <h2 className="text-lg font-semibold">Connect Payment Gateway</h2>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 mb-4">Connect Stripe, Razorpay, or paste a static payment link</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="border border-gray-300 rounded-lg p-4 hover:border-blue-500">
                  <div className="text-2xl mb-2">💳</div>
                  <p className="font-medium">Stripe</p>
                </button>
                <button className="border border-gray-300 rounded-lg p-4 hover:border-blue-500">
                  <div className="text-2xl mb-2">💰</div>
                  <p className="font-medium">Razorpay</p>
                </button>
                <button className="border border-gray-300 rounded-lg p-4 hover:border-blue-500">
                  <div className="text-2xl mb-2">🔗</div>
                  <p className="font-medium">Custom Link</p>
                </button>
              </div>
            </div>
          </div>
          
          {/* Step 2: AI Tone Setup */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">2</div>
              <h2 className="text-lg font-semibold">AI Tone Setup</h2>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 mb-4">Paste 2 old emails to train AI in your writing style</p>
              <textarea
                className="w-full h-32 border border-gray-300 rounded-md p-3"
                placeholder="Paste your old emails here..."
              />
            </div>
          </div>
          
          {/* Step 3: Add First Invoice */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">3</div>
              <h2 className="text-lg font-semibold">Add First Invoice</h2>
            </div>
            <div className="ml-11">
              <p className="text-gray-600 mb-4">Start tracking an overdue invoice</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Client Name" className="border border-gray-300 rounded-md p-2" />
                <input type="email" placeholder="Client Email" className="border border-gray-300 rounded-md p-2" />
                <input type="number" placeholder="Amount" className="border border-gray-300 rounded-md p-2" />
                <input type="date" className="border border-gray-300 rounded-md p-2" />
              </div>
            </div>
          </div>
          
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium">
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
}
