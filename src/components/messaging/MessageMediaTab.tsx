
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Image, FileText, Music, File } from "lucide-react";
import { Conversation, Message, MessageAttachment } from "@/lib/web3/messaging";

interface MessageMediaTabProps {
  conversation: Conversation;
  language?: string;
}

export const MessageMediaTab: React.FC<MessageMediaTabProps> = ({
  conversation,
  language = "en"
}) => {
  const [allAttachments, setAllAttachments] = useState<MessageAttachment[]>([]);
  const [imageAttachments, setImageAttachments] = useState<MessageAttachment[]>([]);
  const [audioAttachments, setAudioAttachments] = useState<MessageAttachment[]>([]);
  const [documentAttachments, setDocumentAttachments] = useState<MessageAttachment[]>([]);

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      media: "Media",
      all: "All",
      images: "Images",
      audio: "Audio",
      documents: "Documents",
      noMedia: "No media shared yet",
      downloadFile: "Download File",
    },
    es: {
      media: "Medios",
      all: "Todos",
      images: "Imágenes",
      audio: "Audio",
      documents: "Documentos",
      noMedia: "Aún no se han compartido medios",
      downloadFile: "Descargar Archivo",
    },
    ig: {
      media: "Midia",
      all: "Niile",
      images: "Foto",
      audio: "Ọdịyo",
      documents: "Akwụkwọ",
      noMedia: "Enweghị midia ekekọrịtara",
      downloadFile: "Budata Faịlụ",
    },
    sw: {
      media: "Midia",
      all: "Zote",
      images: "Picha",
      audio: "Sauti",
      documents: "Nyaraka",
      noMedia: "Hakuna midia iliyoshirikiwa bado",
      downloadFile: "Pakua Faili",
    },
    hi: {
      media: "मीडिया",
      all: "सभी",
      images: "चित्र",
      audio: "ऑडियो",
      documents: "दस्तावेज़",
      noMedia: "अभी तक कोई मीडिया साझा नहीं किया गया",
      downloadFile: "फ़ाइल डाउनलोड करें",
    },
  };

  const t = (key: string): string => {
    return (translations[language] || translations.en)[key] || translations.en[key];
  };

  // Extract all attachments from messages
  useEffect(() => {
    const extractAttachments = () => {
      const attachments: MessageAttachment[] = [];
      
      conversation.messages.forEach((message) => {
        if (message.attachments && message.attachments.length > 0) {
          attachments.push(...message.attachments);
        }
      });
      
      setAllAttachments(attachments);
      
      // Filter by type
      setImageAttachments(attachments.filter(att => att.type.startsWith('image/')));
      setAudioAttachments(attachments.filter(att => att.type.startsWith('audio/')));
      setDocumentAttachments(attachments.filter(att => 
        att.type.startsWith('application/') || att.type === 'text/plain'
      ));
    };
    
    extractAttachments();
  }, [conversation.messages]);

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-primary" />;
    } else if (type.startsWith('audio/')) {
      return <Music className="w-6 h-6 text-primary" />;
    } else if (type === 'application/pdf' || type.startsWith('application/') || type === 'text/plain') {
      return <FileText className="w-6 h-6 text-primary" />;
    } else {
      return <File className="w-6 h-6 text-primary" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const renderAttachmentsList = (attachments: MessageAttachment[]) => {
    if (attachments.length === 0) {
      return (
        <div className="text-center py-8">
          <File className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noMedia")}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((attachment) => {
          const isImage = attachment.type.startsWith('image/');
          
          return (
            <Card key={attachment.id} className="overflow-hidden">
              {isImage ? (
                <div className="h-32 bg-muted flex items-center justify-center">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-muted flex items-center justify-center">
                  {getFileIcon(attachment.type)}
                </div>
              )}
              
              <CardContent className="p-2">
                <div className="text-xs truncate font-medium">
                  {attachment.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(attachment.size)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

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
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="all">{t("all")}</TabsTrigger>
        <TabsTrigger value="images">{t("images")}</TabsTrigger>
        <TabsTrigger value="audio">{t("audio")}</TabsTrigger>
        <TabsTrigger value="documents">{t("documents")}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-0">
        {renderAttachmentsList(allAttachments)}
      </TabsContent>
      
      <TabsContent value="images" className="mt-0">
        {renderAttachmentsList(imageAttachments)}
      </TabsContent>
      
      <TabsContent value="audio" className="mt-0">
        {renderAttachmentsList(audioAttachments)}
      </TabsContent>
      
      <TabsContent value="documents" className="mt-0">
        {renderAttachmentsList(documentAttachments)}
      </TabsContent>
    </Tabs>
  );
};
