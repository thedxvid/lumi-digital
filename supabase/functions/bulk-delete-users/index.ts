import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkDeleteRequest {
  userIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se caller é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se é admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userIds }: BulkDeleteRequest = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid user IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[bulk-delete-users] Admin ${user.email} deletando ${userIds.length} usuários`);

    // Verificar se algum dos usuários é admin (proteção extra)
    const { data: targetRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('role', 'admin');

    if (targetRoles && targetRoles.length > 0) {
      return new Response(JSON.stringify({ error: 'Cannot delete admin users' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string, error: string }[]
    };

    // Deletar cada usuário
    for (const userId of userIds) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          console.error(`Erro ao deletar ${userId}:`, deleteError);
          results.failed.push({ id: userId, error: deleteError.message });
        } else {
          results.success.push(userId);
          
          // Log admin action
          await supabaseAdmin.rpc('log_admin_action', {
            _target_user_id: userId,
            _action: 'bulk_delete_user',
            _details: { deleted_by: user.email }
          });
        }
      } catch (error: any) {
        console.error(`Exception ao deletar ${userId}:`, error);
        results.failed.push({ id: userId, error: error.message });
      }
    }

    console.log(`[bulk-delete-users] Resultado: ${results.success.length} deletados, ${results.failed.length} falharam`);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[bulk-delete-users] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
