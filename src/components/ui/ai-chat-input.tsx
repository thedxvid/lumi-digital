import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Paperclip, Send, X, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export const AIChatInput = ({ onSendMessage, disabled, className }: AIChatInputProps) => {
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue && selectedImages.length === 0) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, selectedImages.length]);

  const handleActivate = () => setIsActive(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || selectedImages.length > 0) && !disabled && !uploading) {
      onSendMessage(inputValue.trim(), selectedImages.length > 0 ? selectedImages : undefined);
      setInputValue("");
      setSelectedImages([]);
      setIsActive(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxImages = 5;

    if (selectedImages.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imagens por mensagem`);
      return;
    }

    setUploading(true);
    try {
      const newImages: string[] = [];

      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          toast.error(`Tipo de arquivo não suportado: ${file.name}`);
          continue;
        }

        if (file.size > maxSize) {
          toast.error(`Arquivo muito grande: ${file.name} (máx 10MB)`);
          continue;
        }

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newImages.push(base64);
      }

      setSelectedImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao processar imagens");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const containerVariants = {
    collapsed: {
      height: selectedImages.length > 0 ? "auto" : 68,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: selectedImages.length > 0 ? "auto" : 68,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  };

  return (
    <div className={cn("w-full flex justify-center items-center px-2 sm:px-0", className)}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-4xl"
        variants={containerVariants}
        animate={isActive || inputValue || selectedImages.length > 0 ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "visible", borderRadius: 32, background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
        onClick={handleActivate}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-stretch w-full h-full">
          {/* Preview das imagens */}
          {selectedImages.length > 0 && (
            <div className="px-3 sm:px-4 pt-4 pb-2 flex gap-2 flex-wrap">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-3 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              className="p-1.5 sm:p-3 rounded-full hover:bg-muted transition flex-shrink-0"
              title="Anexar imagem"
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={disabled || uploading || selectedImages.length >= 5}
            >
              <ImageIcon size={16} className="text-foreground sm:w-5 sm:h-5" />
            </button>

            {/* Text Input & Placeholder */}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled || uploading}
                placeholder="Como posso te ajudar hoje?"
                className="w-full border-0 outline-0 rounded-md py-2 px-1 text-sm sm:text-base bg-transparent font-normal text-foreground placeholder:text-muted-foreground"
                onFocus={handleActivate}
              />
            </div>

            <button
              className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 sm:p-3 rounded-full font-medium justify-center transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar"
              type="submit"
              disabled={(!inputValue.trim() && selectedImages.length === 0) || disabled || uploading}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
