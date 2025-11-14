import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getNextDailyReset = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return formatDistanceToNow(tomorrow, { locale: ptBR, addSuffix: true });
};

export const getNextMonthlyReset = () => {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return formatDistanceToNow(nextMonth, { locale: ptBR, addSuffix: true });
};

export const formatResetDate = (resetDate: string) => {
  return format(new Date(resetDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
};
