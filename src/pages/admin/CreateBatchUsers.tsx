import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateBatchUsers() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const createUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-multiple-users', {
        body: {
          users: [
            { email: "garruchoclara15@gmail.com", fullName: "Clara Garrucho" },
            { email: "mauricio.rocha58@hotmail.com", fullName: "Maurício Rocha" },
            { email: "Kellycristina-55@hotmail.com", fullName: "Kelly Cristina" }
          ],
          planType: "basic",
          durationMonths: 3
        }
      });

      if (error) throw error;

      setResults(data);
      toast.success(`${data.summary.success} usuários criados com sucesso!`);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || "Erro ao criar usuários");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Criar Usuários em Lote</h1>
        
        <div className="space-y-4">
          <p>Clique no botão abaixo para criar os seguintes usuários:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>garruchoclara15@gmail.com - Clara Garrucho</li>
            <li>mauricio.rocha58@hotmail.com - Maurício Rocha</li>
            <li>Kellycristina-55@hotmail.com - Kelly Cristina</li>
          </ul>

          <Button onClick={createUsers} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Criando..." : "Criar Usuários e Enviar Emails"}
          </Button>

          {results && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h2 className="font-semibold mb-2">Resultados:</h2>
              <p className="mb-2">
                ✅ Criados: {results.summary.success} | ❌ Falhas: {results.summary.failed}
              </p>
              
              <div className="space-y-2 mt-4">
                {results.results.map((result: any, idx: number) => (
                  <div key={idx} className="p-2 bg-background rounded">
                    <p className="font-medium">{result.email}</p>
                    {result.success ? (
                      <div className="text-sm text-green-600">
                        <p>✅ Usuário criado</p>
                        <p>🔑 Senha: {result.password}</p>
                        <p>📧 Email {result.emailSent ? 'enviado' : 'não enviado'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">❌ {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
