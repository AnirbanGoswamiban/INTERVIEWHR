const {createClient} = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABSEURI, process.env.SUPABASEKEY)

module.exports={supabase}
