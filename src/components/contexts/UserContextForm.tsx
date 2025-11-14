import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UserContextFormProps {
  onSubmit: (data: {
    context_type: 'product';
    name: string;
    description: string;
    detailed_context: string;
    icon?: string;
    pdf_content?: string;
    pdf_filename?: string;
    user_role?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    name?: string;
    description?: string;
    detailed_context?: string;
    icon?: string;
    pdf_content?: string;
    pdf_filename?: string;
    user_role?: string;
  };
}

const PRODUCT_ICON = '🎯';

export function UserContextForm({ onSubmit, onCancel, initialData }: UserContextFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [userRole, setUserRole] = useState(initialData?.user_role || '');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfContent, setPdfContent] = useState(initialData?.pdf_content || '');
  const [pdfFilename, setPdfFilename] = useState(initialData?.pdf_filename || '');
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setUploadingPdf(true);
    setPdfFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-pdf', {
        body: formData,
      });

      if (error) throw error;

      setPdfContent(data.content);
      setPdfFilename(file.name);
      toast.success('PDF processado com sucesso!');
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      toast.error('Erro ao processar PDF');
      setPdfFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfContent('');
    setPdfFilename('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        context_type: 'product',
        name: name.trim(),
        description: description.trim(),
        detailed_context: description.trim(),
        icon: icon.trim() || undefined,
        pdf_content: pdfContent || undefined,
        pdf_filename: pdfFilename || undefined,
        user_role: userRole.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto *</Label>
        <Input
          id="name"
          placeholder="Ex: Curso de SEO Avançado, E-book de Tráfego Pago"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição do Produto *</Label>
        <Textarea
          id="description"
          placeholder="Descreva seu produto, público-alvo e principais benefícios. Exemplo: 'Curso online com 40 aulas sobre SEO técnico e content marketing, voltado para empreendedores digitais iniciantes que querem aumentar o tráfego orgânico.'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          maxLength={1000}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userRole">Quem você é</Label>
        <Textarea
          id="userRole"
          placeholder="Descreva quem você é, sua experiência e contexto. Ex: 'Sou empreendedor digital há 5 anos, trabalho com infoprodutos na área de saúde e bem-estar...'"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          A IA usará essas informações para personalizar as respostas baseadas no seu contexto
        </p>
      </div>

      <div className="space-y-2">
        <Label>Documento PDF (opcional)</Label>
        <div className="space-y-2">
          {!pdfFilename && !pdfFile ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
                disabled={uploadingPdf}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadingPdf ? 'Processando PDF...' : 'Clique para fazer upload de um PDF'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/50">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pdfFilename}</p>
                <p className="text-xs text-muted-foreground">
                  {uploadingPdf ? 'Processando...' : 'PDF carregado com sucesso'}
                </p>
              </div>
              {!uploadingPdf && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removePdf}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          A IA usará o conteúdo do PDF como contexto adicional nas conversas
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Ícone (opcional)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="icon"
            placeholder={PRODUCT_ICON}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
            className="w-20 text-center text-2xl"
          />
          <span className="text-sm text-muted-foreground">
            Deixe vazio para usar o padrão: {PRODUCT_ICON}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || uploadingPdf || !name.trim() || !description.trim()}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </Button>
      </div>
    </form>
  );
}
