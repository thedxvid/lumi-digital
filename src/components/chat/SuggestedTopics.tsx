import { Agent } from '@/types/agents';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SuggestedTopicsProps {
  agent: Agent;
  onTopicClick: (topic: string) => void;
}

export function SuggestedTopics({ agent, onTopicClick }: SuggestedTopicsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-2 mb-3 justify-center">
        <Sparkles className="w-3.5 h-3.5 text-lumi-gold" />
        <h3 className="text-xs font-medium text-muted-foreground">
          Sugestões
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {agent.suggestedTopics.slice(0, 4).map((topic, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => onTopicClick(topic)}
            className="text-left p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border border-border/30 hover:border-border group"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: agent.color + '20', color: agent.color }}
              >
                {agent.icon}
              </div>
              <p className="text-xs font-medium flex-1 leading-snug line-clamp-2">
                {topic}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
