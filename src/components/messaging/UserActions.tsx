
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Flag, Ban, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";

interface UserActionsProps {
  address: string;
  isBlocked: boolean;
  language?: string;
}

export const UserActions: React.FC<UserActionsProps> = ({
  address,
  isBlocked,
  language = "en"
}) => {
  const { blockUser, unblockUser, reportUser } = useWallet();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      block: "Block User",
      unblock: "Unblock User",
      report: "Report User",
      reportDialog: "Report User",
      reportDescription: "Please provide a reason for reporting this user. This information will be reviewed by our team.",
      reasonPlaceholder: "Enter your reason for reporting this user...",
      submitReport: "Submit Report",
      cancel: "Cancel",
      reportSuccess: "User has been reported successfully",
      blockSuccess: "User has been blocked",
      unblockSuccess: "User has been unblocked",
    },
    es: {
      block: "Bloquear Usuario",
      unblock: "Desbloquear Usuario",
      report: "Reportar Usuario",
      reportDialog: "Reportar Usuario",
      reportDescription: "Por favor, proporciona un motivo para reportar a este usuario. Esta información será revisada por nuestro equipo.",
      reasonPlaceholder: "Ingresa tu motivo para reportar a este usuario...",
      submitReport: "Enviar Reporte",
      cancel: "Cancelar",
      reportSuccess: "El usuario ha sido reportado con éxito",
      blockSuccess: "El usuario ha sido bloqueado",
      unblockSuccess: "El usuario ha sido desbloqueado",
    },
    ig: {
      block: "Gbochie Onye Ọrụ",
      unblock: "Wepụ Mgbochi",
      report: "Kọọrọ Onye Ọrụ",
      reportDialog: "Kọọrọ Onye Ọrụ",
      reportDescription: "Biko nye ihe mere i ji akọrọ onye ọrụ a. Ndị otu anyị ga-enyocha ozi a.",
      reasonPlaceholder: "Tinye ihe mere i ji akọrọ onye ọrụ a...",
      submitReport: "Zipụ Akọwa",
      cancel: "Kagbuo",
      reportSuccess: "Akọwapụtara onye ọrụ nke ọma",
      blockSuccess: "Agbochiri onye ọrụ",
      unblockSuccess: "Ewepụla mgbochi onye ọrụ",
    },
    sw: {
      block: "Zuia Mtumiaji",
      unblock: "Ondoa Kizuizi",
      report: "Ripoti Mtumiaji",
      reportDialog: "Ripoti Mtumiaji",
      reportDescription: "Tafadhali toa sababu ya kuripoti mtumiaji huyu. Taarifa hii itakaguliwa na timu yetu.",
      reasonPlaceholder: "Ingiza sababu yako ya kuripoti mtumiaji huyu...",
      submitReport: "Wasilisha Ripoti",
      cancel: "Ghairi",
      reportSuccess: "Mtumiaji ameripotiwa kwa mafanikio",
      blockSuccess: "Mtumiaji amezuiliwa",
      unblockSuccess: "Kizuizi cha mtumiaji kimeondolewa",
    },
    hi: {
      block: "उपयोगकर्ता को ब्लॉक करें",
      unblock: "उपयोगकर्ता को अनब्लॉक करें",
      report: "उपयोगकर्ता की रिपोर्ट करें",
      reportDialog: "उपयोगकर्ता की रिपोर्ट करें",
      reportDescription: "कृपया इस उपयोगकर्ता की रिपोर्ट करने का कारण बताएं। इस जानकारी की हमारी टीम द्वारा समीक्षा की जाएगी।",
      reasonPlaceholder: "इस उपयोगकर्ता की रिपोर्ट करने का कारण दर्ज करें...",
      submitReport: "रिपोर्ट सबमिट करें",
      cancel: "रद्द करें",
      reportSuccess: "उपयोगकर्ता की रिपोर्ट सफलतापूर्वक की गई है",
      blockSuccess: "उपयोगकर्ता को ब्लॉक कर दिया गया है",
      unblockSuccess: "उपयोगकर्ता को अनब्लॉक कर दिया गया है",
    },
  };

  const t = (key: string): string => {
    return (translations[language] || translations.en)[key] || translations.en[key];
  };

  const handleToggleBlock = () => {
    if (isBlocked) {
      unblockUser(address);
    } else {
      blockUser(address);
    }
  };

  const handleReport = () => {
    setIsReportDialogOpen(true);
  };

  const handleSubmitReport = () => {
    if (!reportReason.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      reportUser(address, reportReason);
      setIsReportDialogOpen(false);
      setReportReason("");
    } catch (error) {
      console.error("Error reporting user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant={isBlocked ? "outline" : "secondary"}
          size="sm"
          onClick={handleToggleBlock}
          className="flex items-center gap-1"
        >
          {isBlocked ? (
            <>
              <Shield className="w-4 h-4" />
              <span>{t("unblock")}</span>
            </>
          ) : (
            <>
              <Ban className="w-4 h-4" />
              <span>{t("block")}</span>
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReport}
          className="flex items-center gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          <Flag className="w-4 h-4" />
          <span>{t("report")}</span>
        </Button>
      </div>
      
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {t("reportDialog")}
            </DialogTitle>
            <DialogDescription>
              {t("reportDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitReport}
              disabled={!reportReason.trim() || isSubmitting}
            >
              {isSubmitting ? "..." : t("submitReport")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
