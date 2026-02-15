const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
    const { data, error } = await supabase.auth.signUp({
        email: 'teste2@gmail.com',
        password: 'Admin123@',
        options: {
            data: {
                full_name: 'Teste User',
            }
        }
    });

    if (error) {
        console.error('Error signing up:', error.message);
    } else {
        console.log('User created successfully:', data.user.email);
        if (!data.session) {
            console.log('Verification email sent (if enabled).');
        }
    }
}

signUp();
