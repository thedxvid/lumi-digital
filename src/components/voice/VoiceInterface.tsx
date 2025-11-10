
import { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VoiceTranscript } from './VoiceTranscript';
import { useLumiStore } from '@/hooks/useLumiStore';
import { Message } from '@/types/lumi';

export function VoiceInterface() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Transcription states
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationTranscripts, setConversationTranscripts] = useState<Array<{
    id: string;
    content: string;
    timestamp: number;
    speaker: 'user' | 'assistant';
  }>>([]);
  const [transcriptBuffer, setTranscriptBuffer] = useState('');

  const { addConversation, generateUUID } = useLumiStore();

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Conectado ao agente LUMI com sucesso');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      toast.success('Conectado com a LUMI!');
    },
    onDisconnect: () => {
      console.log('🔌 Desconectado do agente LUMI');
      setIsConnected(false);
      setIsConnecting(false);
      
      // Clear current transcript but keep history
      setCurrentTranscript('');
      setTranscriptBuffer('');
      
      toast.info('Conversa encerrada');
    },
    onMessage: (message) => {
      console.log('📩 Mensagem recebida da LUMI:', message);
      
      // Handle transcription messages
      if (message && typeof message === 'object') {
        const msgObj = message as any;
        
        // Handle different types of transcription events
        if (msgObj.type === 'agent_response' || msgObj.type === 'transcript') {
          const text = msgObj.text || msgObj.content || msgObj.message;
          if (text && typeof text === 'string') {
            console.log('🎤 Transcrição capturada:', text);
            
            // Update current transcript for real-time display
            setCurrentTranscript(text);
            
            // Add to conversation history
            const transcriptEntry = {
              id: generateUUID(),
              content: text,
              timestamp: Date.now(),
              speaker: 'assistant' as const
            };
            
            setConversationTranscripts(prev => [...prev, transcriptEntry]);
          }
        }
        
        // Handle partial transcripts (streaming)
        if (msgObj.type === 'partial_transcript' || msgObj.type === 'streaming') {
          const text = msgObj.text || msgObj.content;
          if (text && typeof text === 'string') {
            setTranscriptBuffer(prev => prev + text);
            setCurrentTranscript(prev => prev + text);
          }
        }
        
        // Handle final transcript completion
        if (msgObj.type === 'transcript_complete' || msgObj.type === 'final') {
          if (transcriptBuffer) {
            const finalTranscript = {
              id: generateUUID(),
              content: transcriptBuffer,
              timestamp: Date.now(),
              speaker: 'assistant' as const
            };
            
            setConversationTranscripts(prev => [...prev, finalTranscript]);
            setTranscriptBuffer('');
          }
        }
      }
    },
    onError: (error) => {
      console.error('❌ Erro na conversa com LUMI:', error);
      setIsConnected(false);
      setIsConnecting(false);
      
      let errorMessage = 'Erro desconhecido na conexão';
      
      if (error != null) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object') {
          const errorObj = error as Record<string, unknown>;
          if ('message' in errorObj && typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          } else {
            errorMessage = String(error);
          }
        } else {
          errorMessage = String(error);
        }
      }
      
      setError(errorMessage);
      toast.error(`Erro na conversa: ${errorMessage}`);
    }
  });

  // Verificar permissão do microfone
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        console.log('🎤 Verificando permissão do microfone...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        console.log('✅ Permissão do microfone concedida');
      } catch (error) {
        console.error('❌ Permissão do microfone negada:', error);
        setHasPermission(false);
        setError('Permissão do microfone é necessária para conversar com a LUMI');
      }
    };

    checkMicrophonePermission();
  }, []);

  const handleStartConversation = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando conversa com LUMI...');
      
      // Verificar permissão do microfone novamente se necessário
      if (!hasPermission) {
        console.log('🎤 Solicitando permissão do microfone...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        console.log('✅ Permissão do microfone obtida');
      }

      console.log('🔗 Obtendo URL assinada da sessão ElevenLabs...');
      
      // Chamar nossa Edge Function para obter a URL assinada
      const { data, error } = await supabase.functions.invoke('elevenlabs-session');

      console.log('📝 Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('❌ Erro ao chamar Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Edge Function retornou erro:', data?.error || 'Resposta inválida');
        throw new Error(data?.error || 'Erro desconhecido na Edge Function');
      }

      const { signed_url } = data;
      
      if (!signed_url) {
        throw new Error('URL assinada não foi retornada');
      }

      console.log('✅ URL assinada obtida com sucesso');
      
      // Tentar iniciar a sessão com URL assinada
      await conversation.startSession({
        signedUrl: signed_url
      });
      
      console.log('✅ Sessão iniciada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro detalhado ao iniciar conversa:', error);
      setIsConnecting(false);
      
      let errorMessage = 'Erro ao conectar com a LUMI';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      toast.error(`Falha ao iniciar conversa: ${errorMessage}`);
      
      // Se for erro de permissão, tentar novamente
      if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('permissão')) {
        setHasPermission(false);
      }
    }
  };

  const handleEndConversation = async () => {
    try {
      console.log('🛑 Encerrando conversa...');
      await conversation.endSession();
    } catch (error) {
      console.error('❌ Erro ao encerrar conversa:', error);
      toast.error('Erro ao encerrar conversa');
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    try {
      await conversation.setVolume({ volume: newVolume });
      console.log('🔊 Volume ajustado para:', Math.round(newVolume * 100) + '%');
    } catch (error) {
      console.error('❌ Erro ao ajustar volume:', error);
    }
  };

  const handleSaveConversation = async () => {
    if (conversationTranscripts.length === 0) {
      toast.error('Nenhuma transcrição para salvar');
      return;
    }

    try {
      // Create messages from transcripts
      const messages: Message[] = conversationTranscripts.map(transcript => ({
        id: transcript.id,
        role: transcript.speaker,
        content: transcript.content,
        timestamp: transcript.timestamp,
        isVoiceMessage: true,
        transcript: transcript.content,
        voiceTimestamp: transcript.timestamp
      }));

      // Create conversation
      const conversation = {
        id: generateUUID(),
        title: `Conversa de Voz - ${new Date().toLocaleString()}`,
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addConversation(conversation);
      toast.success('Conversa de voz salva no histórico!');
      
      // Clear current transcripts after saving
      setConversationTranscripts([]);
      setCurrentTranscript('');
    } catch (error) {
      console.error('Erro ao salvar conversa de voz:', error);
      toast.error('Erro ao salvar conversa');
    }
  };

  const handleClearTranscripts = () => {
    setConversationTranscripts([]);
    setCurrentTranscript('');
    setTranscriptBuffer('');
    toast.info('Transcrições limpas');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-lumi-gold to-lumi-gold-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Mic className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Converse com a LUMI</h1>
        <p className="text-muted-foreground">
          Sua assistente de IA especializada em marketing digital e vendas
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              conversation.status === 'connected' ? 'bg-green-500' : 
              isConnecting ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`} />
            <span className="font-medium">
              Status: {
                conversation.status === 'connected' ? 'Conectada' : 
                isConnecting ? 'Conectando...' : 
                'Desconectada'
              }
            </span>
          </div>
          {conversation.isSpeaking && (
            <div className="flex items-center gap-2 text-lumi-gold">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">LUMI falando...</span>
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Controles principais */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {!isConnected ? (
            <Button
              onClick={handleStartConversation}
              disabled={hasPermission === false || isConnecting}
              className="bg-gradient-to-r from-lumi-gold to-lumi-gold-light hover:from-lumi-gold-dark hover:to-lumi-gold text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-5 w-5" />
                  Iniciar Conversa
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleEndConversation}
              variant="destructive"
              className="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Encerrar Conversa
            </Button>
          )}
        </div>

        {/* Controle de Volume */}
        {isConnected && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground min-w-[3ch]">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Instruções */}
      {hasPermission === false && (
        <Card className="p-4 bg-yellow-50 border-yellow-200 mb-4">
          <div className="flex items-center gap-3">
            <MicOff className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Permissão do microfone necessária</p>
              <p className="text-sm text-yellow-600">
                Para conversar com a LUMI, você precisa permitir o acesso ao microfone.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Voice Transcript Component */}
      <VoiceTranscript
        currentTranscript={currentTranscript}
        conversationTranscripts={conversationTranscripts}
        onSaveConversation={handleSaveConversation}
        onClearTranscripts={handleClearTranscripts}
      />

      {/* Dicas de uso */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2 text-foreground">Como usar:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Clique em "Iniciar Conversa" para começar</li>
          <li>• Fale naturalmente com a LUMI</li>
          <li>• Ela responderá por voz sobre marketing digital e vendas</li>
          <li>• A transcrição aparecerá automaticamente</li>
          <li>• Salve a conversa no histórico quando terminar</li>
          <li>• Ajuste o volume conforme necessário</li>
        </ul>
      </Card>
    </div>
  );
}
