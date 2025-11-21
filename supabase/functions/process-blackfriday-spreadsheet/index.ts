import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedUser {
  email: string;
  name: string;
  status: string;
  offer: string;
  date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Starting authentication...');
    
    const authHeader = req.headers.get('Authorization');
    console.log('📋 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extrair JWT do header
    const jwt = authHeader.replace('Bearer ', '');
    console.log('🔑 JWT extracted, length:', jwt.length);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('👤 Fetching user with JWT...');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwt);

    if (userError) {
      console.error('❌ Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Error verifying user: ' + userError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No user found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    console.log('🔍 Checking admin role...');
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (roleError) {
      console.error('❌ Error checking role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error checking permissions: ' + roleError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!hasAdminRole) {
      console.error('❌ User is not admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('✅ Admin access confirmed');

    const body = await req.json();
    const { file: base64File, filename } = body;

    if (!base64File) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing file:', filename);

    // Decodificar base64 e ler arquivo Excel
    const binaryString = atob(base64File);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('Total rows in spreadsheet:', jsonData.length);

    // Extrair emails válidos (status = "paid")
    const validEmails = new Set<string>();
    const parsedUsers: ParsedUser[] = [];

    jsonData.forEach((row: any) => {
      const email = row['Email']?.toString().toLowerCase().trim() || '';
      const status = row['Status']?.toString().toLowerCase() || '';
      const name = row['Cliente']?.toString().trim() || '';
      const offer = row['Oferta']?.toString() || '';
      const date = row['Data de Criação']?.toString() || '';

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (status === 'paid' && email && emailRegex.test(email)) {
        validEmails.add(email);
        parsedUsers.push({ email, name, status, offer, date });
      }
    });

    console.log('Valid paid emails found:', validEmails.size);

    // Buscar todos os usuários com access_granted = true
    const { data: allUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, access_granted, subscription_status, created_at')
      .eq('access_granted', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log('Total users with access_granted:', allUsers?.length || 0);

    // Buscar emails de todos os usuários do auth
    const { data: authUsersData, error: authError } = await supabaseClient.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    const userEmailMap = new Map(
      authUsersData.users.map(u => [u.id, u.email?.toLowerCase() || ''])
    );

    console.log('Total auth users mapped:', userEmailMap.size);

    // Buscar admins para proteger
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      throw adminError;
    }

    const adminIds = new Set(adminUsers?.map(a => a.user_id) || []);
    console.log('Total admins to protect:', adminIds.size);

    // Identificar usuários para remover (no sistema mas NÃO na planilha)
    const usersToRevoke = allUsers?.filter(profile => {
      const email = userEmailMap.get(profile.id);
      const isAdmin = adminIds.has(profile.id);
      const isInSpreadsheet = email && validEmails.has(email);
      
      return !isAdmin && !isInSpreadsheet;
    }) || [];

    console.log('Users to revoke:', usersToRevoke.length);

    // Preparar relatório
    const report = {
      spreadsheet: {
        totalRows: jsonData.length,
        validPaidEmails: validEmails.size,
        parsedUsers: parsedUsers.slice(0, 100), // Limitar a 100 para não sobrecarregar
      },
      system: {
        totalUsersWithAccess: allUsers?.length || 0,
        totalAdmins: adminIds.size,
        usersToRevoke: usersToRevoke.map(u => ({
          id: u.id,
          email: userEmailMap.get(u.id) || 'N/A',
          full_name: u.full_name || 'N/A',
          subscription_status: u.subscription_status,
          created_at: u.created_at,
        })),
      },
      summary: {
        legitimateBuyers: validEmails.size,
        currentUsersWithAccess: allUsers?.length || 0,
        usersToRevoke: usersToRevoke.length,
        adminsProtected: adminIds.size,
      },
    };

    console.log('Report summary:', report.summary);

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing spreadsheet:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
