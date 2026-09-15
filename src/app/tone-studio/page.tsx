import { createClient } from '@supabase/supabase-js';

async function getToneSettings(userId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: settings } = await supabase
    .from('settings')
    .select('ai_tone_prompt')
    .eq('user_id', userId)
    .single();
  
  return settings;
}

export default async function ToneStudioPage() {
  const userId = 'mock-user-id';
  const settings = await getToneSettings(userId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tone Studio</h1>
          <p className="text-gray-600 mt-2">Train AI to write in your voice</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Training Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">AI Tone Training</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste 2 old emails (your writing style)
                </label>
                <textarea
                  className="w-full h-48 border border-gray-300 rounded-md p-3"
                  placeholder="Paste your old emails here to train the AI..."
                  defaultValue={settings?.ai_tone_prompt || ''}
                />
              </div>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Train AI
              </button>
              
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone Escalation
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Level 1: Friendly</span>
                      <span className="text-sm">Level 2: Polite</span>
                      <span className="text-sm">Level 3: Firm</span>
                    </div>
                    <input type="range" min="1" max="3" defaultValue="1" className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Preview</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Details
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Client Name" className="border border-gray-300 rounded-md p-2" />
                  <input type="number" placeholder="Amount" className="border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                Generate Preview
              </button>
              
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Generated Email:</h3>
                <div className="text-sm text-gray-600">
                  <p>Subject: Gentle reminder about invoice #1234</p>
                  <p className="mt-2">
                    Hi [Client Name],<br/><br/>
                    I hope you're doing well. I'm reaching out to gently remind you about the outstanding invoice #1234 for $1,250, which was due on [Due Date].<br/><br/>
                    If you've already made the payment, please disregard this message. Otherwise, you can settle the invoice using the 1-click checkout link below.<br/><br/>
                    [Checkout Link]<br/><br/>
                    Best regards,<br/>
                    [Your Name]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
