const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Available (not shown for security)' : 'Missing');
console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Available (not shown for security)' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Available (not shown for security)' : 'Missing');
