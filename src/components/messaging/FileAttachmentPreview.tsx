
import React from "react";
import { X, File, FileText, Image, Music, FileCheck } from "lucide-react";
import { getFileTypeCategory } from "@/lib/web3/messaging";
import { Button } from "@/components/ui/button";

interface FileAttachmentPreviewProps {
  file: File;
  onRemove: () => void;
  language?: string;
}

export const FileAttachmentPreview: React.FC<FileAttachmentPreviewProps> = ({
  file,
  onRemove,
  language = "en"
}) => {
  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      remove: "Remove",
      image: "Image",
      audio: "Audio",
      pdf: "PDF",
      document: "Document",
      other: "File",
    },
    es: {
      remove: "Eliminar",
      image: "Imagen",
      audio: "Audio",
      pdf: "PDF",
      document: "Documento",
      other: "Archivo",
    },
    ig: {
      remove: "Wepụ",
      image: "Foto",
      audio: "Ọdịyo",
      pdf: "PDF",
      document: "Akwụkwọ",
      other: "Faịlụ",
    },
    sw: {
      remove: "Ondoa",
      image: "Picha",
      audio: "Sauti",
      pdf: "PDF",
      document: "Waraka",
      other: "Faili",
    },
    hi: {
      remove: "हटाएं",
      image: "छवि",
      audio: "ऑडियो",
      pdf: "पीडीएफ",
      document: "दस्तावेज़",
      other: "फ़ाइल",
    },
  };

  const t = (key: string): string => {
    return (translations[language] || translations.en)[key] || translations.en[key];
  };

  const fileType = getFileTypeCategory(file.type);
  const fileSize = formatFileSize(file.size);
  
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="w-6 h-6 text-primary" />;
      case 'audio':
        return <Music className="w-6 h-6 text-primary" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-primary" />;
      case 'document':
        return <FileCheck className="w-6 h-6 text-primary" />;
      default:
        return <File className="w-6 h-6 text-primary" />;
    }
  };
  
  // For images, create a preview thumbnail
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (fileType === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, fileType]);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
      {fileType === 'image' && previewUrl ? (
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          {getFileIcon()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(fileType)} • {fileSize}
        </p>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">{t("remove")}</span>
      </Button>
    </div>
  );
};
