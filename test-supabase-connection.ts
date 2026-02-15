
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Manually load env vars since we are running this with ts-node/node
const supabaseUrl = "https://vmkhqtuqgvtcapwmxtov.supabase.co"
const supabaseKey = "sb_publishable_jEssWL7mMXX1rIWl5HTvVA_W4A-cL7m"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log("Testing connection to:", supabaseUrl)

    // Try to list tables? No, can't list tables with client.
    // Try to get session (should be null but no error)
    const { data, error } = await supabase.from('bank_accounts').select('*').limit(1)

    if (error) {
        console.error("Connection Error:", error.message)
        if (error.code === 'PGRST301') {
            console.log("Note: RLS might be preventing access, but we connected!")
        }
    } else {
        console.log("Success! Connected to Supabase.")
        console.log("Data from bank_accounts:", data)
    }
}

testConnection()
