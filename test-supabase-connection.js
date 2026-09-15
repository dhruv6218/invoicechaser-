const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://shmzffwsljesmqfbvvcw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobXpmZndzbGplc21xZmJ2dmN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE5OTQyMSwiZXhwIjoyMTA0Nzc1NDIxfQ.N9jqoGsDtDaIcrKJVKkX7cow1wlSA31WB1OtI8GSLd0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by querying existing tables
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    
    if (error) {
      console.log('Table check error:', error.message);
    } else {
      console.log('✓ Connection successful!');
      console.log('Database is accessible');
    }
    
    // Try to list tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_list');
    
    if (tablesError) {
      console.log('Cannot list tables via RPC:', tablesError.message);
    } else {
      console.log('Tables:', tables);
    }
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
