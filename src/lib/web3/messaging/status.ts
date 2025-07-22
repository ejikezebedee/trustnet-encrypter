
// Message status enum
export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  QUEUED = "queued",
}

// File types that can be shared
export enum FileType {
  IMAGE = "image",
  AUDIO = "audio",
  DOCUMENT = "document",
  PDF = "pdf",
  VOICE = "voice",
}

// User Trust Status
export enum TrustStatus {
  VERIFIED = "verified",
  UNVERIFIED = "unverified",
  REPORTED = "reported",
  BLOCKED = "blocked",
}

// Get message status display text based on current language
export const getMessageStatusText = (status: MessageStatus, language: string = "en"): string => {
  const statusTexts: Record<string, Record<MessageStatus, string>> = {
    en: {
      [MessageStatus.PENDING]: "Sending...",
      [MessageStatus.SENT]: "Sent",
      [MessageStatus.DELIVERED]: "Delivered",
      [MessageStatus.READ]: "Read",
      [MessageStatus.FAILED]: "Failed to send",
      [MessageStatus.QUEUED]: "Queued for sending",
    },
    es: {
      [MessageStatus.PENDING]: "Enviando...",
      [MessageStatus.SENT]: "Enviado",
      [MessageStatus.DELIVERED]: "Entregado",
      [MessageStatus.READ]: "Leído",
      [MessageStatus.FAILED]: "Error al enviar",
      [MessageStatus.QUEUED]: "En cola para enviar",
    },
    ig: {
      [MessageStatus.PENDING]: "Na-eziga...",
      [MessageStatus.SENT]: "Ezigara",
      [MessageStatus.DELIVERED]: "Nnyefere",
      [MessageStatus.READ]: "Gụọ",
      [MessageStatus.FAILED]: "Enweghi ike iziga",
      [MessageStatus.QUEUED]: "Doziri n'ahịrị maka izipu",
    },
    sw: {
      [MessageStatus.PENDING]: "Inatuma...",
      [MessageStatus.SENT]: "Imetumwa",
      [MessageStatus.DELIVERED]: "Imefikishwa",
      [MessageStatus.READ]: "Imesomwa",
      [MessageStatus.FAILED]: "Imeshindwa kutuma",
      [MessageStatus.QUEUED]: "Imewekwa foleni kwa kutuma",
    },
    hi: {
      [MessageStatus.PENDING]: "भेज रहा है...",
      [MessageStatus.SENT]: "भेजा गया",
      [MessageStatus.DELIVERED]: "पहुंचा दिया",
      [MessageStatus.READ]: "पढ़ा गया",
      [MessageStatus.FAILED]: "भेजने में विफल",
      [MessageStatus.QUEUED]: "भेजने के लिए कतारबद्ध",
    },
  };

  // Fallback to English if language not supported
  const languageTexts = statusTexts[language] || statusTexts.en;
  return languageTexts[status];
};

// Typing indicator texts
export const getTypingIndicatorText = (language: string = "en"): string => {
  const typingTexts: Record<string, string> = {
    en: "Typing...",
    es: "Escribiendo...",
    ig: "Na-ebipụta...",
    sw: "Anaandika...",
    hi: "टाइपिंग...",
  };

  return typingTexts[language] || typingTexts.en;
};
