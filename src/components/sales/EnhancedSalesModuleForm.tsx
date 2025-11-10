
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { SalesModule, InfoproductType } from '@/types/sales';

interface EnhancedSalesModuleFormProps {
  module: SalesModule;
  onSubmit: (data: any) => void;
  loading?: boolean;
  selectedInfoproductType?: InfoproductType | null;
  initialData?: any;
}

export function EnhancedSalesModuleForm({ 
  module, 
  onSubmit, 
  loading = false, 
  selectedInfoproductType,
  initialData = {}
}: EnhancedSalesModuleFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  // Atualizar formData quando initialData mudar
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleInputChange(field.name, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, Number(e.target.value))}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{field.validation?.min || 1}</span>
              <span className="font-medium">Nível: {value || field.validation?.min || 1}</span>
              <span>{field.validation?.max || 10}</span>
            </div>
            <Slider
              value={[value || field.validation?.min || 1]}
              onValueChange={(newValue) => handleInputChange(field.name, newValue[0])}
              min={field.validation?.min || 1}
              max={field.validation?.max || 10}
              step={field.step || 1}
              className="w-full"
            />
          </div>
        );

      default:
        return (
          <Input
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-2xl text-white shadow-lg`}>
            {module.icon}
          </div>
          <div>
            <CardTitle className="text-xl">{module.title}</CardTitle>
            <p className="text-muted-foreground">
              {selectedInfoproductType ? selectedInfoproductType.title : module.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {module.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              
              {renderField(field)}
            </div>
          ))}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando resultado...
              </>
            ) : (
              'Gerar Resultado'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
