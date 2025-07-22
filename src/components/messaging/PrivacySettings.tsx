
import React from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Keyboard, Users, UserCheck, Shield, Globe } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";

interface PrivacySettingsProps {
  onBack: () => void;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onBack }) => {
  const { messagingPreferences, updateMessagingPreferences, blockedUsers } = useWallet();

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      privacySettings: "Privacy Settings",
      privacyDescription: "Control who can message you and what information is shared",
      messageFiltering: "Message Filtering",
      allowEveryone: "Allow everyone to message me",
      trustThreshold: "Trust threshold for new messages",
      lowTrust: "Low",
      highTrust: "High",
      currentThreshold: "Current threshold",
      readReceipts: "Read Receipts",
      showReadReceipts: "Show when I've read messages",
      readReceiptsDescription: "Others will see when you've read their messages",
      typingIndicators: "Typing Indicators",
      showTypingStatus: "Show when I'm typing",
      typingDescription: "Others will see when you're typing a message",
      backupMessages: "Backup Messages",
      enableBackup: "Enable encrypted message backup",
      backupDescription: "Messages will be encrypted and backed up to decentralized storage",
      blockedUsers: "Blocked Users",
      blockedCount: "users blocked",
      manageBlocked: "Manage Blocked Users",
      language: "Language",
      back: "Back to Chat",
    },
    es: {
      privacySettings: "Configuración de Privacidad",
      privacyDescription: "Controla quién puede enviarte mensajes y qué información se comparte",
      messageFiltering: "Filtrado de Mensajes",
      allowEveryone: "Permitir que todos me envíen mensajes",
      trustThreshold: "Umbral de confianza para nuevos mensajes",
      lowTrust: "Bajo",
      highTrust: "Alto",
      currentThreshold: "Umbral actual",
      readReceipts: "Confirmaciones de Lectura",
      showReadReceipts: "Mostrar cuando he leído mensajes",
      readReceiptsDescription: "Otros verán cuando has leído sus mensajes",
      typingIndicators: "Indicadores de Escritura",
      showTypingStatus: "Mostrar cuando estoy escribiendo",
      typingDescription: "Otros verán cuando estás escribiendo un mensaje",
      backupMessages: "Respaldo de Mensajes",
      enableBackup: "Habilitar respaldo encriptado de mensajes",
      backupDescription: "Los mensajes serán encriptados y respaldados en almacenamiento descentralizado",
      blockedUsers: "Usuarios Bloqueados",
      blockedCount: "usuarios bloqueados",
      manageBlocked: "Administrar Usuarios Bloqueados",
      language: "Idioma",
      back: "Volver al Chat",
    },
    ig: {
      privacySettings: "Ntọala Nzuzo",
      privacyDescription: "Jide onye nwere ike iziga gị ozi na ozi ekeziri",
      messageFiltering: "Ịchọpụta Ozi",
      allowEveryone: "Kwe ka onye ọ bụla zigara m ozi",
      trustThreshold: "Okpomọkụ ntụkwasị obi maka ozi ọhụrụ",
      lowTrust: "Obere",
      highTrust: "Elu",
      currentThreshold: "Okpomọkụ ugbu a",
      readReceipts: "Gụọ nrịta ego",
      showReadReceipts: "Gosi mgbe m gụrụ ozi",
      readReceiptsDescription: "Ndị ọzọ ga-ahụ mgbe ị gụrụ ozi ha",
      typingIndicators: "Ịtụpụta Ihe Ngosi",
      showTypingStatus: "Gosi mgbe m na-ebipụta",
      typingDescription: "Ndị ọzọ ga-ahụ mgbe ị na-ede ozi",
      backupMessages: "Ndabere Ozi",
      enableBackup: "Nye ikike nchekwa ozi ezoro ezo",
      backupDescription: "Ozi ga-ezoro ezo ma chekwaa na nchekwa ekekọrịtara",
      blockedUsers: "Ndị ojiegbe gbochiri",
      blockedCount: "ndị ọrụ gbochiri",
      manageBlocked: "Jikwaa Ndị Ojiegbe Mgbochi",
      language: "Asụsụ",
      back: "Laghachi na Chat",
    },
    sw: {
      privacySettings: "Mipangilio ya Faragha",
      privacyDescription: "Dhibiti anayeweza kukutumia ujumbe na taarifa zinazoshirikiwa",
      messageFiltering: "Kuchuja Ujumbe",
      allowEveryone: "Ruhusu kila mtu kunitumia ujumbe",
      trustThreshold: "Kiwango cha imani kwa ujumbe mpya",
      lowTrust: "Chini",
      highTrust: "Juu",
      currentThreshold: "Kiwango cha sasa",
      readReceipts: "Risiti za Kusoma",
      showReadReceipts: "Onyesha ninaposoma ujumbe",
      readReceiptsDescription: "Wengine wataona unaposoma ujumbe wao",
      typingIndicators: "Viashiria vya Kuandika",
      showTypingStatus: "Onyesha ninapoandika",
      typingDescription: "Wengine wataona unapoandika ujumbe",
      backupMessages: "Nakili Ujumbe",
      enableBackup: "Wezesha nakili ya ujumbe iliyosimbwa",
      backupDescription: "Ujumbe utasimbwa na kunakiliwa kwenye hifadhi iliyogawanywa",
      blockedUsers: "Watumiaji Waliozuiwa",
      blockedCount: "watumiaji waliozuiwa",
      manageBlocked: "Simamia Watumiaji Waliozuiwa",
      language: "Lugha",
      back: "Rudi kwenye Mazungumzo",
    },
    hi: {
      privacySettings: "गोपनीयता सेटिंग्स",
      privacyDescription: "नियंत्रित करें कि कौन आपको संदेश भेज सकता है और कौन सी जानकारी साझा की जाती है",
      messageFiltering: "संदेश फ़िल्टरिंग",
      allowEveryone: "सभी को मुझे संदेश भेजने की अनुमति दें",
      trustThreshold: "नए संदेशों के लिए विश्वास सीमा",
      lowTrust: "कम",
      highTrust: "उच्च",
      currentThreshold: "वर्तमान सीमा",
      readReceipts: "पढ़ने की रसीदें",
      showReadReceipts: "दिखाएं जब मैंने संदेश पढ़े हैं",
      readReceiptsDescription: "अन्य लोग देखेंगे जब आपने उनके संदेश पढ़े हैं",
      typingIndicators: "टाइपिंग संकेतक",
      showTypingStatus: "दिखाएं जब मैं टाइप कर रहा हूं",
      typingDescription: "अन्य लोग देखेंगे जब आप संदेश टाइप कर रहे हैं",
      backupMessages: "संदेश बैकअप",
      enableBackup: "एन्क्रिप्टेड संदेश बैकअप सक्षम करें",
      backupDescription: "संदेश एन्क्रिप्ट किए जाएंगे और विकेंद्रीकृत स्टोरेज पर बैकअप किए जाएंगे",
      blockedUsers: "ब्लॉक किए गए उपयोगकर्ता",
      blockedCount: "उपयोगकर्ता ब्लॉक किए गए",
      manageBlocked: "ब्लॉक किए गए उपयोगकर्ताओं का प्रबंधन करें",
      language: "भाषा",
      back: "चैट पर वापस जाएं",
    },
  };

  const t = (key: string): string => {
    return (translations[messagingPreferences.language] || translations.en)[key] || translations.en[key];
  };

  const handleTrustScoreChange = (value: number[]) => {
    updateMessagingPreferences({ trustScoreThreshold: value[0] });
  };

  const handleAllowEveryoneToggle = (checked: boolean) => {
    updateMessagingPreferences({
      allowMessagesFrom: checked ? "everyone" : "trusted"
    });
  };

  const handleReadReceiptsToggle = (checked: boolean) => {
    updateMessagingPreferences({ showReadReceipts: checked });
  };

  const handleTypingStatusToggle = (checked: boolean) => {
    updateMessagingPreferences({ showTypingStatus: checked });
  };

  const handleBackupToggle = (checked: boolean) => {
    updateMessagingPreferences({ backupMessages: checked });
  };

  const handleLanguageChange = (lang: string) => {
    updateMessagingPreferences({ language: lang as any });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {t("privacySettings")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("privacyDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">{t("language")}</CardTitle>
              </div>
              <LanguageSelector
                currentLanguage={messagingPreferences.language}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Message Filtering */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("messageFiltering")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-everyone">{t("allowEveryone")}</Label>
              </div>
              <Switch
                id="allow-everyone"
                checked={messagingPreferences.allowMessagesFrom === "everyone"}
                onCheckedChange={handleAllowEveryoneToggle}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>{t("trustThreshold")}</Label>
                <span className="text-sm font-medium">
                  {t("currentThreshold")}: {messagingPreferences.trustScoreThreshold}
                </span>
              </div>
              <Slider
                value={[messagingPreferences.trustScoreThreshold]}
                min={0}
                max={100}
                step={5}
                onValueChange={handleTrustScoreChange}
                disabled={messagingPreferences.allowMessagesFrom === "everyone"}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("lowTrust")}</span>
                <span>{t("highTrust")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Read Receipts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("readReceipts")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="read-receipts">{t("showReadReceipts")}</Label>
                <CardDescription>{t("readReceiptsDescription")}</CardDescription>
              </div>
              <Switch
                id="read-receipts"
                checked={messagingPreferences.showReadReceipts}
                onCheckedChange={handleReadReceiptsToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Typing Indicators */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("typingIndicators")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="typing-status">{t("showTypingStatus")}</Label>
                <CardDescription>{t("typingDescription")}</CardDescription>
              </div>
              <Switch
                id="typing-status"
                checked={messagingPreferences.showTypingStatus}
                onCheckedChange={handleTypingStatusToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Backup */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("backupMessages")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="backup-messages">{t("enableBackup")}</Label>
                <CardDescription>{t("backupDescription")}</CardDescription>
              </div>
              <Switch
                id="backup-messages"
                checked={messagingPreferences.backupMessages}
                onCheckedChange={handleBackupToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{t("blockedUsers")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{blockedUsers.length}</span>{" "}
                <span className="text-muted-foreground">{t("blockedCount")}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={blockedUsers.length === 0}
              >
                {t("manageBlocked")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <Button onClick={onBack} className="w-full">
          {t("back")}
        </Button>
      </div>
    </div>
  );
};
