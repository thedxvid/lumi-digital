import { AuthError } from '@supabase/supabase-js';

export const useAuthErrors = () => {
  const translateError = (error: AuthError | Error | null): string => {
    if (!error) return 'Ocorreu um erro desconhecido';
    
    const message = error.message.toLowerCase();
    
    // Erros de credenciais
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return 'Email ou senha incorretos. Verifique e tente novamente.';
    }
    
    // Erros de email não confirmado
    if (message.includes('email not confirmed')) {
      return 'Sua conta ainda não foi ativada. Entre em contato com o suporte.';
    }
    
    // Erros de usuário não encontrado
    if (message.includes('user not found')) {
      return 'Nenhuma conta encontrada com este email.';
    }
    
    // Erros de usuário já registrado
    if (message.includes('user already registered') || message.includes('already registered')) {
      return 'Este email já está cadastrado. Faça login ou recupere sua senha.';
    }
    
    // Erros de rate limiting
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }
    
    // Erros de rede
    if (message.includes('fetch') || message.includes('network')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    // Erros de senha
    if (message.includes('password')) {
      if (message.includes('weak') || message.includes('short')) {
        return 'Senha muito fraca. Use no mínimo 8 caracteres, incluindo letras e números.';
      }
      if (message.includes('incorrect')) {
        return 'Senha incorreta. Tente novamente ou clique em "Esqueceu a senha?".';
      }
    }
    
    // Erros de formato de email
    if (message.includes('invalid email') || message.includes('email format')) {
      return 'Formato de email inválido. Verifique e tente novamente.';
    }
    
    // Erro genérico
    return error.message || 'Ocorreu um erro inesperado. Tente novamente.';
  };
  
  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email é obrigatório' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Formato de email inválido' };
    }
    
    return { isValid: true };
  };
  
  const validatePassword = (password: string): { 
    isValid: boolean; 
    error?: string;
    strength: 'weak' | 'medium' | 'strong';
  } => {
    if (!password || password.trim() === '') {
      return { isValid: false, error: 'Senha é obrigatória', strength: 'weak' };
    }
    
    if (password.length < 6) {
      return { 
        isValid: false, 
        error: 'Senha deve ter no mínimo 6 caracteres',
        strength: 'weak'
      };
    }
    
    // Calcular força da senha
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    if (isLongEnough && hasNumber && (hasUpperCase || hasLowerCase)) {
      strength = 'medium';
    }
    
    if (isLongEnough && hasNumber && hasUpperCase && hasLowerCase && hasSpecial) {
      strength = 'strong';
    }
    
    return { isValid: true, strength };
  };
  
  return {
    translateError,
    validateEmail,
    validatePassword
  };
};
