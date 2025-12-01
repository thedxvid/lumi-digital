
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CreateUserSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128, 'Senha muito longa'),
  full_name: z.string().max(100, 'Nome muito longo').optional(),
  role: z.enum(['user', 'admin'], { errorMap: () => ({ message: 'Role inválida' }) }),
  access_granted: z.boolean(),
  plan_type: z.enum(['free', 'basic', 'pro', 'premium']).optional().default('basic'),
  duration_months: z.number().int().min(1).max(12).optional().default(3)
});

interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role: 'user' | 'admin';
  access_granted: boolean;
  plan_type?: 'basic' | 'pro';
  duration_months?: 1 | 3 | 6;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Configuração do servidor incompleta');
    }

    // Criar cliente com service role key para operações administrativas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input with zod
    const rawInput = await req.json();
    const validationResult = CreateUserSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Dados inválidos',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      email,
      password,
      full_name,
      role,
      access_granted,
      plan_type,
      duration_months
    } = validationResult.data;

    // Usar email como nome se full_name não fornecido
    const displayName = full_name || email.split('@')[0];

    console.log('🔧 Criando usuário:', { email, full_name: displayName, role, access_granted });

    // Verificar se o usuário já existe
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    if (checkError) {
      console.error('❌ Erro ao verificar usuários existentes:', checkError);
    } else {
      const userExists = existingUser?.users?.find(u => u.email === email);
      if (userExists) {
        throw new Error('Já existe um usuário com este email');
      }
    }

    // 1. Criar usuário no auth.users usando Admin API
    console.log('🔨 Criando usuário na auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: displayName
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário na auth:', authError);
      
      // Tratar erro de email duplicado
      if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
        throw new Error('Já existe um usuário cadastrado com este email');
      }
      
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('Falha ao criar usuário - usuário não retornado');
    }

    console.log('✅ Usuário criado na auth:', authUser.user.id);

    // Aguardar um pouco para garantir que o trigger criou o perfil
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Atualizar perfil na tabela profiles (que foi criado automaticamente pelo trigger)
    console.log('🔨 Atualizando perfil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        access_granted,
        subscription_status: access_granted ? 'active' : 'inactive',
        full_name: displayName
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError);
      // Tentar deletar o usuário criado se falhou ao atualizar perfil
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log('🗑️ Usuário deletado após falha no perfil');
      } catch (deleteError) {
        console.error('❌ Erro ao deletar usuário após falha:', deleteError);
      }
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    console.log('✅ Perfil atualizado com sucesso');

    // 3. Criar subscription se access_granted for true
    if (access_granted) {
      console.log('🔨 Criando subscription...');
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration_months);
      
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: authUser.user.id,
          plan_type,
          duration_months,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          auto_renew: false,
        });
      
      if (subscriptionError) {
        console.error('❌ Erro ao criar subscription:', subscriptionError);
      } else {
        console.log('✅ Subscription criada com sucesso');
      }
    }

    // 4. Atualizar usage_limits se access_granted for true
    if (access_granted) {
      console.log('🔨 Atualizando usage_limits...');
      
      const limitsConfig = plan_type === 'pro' ? {
        creative_images_daily_limit: 30,
        creative_images_monthly_limit: 900,
        profile_analysis_daily_limit: 10,
        carousels_monthly_limit: 10,
        videos_monthly_limit: 15,
      } : {
        creative_images_daily_limit: 10,
        creative_images_monthly_limit: 300,
        profile_analysis_daily_limit: 5,
        carousels_monthly_limit: 3,
        videos_monthly_limit: 0,
      };
      
      const { error: limitsError } = await supabase
        .from('usage_limits')
        .update({
          plan_type,
          ...limitsConfig,
        })
        .eq('user_id', authUser.user.id);
      
      if (limitsError) {
        console.error('❌ Erro ao atualizar usage_limits:', limitsError);
      } else {
        console.log('✅ Usage limits atualizados');
      }
    }

    // 5. Adicionar role se não for usuário comum
    if (role === 'admin') {
      console.log('🔨 Adicionando role de admin...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'admin'
        });

      if (roleError) {
        console.error('❌ Erro ao adicionar role:', roleError);
        console.log('⚠️ Usuário criado mas sem role de admin');
      } else {
        console.log('✅ Role de admin adicionada');
      }
    }

    // 6. Log da atividade
    try {
      const { error: logError } = await supabase.rpc('log_activity', {
        _action: 'user_created_by_admin',
        _details: {
          created_user_id: authUser.user.id,
          email,
          role,
          access_granted
        }
      });

      if (logError) {
        console.error('⚠️ Erro ao registrar log:', logError);
      } else {
        console.log('✅ Atividade logada');
      }
    } catch (logError) {
      console.error('⚠️ Erro ao registrar log:', logError);
    }

    console.log('✅ Usuário criado com sucesso:', authUser.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        message: 'Usuário criado com sucesso'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erro na criação do usuário:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
