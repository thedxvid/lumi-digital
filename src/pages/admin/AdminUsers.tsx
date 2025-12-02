import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, UserCheck, UserX, Mail, Users, Plus, Shield, Settings, 
  Download, MoreVertical, Calendar, Eye, SlidersHorizontal 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddUserModal from '@/components/admin/AddUserModal';
import EmailTestModal from '@/components/admin/EmailTestModal';
import { UserRolesManager } from '@/components/admin/UserRolesManager';
import { UserLimitsEditor } from '@/components/admin/UserLimitsEditor';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { BulkSubscriptionModal } from '@/components/admin/BulkSubscriptionModal';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { SubscriptionManager } from '@/components/admin/SubscriptionManager';
import { UsageBar } from '@/components/admin/UsageBar';
import { UsageLimitsProgressModal } from '@/components/admin/UsageLimitsProgressModal';
import { EmailProgressModal } from '@/components/admin/EmailProgressModal';
import { VideoLimitsDebug } from '@/components/admin/VideoLimitsDebug';
import { toast as sonnerToast } from 'sonner';

interface User {
  id: string;
  full_name: string;
  email: string;
  access_granted: boolean;
  subscription_status: string;
  created_at: string;
  last_sign_in_at?: string;
  roles?: string[];
  subscription?: {
    plan_type: string;
    end_date: string;
    is_active: boolean;
  };
  usage_limits?: {
    creative_images_monthly_used: number;
    creative_images_monthly_limit: number;
    videos_monthly_used: number;
    videos_monthly_limit: number;
  };
  order?: {
    order_value: number;
    order_value_formatted: string;
    product_offer_name: string;
    payment_method: string;
  };
}

interface Filters {
  planType: string;
  accessStatus: string;
  role: string;
  subscriptionStatus: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailTestModal, setShowEmailTestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showLimitsEditor, setShowLimitsEditor] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [selectedUserForLimits, setSelectedUserForLimits] = useState<{ id: string; name: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    planType: 'all',
    accessStatus: 'all',
    role: 'all',
    subscriptionStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isResendingEmails, setIsResendingEmails] = useState(false);
  const [isResendingAllEmails, setIsResendingAllEmails] = useState(false);
  const [isFixingLimits, setIsFixingLimits] = useState(false);
  const [isResendingMissingEmails, setIsResendingMissingEmails] = useState(false);
  
  // Progress modal state
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressData, setProgressData] = useState({
    totalUsers: 0,
    currentBatch: 0,
    totalBatches: 0,
    processedCount: 0,
    errors: [] as string[],
    stage: 'identifying' as 'identifying' | 'creating' | 'complete' | 'error'
  });
  const [showBulkSubscriptionModal, setShowBulkSubscriptionModal] = useState(false);
  const { toast } = useToast();
  
  // Email progress modal states
  const [showEmailProgress, setShowEmailProgress] = useState(false);
  const [emailProgress, setEmailProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    current: "",
    errors: [] as Array<{ email: string; error: string }>,
  });
  const [isEmailComplete, setIsEmailComplete] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Buscando usuários com paginação...');
      
      // Buscar todos os usuários em lotes de 500
      let allUsers: any[] = [];
      let page = 1;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        console.log(`📄 Carregando página ${page}...`);
        
        const { data: usersData, error: usersError } = await supabase
          .rpc('get_admin_user_details_paginated', {
            _page: page,
            _page_size: pageSize
          });

        if (usersError) throw usersError;

        if (usersData && usersData.length > 0) {
          allUsers = [...allUsers, ...usersData];
          hasMore = usersData.length === pageSize;
          page++;
          console.log(`✅ ${usersData.length} usuários carregados (total: ${allUsers.length})`);
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total de ${allUsers.length} usuários carregados`);

      // Buscar pedidos pagos
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, order_value, order_value_formatted, product_offer_name, payment_method')
        .eq('order_status', 'paid')
        .order('created_at', { ascending: false });

      console.log(`📦 ${orders?.length || 0} pedidos carregados`);

      // Mapear pedidos por user_id (pegar o mais recente)
      const ordersMap = new Map();
      orders?.forEach(order => {
        if (order.user_id && !ordersMap.has(order.user_id)) {
          ordersMap.set(order.user_id, order);
        }
      });

      // Buscar subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .limit(10000);

      // Buscar limites
      const { data: limits } = await supabase
        .from('usage_limits')
        .select('*')
        .limit(10000);

      // Buscar roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(10000);

      // Mapear roles por usuário
      const rolesMap = new Map<string, string[]>();
      rolesData?.forEach(role => {
        const userRoles = rolesMap.get(role.user_id) || [];
        userRoles.push(role.role);
        rolesMap.set(role.user_id, userRoles);
      });

      // Mapear subscriptions
      const subsMap = new Map();
      subscriptions?.forEach(sub => {
        subsMap.set(sub.user_id, sub);
      });

      // Mapear limites
      const limitsMap = new Map();
      limits?.forEach(limit => {
        limitsMap.set(limit.user_id, limit);
      });

      // Combinar dados
      const fullUsers: User[] = allUsers.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || 'Email não disponível',
        access_granted: user.access_granted || false,
        subscription_status: user.subscription_status || 'inactive',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        roles: rolesMap.get(user.id) || [],
        subscription: subsMap.get(user.id),
        usage_limits: limitsMap.get(user.id),
        order: ordersMap.get(user.id)
      }));

      setUsers(fullUsers);
      console.log('✅ Usuários carregados:', fullUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentAccess: boolean) => {
    try {
      console.log(`🔄 ${!currentAccess ? 'Concedendo' : 'Removendo'} acesso para usuário:`, userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          access_granted: !currentAccess,
          subscription_status: !currentAccess ? 'active' : 'inactive'
        })
        .eq('id', userId);

      if (error) throw error;

      // Log da atividade
      try {
        await supabase.rpc('log_activity', {
          _action: `user_access_${!currentAccess ? 'granted' : 'revoked'}`,
          _details: { target_user_id: userId }
        });
      } catch (logError) {
        console.error('⚠️ Erro ao registrar log:', logError);
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              access_granted: !currentAccess,
              subscription_status: !currentAccess ? 'active' : 'inactive'
            }
          : user
      ));

      toast({
        title: 'Sucesso',
        description: `Acesso ${!currentAccess ? 'concedido' : 'removido'} com sucesso`,
      });

      console.log(`✅ Acesso ${!currentAccess ? 'concedido' : 'removido'} com sucesso`);
    } catch (error) {
      console.error('Error toggling user access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o acesso do usuário',
        variant: 'destructive'
      });
    }
  };

  const handleUserAdded = () => {
    console.log('🔄 Recarregando lista de usuários após adição...');
    fetchUsers();
  };

  const handleManageRoles = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowRolesModal(true);
  };

  const handleEditLimits = (userId: string, userName: string) => {
    setSelectedUserForLimits({ id: userId, name: userName });
    setShowLimitsEditor(true);
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setShowDetailsModal(true);
  };

  const handleExtendSubscription = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowSubscriptionManager(true);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkActivate = async () => {
    console.log('🎯 handleBulkActivate chamado. Usuários selecionados:', selectedUsers);
    
    if (!confirm(`Ativar ${selectedUsers.length} usuários?\n\nIsso irá:\n✓ Conceder acesso à plataforma\n✓ Criar assinatura Básica (3 meses)\n✓ Configurar limites de uso\n✓ Enviar email de reativação`)) {
      return;
    }

    const BATCH_SIZE = 50; // Processar em lotes de 50
    let totalProcessed = 0;
    let totalErrors = 0;

    try {
      const totalBatches = Math.ceil(selectedUsers.length / BATCH_SIZE);
      
      sonnerToast.loading(`Ativando lote 1 de ${totalBatches}...`, { id: 'bulk-activate' });

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3); // 3 meses

      const planLimits = {
        creative_images_daily_limit: 10,
        creative_images_monthly_limit: 300,
        profile_analysis_daily_limit: 5,
        carousels_monthly_limit: 3,
        videos_monthly_limit: 0,
      };

      // Processar em lotes
      for (let i = 0; i < selectedUsers.length; i += BATCH_SIZE) {
        const batch = selectedUsers.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        sonnerToast.loading(`Ativando lote ${batchNumber} de ${totalBatches} (${batch.length} usuários)...`, { 
          id: 'bulk-activate' 
        });

        try {
          // 1. Atualizar profiles do lote
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ access_granted: true, subscription_status: 'active' })
            .in('id', batch);

          if (profileError) {
            console.error(`❌ Erro ao atualizar profiles do lote ${batchNumber}:`, profileError);
            totalErrors += batch.length;
            continue;
          }

          // 2. Desativar subscriptions antigas do lote
          await supabase
            .from('subscriptions')
            .update({ is_active: false })
            .in('user_id', batch)
            .eq('is_active', true);

          // 3. Criar novas subscriptions do lote
          const subscriptionsToInsert = batch.map(userId => ({
            user_id: userId,
            plan_type: 'basic',
            duration_months: 3,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
          }));

          const { error: subError } = await supabase
            .from('subscriptions')
            .insert(subscriptionsToInsert);

          if (subError) {
            console.error(`❌ Erro ao criar subscriptions do lote ${batchNumber}:`, subError);
            totalErrors += batch.length;
            continue;
          }

          // 4. Criar usage_limits do lote (com todos os campos necessários)
          const limitsToUpsert = batch.map(userId => ({
            user_id: userId,
            plan_type: 'basic',
            creative_images_daily_limit: 10,
            creative_images_monthly_limit: 300,
            profile_analysis_daily_limit: 5,
            carousels_monthly_limit: 3,
            videos_monthly_limit: 0,
            sora_text_videos_lifetime_limit: 2,
            kling_image_videos_lifetime_limit: 1,
            video_credits: 0,
            creative_images_daily_used: 0,
            creative_images_monthly_used: 0,
            profile_analysis_daily_used: 0,
            carousels_monthly_used: 0,
            videos_monthly_used: 0,
            sora_text_videos_lifetime_used: 0,
            kling_image_videos_lifetime_used: 0,
            video_credits_used: 0,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
          }));

          const { error: limitsError } = await supabase
            .from('usage_limits')
            .upsert(limitsToUpsert, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            });

          if (limitsError) {
            console.error(`❌ Erro ao atualizar limits do lote ${batchNumber}:`, limitsError);
            totalErrors += batch.length;
            continue;
          }

          totalProcessed += batch.length;
          
          // Pequeno delay entre lotes
          if (i + BATCH_SIZE < selectedUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (batchError) {
          console.error(`❌ Erro no lote ${batchNumber}:`, batchError);
          totalErrors += batch.length;
        }
      }

      // 5. Enviar emails de reativação (respeitando rate limit de 2/segundo)
      sonnerToast.loading('Enviando emails de reativação...', { id: 'bulk-activate' });
      
      const selectedUsersData = users.filter(u => selectedUsers.includes(u.id));
      let emailsSent = 0;
      let emailsFailed = 0;

      // Enviar emails sequencialmente com delay de 550ms (garantindo máximo de 2/segundo)
      for (let i = 0; i < selectedUsersData.length; i++) {
        const user = selectedUsersData[i];
        
        try {
          await supabase.functions.invoke('send-reactivation-email', {
            body: {
              email: user.email,
              fullName: user.full_name || 'Usuário',
              planType: 'basic',
              endDate: endDate.toISOString(),
            }
          });
          emailsSent++;
        } catch (error) {
          console.error(`❌ Erro ao enviar email para ${user.email}:`, error);
          emailsFailed++;
        }

        // Delay de 550ms entre cada email para respeitar rate limit de 2/s
        if (i < selectedUsersData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 550));
        }
      }

      sonnerToast.success('Ativação Concluída!', {
        id: 'bulk-activate',
        description: `${totalProcessed} usuários ativados${totalErrors > 0 ? `, ${totalErrors} erros` : ''}. Emails: ${emailsSent} enviados${emailsFailed > 0 ? `, ${emailsFailed} falhas` : ''}.`,
        duration: 8000
      });

      setSelectedUsers([]);
      await fetchUsers();

    } catch (error: any) {
      console.error('❌ Erro ao ativar usuários:', error);
      sonnerToast.error('Erro ao Ativar Usuários', {
        id: 'bulk-activate',
        description: `${totalProcessed} processados antes do erro. ${error?.message || 'Erro desconhecido'}`,
        duration: 8000
      });
    }
  };

  // CORREÇÃO 1: Criar usage_limits faltantes para usuários ativos
  const handleFixMissingUsageLimits = async () => {
    try {
      setIsFixingLimits(true);
      setProgressModalOpen(true);
      setProgressData({
        totalUsers: 0,
        currentBatch: 0,
        totalBatches: 0,
        processedCount: 0,
        errors: [],
        stage: 'identifying'
      });

      // Buscar usuários ativos com subscription basic que não têm usage_limits
      const { data: activeUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_status', 'active');

      if (usersError) throw usersError;

      const { data: existingLimits, error: limitsError } = await supabase
        .from('usage_limits')
        .select('user_id');

      if (limitsError) throw limitsError;

      const existingUserIds = new Set(existingLimits?.map(l => l.user_id) || []);
      const missingUsers = activeUsers?.filter(u => !existingUserIds.has(u.id)) || [];

      if (missingUsers.length === 0) {
        setProgressData(prev => ({ ...prev, stage: 'complete' }));
        sonnerToast.success('✅ Todos os usuários ativos já têm usage_limits!', { 
          duration: 5000 
        });
        setTimeout(() => setProgressModalOpen(false), 3000);
        return;
      }

      // Preparar batches
      const BATCH_SIZE = 50;
      const totalBatches = Math.ceil(missingUsers.length / BATCH_SIZE);
      
      setProgressData(prev => ({
        ...prev,
        totalUsers: missingUsers.length,
        totalBatches,
        stage: 'creating'
      }));

      // Criar em lotes de 50
      let totalCreated = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < missingUsers.length; i += BATCH_SIZE) {
        const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = missingUsers.slice(i, i + BATCH_SIZE);
        
        setProgressData(prev => ({
          ...prev,
          currentBatch: currentBatchNum
        }));

        const limitsData = batch.map(user => ({
          user_id: user.id,
          plan_type: 'basic',
          creative_images_daily_limit: 10,
          creative_images_monthly_limit: 300,
          profile_analysis_daily_limit: 5,
          carousels_monthly_limit: 3,
          videos_monthly_limit: 0,
          sora_text_videos_lifetime_limit: 2,
          kling_image_videos_lifetime_limit: 1,
          video_credits: 0,
          creative_images_daily_used: 0,
          creative_images_monthly_used: 0,
          profile_analysis_daily_used: 0,
          carousels_monthly_used: 0,
          videos_monthly_used: 0,
          sora_text_videos_lifetime_used: 0,
          kling_image_videos_lifetime_used: 0,
          video_credits_used: 0,
          last_daily_reset: new Date().toISOString(),
          last_monthly_reset: new Date().toISOString(),
        }));

        try {
          const { error: insertError } = await supabase
            .from('usage_limits')
            .insert(limitsData);

          if (insertError) {
            errors.push(`Batch ${currentBatchNum}: ${insertError.message}`);
            console.error(`❌ Erro no batch ${currentBatchNum}:`, insertError);
          } else {
            totalCreated += batch.length;
          }
        } catch (batchError: any) {
          errors.push(`Batch ${currentBatchNum}: ${batchError.message}`);
          console.error(`❌ Erro no batch ${currentBatchNum}:`, batchError);
        }
        
        setProgressData(prev => ({
          ...prev,
          processedCount: totalCreated,
          errors
        }));

        // Small delay between batches
        if (i + BATCH_SIZE < missingUsers.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setProgressData(prev => ({
        ...prev,
        stage: errors.length > 0 ? 'error' : 'complete'
      }));

      if (errors.length === 0) {
        sonnerToast.success(
          `✅ ${missingUsers.length} usage_limits criados!`,
          { duration: 5000 }
        );
      } else {
        sonnerToast.warning(
          `${totalCreated} criados, ${errors.length} erros`,
          { duration: 5000 }
        );
      }

      setTimeout(() => setProgressModalOpen(false), 5000);
      
    } catch (error: any) {
      console.error('Erro ao criar usage_limits:', error);
      setProgressData(prev => ({
        ...prev,
        stage: 'error',
        errors: [...prev.errors, error.message || 'Erro desconhecido']
      }));
      sonnerToast.error('Erro ao criar usage_limits faltantes', { 
        duration: 5000,
        description: error.message || 'Tente novamente ou verifique os logs.'
      });
    } finally {
      setIsFixingLimits(false);
    }
  };

  // CORREÇÃO 2: Reenviar emails para usuários que não receberam
  const handleResendMissingEmails = async () => {
    try {
      setIsResendingMissingEmails(true);
      sonnerToast.loading('Identificando usuários que precisam receber email...', { id: 'resend-emails' });

      // Buscar usuários ativos com subscription basic recente
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2); // Últimas 2 horas

      console.log('🔍 Buscando assinaturas desde:', twoHoursAgo.toISOString());

      const { data: recentSubs, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id, end_date')
        .eq('plan_type', 'basic')
        .eq('is_active', true)
        .gte('created_at', twoHoursAgo.toISOString());

      if (subsError) {
        console.error('❌ Erro ao buscar subscriptions:', subsError);
        throw subsError;
      }

      console.log('📊 Assinaturas recentes encontradas:', recentSubs?.length || 0);

      if (!recentSubs || recentSubs.length === 0) {
        sonnerToast.info('Nenhuma assinatura recente encontrada', { 
          id: 'resend-emails',
          duration: 5000,
          description: 'Não há assinaturas criadas nas últimas 2 horas.'
        });
        return;
      }

      sonnerToast.loading(`Buscando dados de ${recentSubs.length} usuários...`, { id: 'resend-emails' });

      const userIds = recentSubs.map(s => s.user_id);
      
      // Buscar dados completos dos usuários usando get_admin_user_details
      const { data: allUsers, error: usersError } = await supabase.rpc('get_admin_user_details');

      if (usersError) {
        console.error('❌ Erro ao buscar users:', usersError);
        throw usersError;
      }

      console.log('📊 Total de usuários retornados:', allUsers?.length || 0);

      // Filtrar apenas os usuários com assinaturas recentes
      const usersWithEmails = allUsers
        ?.filter((u: any) => userIds.includes(u.id))
        .map((u: any) => {
          const subscription = recentSubs.find(s => s.user_id === u.id);
          return {
            id: u.id,
            email: u.email || '',
            full_name: u.full_name || 'Usuário',
            endDate: subscription?.end_date || '',
          };
        })
        .filter((u: any) => u.email) || [];

      console.log('✅ Usuários com emails válidos:', usersWithEmails.length);

      if (usersWithEmails.length === 0) {
        sonnerToast.warning('Nenhum email para enviar', {
          id: 'resend-emails',
          duration: 5000,
          description: 'Não foi possível encontrar emails válidos para os usuários.'
        });
        return;
      }

      sonnerToast.loading(
        `Enviando emails para ${usersWithEmails.length} usuários (rate limit: 2/seg)...`,
        { id: 'resend-emails' }
      );

      let emailsSent = 0;
      let emailsFailed = 0;

      // Enviar emails sequencialmente com delay de 550ms (garantindo máximo de 2/segundo)
      for (let i = 0; i < usersWithEmails.length; i++) {
        const user = usersWithEmails[i];
        
        try {
          console.log(`📧 Enviando email para: ${user.email}`);
          const { error } = await supabase.functions.invoke('send-reactivation-email', {
            body: {
              email: user.email,
              fullName: user.full_name,
              planType: 'basic',
              endDate: user.endDate,
            }
          });
          
          if (error) {
            console.error(`❌ Erro ao enviar email para ${user.email}:`, error);
            emailsFailed++;
          } else {
            console.log(`✅ Email enviado para: ${user.email}`);
            emailsSent++;
          }
        } catch (error) {
          console.error(`❌ Exceção ao enviar email para ${user.email}:`, error);
          emailsFailed++;
        }

        // Delay de 550ms entre cada email para respeitar rate limit de 2/s
        if (i < usersWithEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 550));
        }

        // Atualizar progresso a cada 10 emails
        if ((i + 1) % 10 === 0) {
          sonnerToast.loading(
            `Enviando emails: ${i + 1}/${usersWithEmails.length}`,
            { id: 'resend-emails' }
          );
        }
      }

      sonnerToast.success(
        `✅ Emails enviados!`,
        {
          id: 'resend-emails',
          duration: 8000,
          description: `📧 Sucesso: ${emailsSent}, Falhas: ${emailsFailed}`
        }
      );
    } catch (error: any) {
      console.error('❌ Erro ao reenviar emails:', error);
      sonnerToast.error('Erro ao reenviar emails', { 
        id: 'resend-emails',
        duration: 5000,
        description: error?.message || 'Tente novamente ou verifique os logs do console.'
      });
    } finally {
      setIsResendingMissingEmails(false);
    }
  };

  const handleBulkDeactivate = async () => {
    console.log('🎯 handleBulkDeactivate chamado. Usuários selecionados:', selectedUsers);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ access_granted: false, subscription_status: 'inactive' })
        .in('id', selectedUsers);

      if (error) throw error;

      toast({ title: 'Sucesso', description: `${selectedUsers.length} usuários desativados` });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('❌ Erro ao desativar usuários:', error);
      toast({ title: 'Erro', description: 'Erro ao desativar usuários', variant: 'destructive' });
    }
  };

  const handleBulkSendEmail = async () => {
    const selectedUsersData = users.filter(u => selectedUsers.includes(u.id));
    
    if (!confirm(`Enviar emails de boas-vindas para ${selectedUsers.length} usuários?\n\nNovas senhas temporárias serão geradas.`)) {
      return;
    }

    setEmailProgress({
      total: selectedUsers.length,
      sent: 0,
      failed: 0,
      current: "",
      errors: []
    });
    setIsEmailComplete(false);
    setShowEmailProgress(true);

    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Obter sessão do admin para autenticação
    const { data: { session } } = await supabase.auth.getSession();

    for (const user of selectedUsersData) {
      try {
        setEmailProgress(prev => ({ ...prev, current: user.email }));
        
        const { error } = await supabase.functions.invoke('resend-individual-welcome-email', {
          body: { 
            userId: user.id,
            email: user.email,
            fullName: user.full_name || user.email.split('@')[0]
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (error) throw error;
        
        sent++;
        setEmailProgress(prev => ({ ...prev, sent }));
      } catch (error: any) {
        console.error(`Erro ao enviar email para ${user.email}:`, error);
        failed++;
        errors.push({ email: user.email, error: error.message });
        setEmailProgress(prev => ({ ...prev, failed, errors }));
      }
    }

    setIsEmailComplete(true);
    setSelectedUsers([]);
    toast({ 
      title: 'Emails enviados',
      description: `${sent} emails enviados com sucesso, ${failed} falharam`
    });
  };

  const handleBulkExtendSubscription = () => {
    setShowBulkSubscriptionModal(true);
  };

  const executeBulkSubscriptionUpdate = async (config: { planType: string; months: number }) => {
    try {
      const { planType, months } = config;
      
      for (const userId of selectedUsers) {
        const currentUser = users.find(u => u.id === userId);
        const currentSub = currentUser?.subscription;
        const startDate = currentSub?.end_date ? new Date(currentSub.end_date) : new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);

        // Upsert subscription
        const { error: subError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan_type: planType,
          duration_months: months,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          auto_renew: false
        }, { onConflict: 'user_id' });

        if (subError) throw subError;

        // Update limits based on plan
        const limits = planType === 'basic' ? {
          plan_type: 'basic',
          creative_images_daily_limit: 10,
          creative_images_monthly_limit: 300,
          profile_analysis_daily_limit: 5,
          carousels_monthly_limit: 3,
          videos_monthly_limit: 0
        } : {
          plan_type: 'pro',
          creative_images_daily_limit: 30,
          creative_images_monthly_limit: 900,
          profile_analysis_daily_limit: 10,
          carousels_monthly_limit: 10,
          videos_monthly_limit: 15
        };

        const { error: limitsError } = await supabase
          .from('usage_limits')
          .update(limits)
          .eq('user_id', userId);

        if (limitsError) throw limitsError;

        // Update profile subscription_status
        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', userId);

        // Log action
        await supabase.rpc('log_admin_action', {
          _target_user_id: userId,
          _action: 'bulk_extend_subscription',
          _details: { planType, months }
        });
      }

      toast({ 
        title: 'Sucesso',
        description: `${selectedUsers.length} assinaturas estendidas!`
      });
      setSelectedUsers([]);
      setShowBulkSubscriptionModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Erro bulk subscription:', error);
      toast({ 
        title: 'Erro',
        description: 'Erro ao estender assinaturas',
        variant: 'destructive'
      });
    }
  };

  const handleBulkDelete = async () => {
    const selectedUsersData = users.filter(u => selectedUsers.includes(u.id));
    
    // Verificar se há admins na seleção
    const hasAdmins = selectedUsersData.some(u => u.roles?.includes('admin'));
    if (hasAdmins) {
      toast({ 
        title: 'Erro',
        description: '❌ Não é possível deletar usuários com role Admin!',
        variant: 'destructive'
      });
      return;
    }

    // Confirmação dupla
    if (!confirm(`⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\nVocê está prestes a DELETAR PERMANENTEMENTE ${selectedUsers.length} usuários.\n\nTodos os dados serão perdidos:\n- Perfis\n- Conversas\n- Histórico de criações\n- Assinaturas\n- Tudo!\n\nDeseja continuar?`)) {
      return;
    }

    const confirmation = prompt(`Digite "DELETAR" em maiúsculas para confirmar:`);
    if (confirmation !== 'DELETAR') {
      toast({ title: 'Operação cancelada' });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('bulk-delete-users', {
        body: { userIds: selectedUsers }
      });

      if (error) throw error;

      const result = data as { success: string[], failed: Array<{ id: string, error: string }> };

      toast({ 
        title: 'Operação concluída',
        description: `${result.success.length} usuários deletados, ${result.failed.length} falharam`
      });

      setSelectedUsers([]);
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao deletar usuários:', error);
      toast({ 
        title: 'Erro',
        description: 'Erro ao deletar usuários',
        variant: 'destructive'
      });
    }
  };

  const handleExport = () => {
    const csvData = filteredUsers.map(u => ({
      Nome: u.full_name,
      Email: u.email,
      Acesso: u.access_granted ? 'Ativo' : 'Inativo',
      Plano: u.subscription?.plan_type || 'free',
      'Data Cadastro': new Date(u.created_at).toLocaleDateString('pt-BR')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calculateStats = () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: users.length,
      active: users.filter(u => u.access_granted).length,
      inactive: users.filter(u => !u.access_granted).length,
      byPlan: {
        free: users.filter(u => !u.subscription || u.subscription.plan_type === 'free').length,
        basic: users.filter(u => u.subscription?.plan_type === 'basic').length,
        pro: users.filter(u => u.subscription?.plan_type === 'pro').length
      },
      newThisMonth: users.filter(u => new Date(u.created_at) > oneMonthAgo).length,
      expiringThisWeek: users.filter(u => 
        u.subscription?.end_date && 
        new Date(u.subscription.end_date) <= oneWeekFromNow &&
        new Date(u.subscription.end_date) > now
      ).length
    };
  };

  const handleResendAllWelcomeEmails = async (customOffset = 0) => {
    try {
      // Buscar total atual de pedidos
      const { count: currentCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'paid')
        .not('user_id', 'is', null);

      const currentTotal = currentCount || 0;

      // Se passou offset customizado, mostrar aviso detalhado
      if (customOffset > 0) {
        const remaining = currentTotal - customOffset;
        
        if (!confirm(
          `⚠️ CONTINUANDO ENVIO\n\n` +
          `📊 Total de pedidos pagos AGORA: ${currentTotal}\n` +
          `✅ Você informou que ${customOffset} já foram enviados\n` +
          `📬 Faltam ${remaining} emails\n\n` +
          `⚠️ O sistema vai começar do email #${customOffset + 1}.\n` +
          `Isso está correto?`
        )) {
          return;
        }
      } else {
        if (!confirm('⚠️ ATENÇÃO: Isso irá reenviar emails de boas-vindas para TODOS OS USUÁRIOS, mesmo os que já receberam. Novas senhas temporárias serão geradas para todos. Deseja continuar?')) {
          return;
        }
      }

      // Resetar e abrir modal de progresso
      setEmailProgress({
        total: 0,
        sent: 0,
        failed: 0,
        current: "",
        errors: [],
      });
      setIsEmailComplete(false);
      setIsResendingAllEmails(true);
      setShowEmailProgress(true);

      console.log('🚀 Iniciando reenvio TOTAL de emails em batches...');
      
      const totalToSend = currentTotal;
      
      setEmailProgress(prev => ({
        ...prev,
        total: totalToSend
      }));

      console.log(`📊 Total de emails a enviar: ${totalToSend}`);
      if (customOffset > 0) {
        console.log(`🔄 RESUMINDO DO EMAIL #${customOffset + 1}`);
        console.log(`📬 Faltam ${totalToSend - customOffset} emails para enviar`);
      }

      // Processar em batches de 50 emails
      const BATCH_SIZE = 50;
      let offset = customOffset;
      let totalSent = 0;
      let totalFailed = 0;
      const allErrors: Array<{ email: string; error: string }> = [];

      while (offset < totalToSend) {
        const batchNumber = Math.floor((offset - customOffset) / BATCH_SIZE) + 1;
        const remainingEmails = totalToSend - customOffset;
        const totalBatches = Math.ceil(remainingEmails / BATCH_SIZE);
        
        console.log(`📦 Processando batch ${batchNumber}/${totalBatches} (offset: ${offset}, já enviados: ${customOffset})`);
        
        setEmailProgress(prev => ({
          ...prev,
          current: `Processando lote ${batchNumber} de ${totalBatches}...`,
        }));

        try {
          const { data, error } = await supabase.functions.invoke('resend-all-welcome-emails', {
            body: { 
              batchSize: BATCH_SIZE, 
              offset 
            },
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });

          if (error) throw error;

          // Atualizar progresso acumulado
          totalSent += data.results.success;
          totalFailed += data.results.failed;
          
          if (data.results.errors) {
            allErrors.push(...data.results.errors);
          }

          setEmailProgress(prev => ({
            ...prev,
            sent: totalSent,
            failed: totalFailed,
            errors: allErrors,
            current: `Lote ${batchNumber}/${totalBatches} concluído. ${totalSent} enviados, ${totalFailed} falhas.`
          }));

          console.log(`✅ Batch ${batchNumber} concluído: ${data.results.success} enviados, ${data.results.failed} falhas`);

          // Se não processou o batch completo, não há mais emails
          if (!data.batchInfo.hasMore) {
            console.log('✅ Todos os emails foram processados');
            break;
          }

          offset += BATCH_SIZE;

          // Pequeno delay entre batches para não sobrecarregar
          if (offset < totalToSend) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (batchError: any) {
          console.error(`❌ Erro no batch ${batchNumber}:`, batchError);
          allErrors.push({
            email: `Batch ${batchNumber}`,
            error: batchError.message
          });
          
          // Decidir se continua ou para
          const shouldContinue = confirm(`Erro no lote ${batchNumber}: ${batchError.message}\n\nDeseja continuar com os próximos lotes?`);
          if (!shouldContinue) {
            throw new Error(`Processo interrompido no lote ${batchNumber}`);
          }
          
          offset += BATCH_SIZE;
        }
      }

      // Finalizar
      setEmailProgress(prev => ({
        ...prev,
        current: "Processo concluído!",
        sent: totalSent,
        failed: totalFailed,
        errors: allErrors
      }));
      setIsEmailComplete(true);

      if (totalFailed > 0) {
        sonnerToast.warning("Envio Concluído com Avisos", {
          description: `${totalSent} emails enviados, ${totalFailed} falharam`,
          duration: 5000
        });
      } else {
        sonnerToast.success("Todos os Emails Enviados!", {
          description: `${totalSent} emails enviados com sucesso para todos os usuários`,
          duration: 5000
        });
      }

      await fetchUsers();

    } catch (error: any) {
      console.error('❌ Erro ao reenviar emails:', error);
      setEmailProgress(prev => ({
        ...prev,
        current: `Erro: ${error.message}`,
        errors: [...prev.errors, { email: 'Sistema', error: error.message }]
      }));
      setIsEmailComplete(true);
      sonnerToast.error("Erro no Processo", {
        description: error.message || "Erro ao reenviar emails",
        duration: 5000
      });
    } finally {
      setIsResendingAllEmails(false);
    }
  };

  const handleResendIndividualEmail = async (user: User) => {
    if (!confirm(`Reenviar email de boas-vindas para ${user.full_name || user.email}?\n\nUma nova senha temporária será gerada e enviada.`)) {
      return;
    }

    const loadingToast = sonnerToast.loading("Enviando email...", {
      description: `Gerando credenciais para ${user.email}`
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke('resend-individual-welcome-email', {
        body: { 
          userId: user.id,
          email: user.email,
          fullName: user.full_name || user.email.split('@')[0]
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      sonnerToast.success("Email Enviado!", {
        description: `Credenciais enviadas para ${user.email}`,
        duration: 4000,
        id: loadingToast
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Erro ao reenviar email individual:', error);
      sonnerToast.error("Erro ao Enviar Email", {
        description: error.message || "Não foi possível enviar o email",
        duration: 5000,
        id: loadingToast
      });
    }
  };

  const handleResendWelcomeEmails = async () => {
    if (!confirm('⚠️ Isso irá reenviar emails de boas-vindas para os usuários que ainda não receberam. Novas senhas temporárias serão geradas. Deseja continuar?')) {
      return;
    }

    try {
      // Resetar e abrir modal de progresso
      setEmailProgress({
        total: 0,
        sent: 0,
        failed: 0,
        current: "",
        errors: [],
      });
      setIsEmailComplete(false);
      setIsResendingEmails(true);
      setShowEmailProgress(true);

      console.log('🚀 Iniciando envio de emails...');

      // Primeiro, buscar quantos emails precisam ser enviados
      const { data: pendingOrders, error: countError } = await supabase
        .from('orders')
        .select('customer_email, customer_name')
        .eq('order_status', 'paid')
        .or('credentials_sent.eq.false,credentials_sent.is.null')
        .not('user_id', 'is', null);

      if (countError) {
        throw countError;
      }

      const totalToSend = pendingOrders?.length || 0;
      
      setEmailProgress(prev => ({
        ...prev,
        total: totalToSend
      }));

      if (totalToSend === 0) {
        setIsEmailComplete(true);
        setIsResendingEmails(false);
        sonnerToast.info("Nenhum Email Pendente", {
          description: "Todos os usuários já receberam seus emails de acesso.",
          duration: 4000
        });
        return;
      }

      // Simular progresso para melhor UX
      const simulateProgress = setInterval(() => {
        setEmailProgress(prev => {
          if (prev.sent + prev.failed >= prev.total) {
            clearInterval(simulateProgress);
            return prev;
          }
          const nextIndex = prev.sent + prev.failed;
          return {
            ...prev,
            current: pendingOrders[nextIndex]?.customer_email || "",
          };
        });
      }, 300);

      // Chamar a função de envio
      const { data, error } = await supabase.functions.invoke('resend-welcome-emails', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      clearInterval(simulateProgress);

      if (error) throw error;

      const results = data.results;
      
      // Atualizar progresso final
      setEmailProgress({
        total: results.total,
        sent: results.success,
        failed: results.failed,
        current: "",
        errors: results.errors || [],
      });

      setIsEmailComplete(true);

      // Toast de resumo
      if (results.failed === 0) {
        sonnerToast.success("Envio Concluído!", {
          description: `Todos os ${results.success} emails foram enviados com sucesso.`,
          duration: 5000
        });
      } else {
        sonnerToast.warning("Envio Concluído com Avisos", {
          description: `${results.success} enviados, ${results.failed} falharam.`,
          duration: 5000
        });
      }

      // Recarregar dados
      fetchUsers();

    } catch (error: any) {
      console.error('❌ Erro ao reenviar emails:', error);
      setIsEmailComplete(true);
      
      sonnerToast.error("Erro ao Enviar Emails", {
        description: error.message || "Ocorreu um erro. Tente novamente.",
        duration: 5000
      });
    } finally {
      setIsResendingEmails(false);
    }
  };

  const handleRolesModalClose = () => {
    setShowRolesModal(false);
    setSelectedUserId(null);
    setSelectedUserName('');
    // Refresh users to show updated roles
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'moderator':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'user':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderador';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filters.planType === 'all' || 
      (user.subscription?.plan_type === filters.planType || 
       (!user.subscription && filters.planType === 'free'));

    const matchesAccess = filters.accessStatus === 'all' ||
      (filters.accessStatus === 'active' && user.access_granted) ||
      (filters.accessStatus === 'inactive' && !user.access_granted);

    const matchesRole = filters.role === 'all' ||
      user.roles?.includes(filters.role);

    const matchesSubscription = filters.subscriptionStatus === 'all' ||
      (filters.subscriptionStatus === 'active' && user.subscription?.is_active) ||
      (filters.subscriptionStatus === 'expired' && !user.subscription?.is_active);

    return matchesSearch && matchesPlan && matchesAccess && matchesRole && matchesSubscription;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Controle completo de usuários e assinaturas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowEmailTestModal(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Testar Email
          </Button>
          <Button 
            variant="outline"
            onClick={handleResendWelcomeEmails}
            disabled={isResendingEmails}
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResendingEmails ? 'Enviando...' : 'Reenviar Pendentes'}
          </Button>
          <Button
            onClick={() => handleResendAllWelcomeEmails(0)}
            disabled={isResendingAllEmails}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResendingAllEmails ? 'Reenviando...' : 'Reenviar para TODOS'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleFixMissingUsageLimits}
            disabled={isFixingLimits}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isFixingLimits ? 'Criando...' : 'Criar Usage Limits'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleResendMissingEmails}
            disabled={isResendingMissingEmails}
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResendingMissingEmails ? 'Enviando...' : 'Reenviar Emails Faltantes'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buscar e Filtrar</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Plano</label>
                <Select value={filters.planType} onValueChange={(v) => setFilters({...filters, planType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Acesso</label>
                <Select value={filters.accessStatus} onValueChange={(v) => setFilters({...filters, accessStatus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={filters.role} onValueChange={(v) => setFilters({...filters, role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Assinatura</label>
                <Select value={filters.subscriptionStatus} onValueChange={(v) => setFilters({...filters, subscriptionStatus: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
              <CardDescription>
                {selectedUsers.length > 0 && `${selectedUsers.length} selecionados`}
              </CardDescription>
            </div>
            <Checkbox
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleSelectUser(user.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {user.full_name || 'Nome não informado'}
                    </h3>
                    <Badge
                      variant={user.access_granted ? "default" : "secondary"}
                    >
                      {user.access_granted ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {user.subscription && (
                      <Badge variant="outline" className="capitalize">
                        {user.subscription.plan_type}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    {user.order && user.order.order_value > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                        💰 {user.order.order_value_formatted}
                      </Badge>
                    )}
                  </div>

                  {user.roles && user.roles.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            className={getRoleBadgeColor(role)}
                            variant="secondary"
                          >
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.usage_limits && (
                    <div className="mt-2 space-y-1">
                      <UsageBar
                        label="Imagens"
                        current={user.usage_limits.creative_images_monthly_used}
                        limit={user.usage_limits.creative_images_monthly_limit}
                      />
                      {user.usage_limits.videos_monthly_limit > 0 && (
                        <UsageBar
                          label="Vídeos"
                          current={user.usage_limits.videos_monthly_used}
                          limit={user.usage_limits.videos_monthly_limit}
                        />
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditLimits(user.id, user.full_name)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Editar Limites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManageRoles(user.id, user.full_name)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Gerenciar Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExtendSubscription(user.id, user.full_name)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Gerenciar Plano
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResendIndividualEmail(user)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Reenviar Credenciais
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleUserAccess(user.id, user.access_granted)}
                      className={user.access_granted ? "text-destructive" : "text-green-600"}
                    >
                      {user.access_granted ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar Acesso
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Ativar Acesso
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onClearSelection={() => setSelectedUsers([])}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onSendEmail={handleBulkSendEmail}
        onExtendSubscription={handleBulkExtendSubscription}
        onDelete={handleBulkDelete}
      />

      {/* Modals */}
      <UsageLimitsProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        {...progressData}
      />

      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onUserAdded={handleUserAdded}
      />

      <EmailTestModal
        open={showEmailTestModal}
        onOpenChange={setShowEmailTestModal}
      />

      {selectedUserId && showRolesModal && (
        <UserRolesManager
          userId={selectedUserId}
          userName={selectedUserName}
          open={showRolesModal}
          onOpenChange={(open) => {
            setShowRolesModal(open);
            if (!open) fetchUsers();
          }}
        />
      )}

      {selectedUserForLimits && showLimitsEditor && (
        <UserLimitsEditor
          userId={selectedUserForLimits.id}
          userName={selectedUserForLimits.name}
          isOpen={showLimitsEditor}
          onClose={() => {
            setShowLimitsEditor(false);
            setSelectedUserForLimits(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      {selectedUserId && showDetailsModal && (
        <UserDetailsModal
          userId={selectedUserId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUserId(null);
          }}
        />
      )}

      {selectedUserId && showSubscriptionManager && (
        <SubscriptionManager
          userId={selectedUserId}
          userName={selectedUserName}
          currentEndDate={users.find(u => u.id === selectedUserId)?.subscription?.end_date}
          isOpen={showSubscriptionManager}
          onClose={() => {
            setShowSubscriptionManager(false);
            setSelectedUserId(null);
          }}
          onSuccess={fetchUsers}
        />
      )}

      <EmailProgressModal
        open={showEmailProgress}
        onOpenChange={setShowEmailProgress}
        progress={emailProgress}
        isComplete={isEmailComplete}
        isLoading={isResendingEmails || isResendingAllEmails}
      />

      <BulkSubscriptionModal
        open={showBulkSubscriptionModal}
        onClose={() => setShowBulkSubscriptionModal(false)}
        onConfirm={executeBulkSubscriptionUpdate}
        selectedCount={selectedUsers.length}
      />
    </div>
  );
};

export default AdminUsers;
