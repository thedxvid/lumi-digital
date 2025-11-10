
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesModule } from '@/types/sales';
import { Loader2 } from 'lucide-react';

interface SalesModuleFormProps {
  module: SalesModule;
  onSubmit: (data: any) => void;
  loading: boolean;
}

export function SalesModuleForm({ module, onSubmit, loading }: SalesModuleFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {module.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type === 'text' && (
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              required={field.required}
            />
          )}
          
          {field.type === 'textarea' && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
          )}
          
          {field.type === 'number' && (
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, Number(e.target.value))}
              required={field.required}
            />
          )}
          
          {field.type === 'select' && (
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => updateField(field.name, value)}
              required={field.required}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '_')}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      
      <Button
        type="submit"
        className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90 text-white`}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analisando com LUMI...
          </>
        ) : (
          `Gerar com LUMI ✨`
        )}
      </Button>
    </form>
  );
}
