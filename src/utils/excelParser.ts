import * as XLSX from 'xlsx';

export interface ImportedUser {
  saleId: string;
  status: 'paid' | 'refused' | 'waiting' | 'refunded';
  product: string;
  name: string;
  email: string;
  offer: string;
  value: number;
  installments: number;
  date: Date;
}

export interface ParsedData {
  users: ImportedUser[];
  duplicates: string[];
  invalidEmails: string[];
  stats: {
    total: number;
    paid: number;
    refused: number;
    waiting: number;
    refunded: number;
  };
}

export const parseExcelFile = async (file: File): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const users: ImportedUser[] = [];
        const emailSet = new Set<string>();
        const duplicates: string[] = [];
        const invalidEmails: string[] = [];

        const stats = {
          total: 0,
          paid: 0,
          refused: 0,
          waiting: 0,
          refunded: 0,
        };

        jsonData.forEach((row: any) => {
          stats.total++;

          const email = row['E-mail do cliente']?.toString().toLowerCase().trim() || '';
          const name = row['Nome do cliente']?.toString().trim() || '';
          const status = row['Status']?.toString().toLowerCase() || '';
          
          // Validar email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            invalidEmails.push(email || name || 'Email inválido');
            return;
          }

          // Verificar duplicatas
          if (emailSet.has(email)) {
            duplicates.push(email);
            return;
          }
          emailSet.add(email);

          // Contar status
          if (status === 'paid') stats.paid++;
          else if (status === 'refused') stats.refused++;
          else if (status === 'waiting') stats.waiting++;
          else if (status === 'refunded') stats.refunded++;

          const valueStr = row['Valor']?.toString().replace('R$', '').replace('.', '').replace(',', '.').trim() || '0';
          
          users.push({
            saleId: row['ID da venda']?.toString() || '',
            status: status as any,
            product: row['Produto']?.toString() || '',
            name: name,
            email: email,
            offer: row['Oferta']?.toString() || '',
            value: parseFloat(valueStr) || 0,
            installments: parseInt(row['Parcelas']?.toString() || '1'),
            date: row['Data de criação'] ? new Date(row['Data de criação']) : new Date(),
          });
        });

        resolve({
          users,
          duplicates,
          invalidEmails,
          stats,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
};

export const mapOfferToPlan = (offer: string, value: number): { planType: 'basic'; durationMonths: 1 | 3 | 6 } => {
  const offerLower = offer.toLowerCase();
  
  // Vitalício ou valores baixos = 6 meses
  if (offerLower.includes('vitalício') || offerLower.includes('vitalicio') || value < 200) {
    return { planType: 'basic', durationMonths: 6 };
  }
  
  // BLACK FRIDAY ou valores altos = 3 meses
  if (offerLower.includes('black') || value >= 500) {
    return { planType: 'basic', durationMonths: 3 };
  }
  
  // Padrão: 3 meses
  return { planType: 'basic', durationMonths: 3 };
};

export const downloadCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
