export interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  systemPrompt: string;
  suggestedTopics: string[];
  capabilities: ('text' | 'image')[];
}
