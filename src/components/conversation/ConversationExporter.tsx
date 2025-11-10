import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, File } from 'lucide-react';
import { Conversation } from '@/types/lumi';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface ConversationExporterProps {
  conversation: Conversation;
  children?: React.ReactNode;
}

export function ConversationExporter({ conversation, children }: ConversationExporterProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'txt'>('pdf');
  const [includeAssistant, setIncludeAssistant] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Título
    doc.setFontSize(16);
    doc.text('Conversa com LUMI', margin, yPosition);
    yPosition += lineHeight * 2;

    // Data da conversa
    doc.setFontSize(10);
    doc.text(`Criada em: ${formatDate(conversation.createdAt)}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Atualizada em: ${formatDate(conversation.updatedAt)}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Mensagens
    doc.setFontSize(12);
    conversation.messages.forEach((message) => {
      if (!includeAssistant && message.role === 'assistant') return;

      // Verificar se precisa de nova página
      if (yPosition > doc.internal.pageSize.height - margin * 2) {
        doc.addPage();
        yPosition = margin;
      }

      // Cabeçalho da mensagem
      const sender = message.role === 'user' ? 'Você' : 'LUMI';
      doc.setFont(undefined, 'bold');
      doc.text(`${sender} (${formatDate(message.timestamp)}):`, margin, yPosition);
      yPosition += lineHeight;

      // Conteúdo da mensagem
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(message.content, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.height - margin * 2) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;
    });

    doc.save(`conversa-lumi-${conversation.id}.pdf`);
  };

  const exportToTXT = () => {
    let content = `Conversa com LUMI\n`;
    content += `Título: ${conversation.title}\n`;
    content += `Criada em: ${formatDate(conversation.createdAt)}\n`;
    content += `Atualizada em: ${formatDate(conversation.updatedAt)}\n\n`;
    content += `${'='.repeat(50)}\n\n`;

    conversation.messages.forEach((message) => {
      if (!includeAssistant && message.role === 'assistant') return;

      const sender = message.role === 'user' ? 'Você' : 'LUMI';
      content += `${sender} (${formatDate(message.timestamp)}):\n`;
      content += `${message.content}\n\n`;
      content += `${'-'.repeat(30)}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversa-lumi-${conversation.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    try {
      if (exportFormat === 'pdf') {
        exportToPDF();
      } else {
        exportToTXT();
      }
      toast.success('Conversa exportada com sucesso!');
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao exportar conversa:', error);
      toast.error('Erro ao exportar conversa');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as 'pdf' | 'txt')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="flex items-center">
                  <File className="h-4 w-4 mr-2" />
                  TXT
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-assistant"
              checked={includeAssistant}
              onCheckedChange={(checked) => setIncludeAssistant(checked === true)}
            />
            <Label htmlFor="include-assistant" className="text-sm">
              Incluir respostas da LUMI
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
