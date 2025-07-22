
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Shield, Award, Gem } from "lucide-react";

interface UserTrustIndicatorProps {
  trustScore: number;
  trustBadge?: string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  language?: string;
}

export const UserTrustIndicator: React.FC<UserTrustIndicatorProps> = ({
  trustScore,
  trustBadge = "none",
  isVerified = false,
  size = "md",
  language = "en"
}) => {
  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      verified: "Verified",
      trustScore: "Trust Score",
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      legend: "Legend",
    },
    es: {
      verified: "Verificado",
      trustScore: "Nivel de Confianza",
      bronze: "Bronce",
      silver: "Plata",
      gold: "Oro",
      legend: "Leyenda",
    },
    ig: {
      verified: "Egosila",
      trustScore: "Ọkwa Ntụkwasị Obi",
      bronze: "Ọla Bọrọnzụ",
      silver: "Ọla Ọcha",
      gold: "Ọla Edo",
      legend: "Akụkọ Okike",
    },
    sw: {
      verified: "Imethibitishwa",
      trustScore: "Alama ya Imani",
      bronze: "Shaba",
      silver: "Fedha",
      gold: "Dhahabu",
      legend: "Maarufu",
    },
    hi: {
      verified: "सत्यापित",
      trustScore: "विश्वास स्कोर",
      bronze: "कांस्य",
      silver: "चांदी",
      gold: "सोना",
      legend: "किंवदंती",
    },
  };

  const t = (key: string): string => {
    return (translations[language] || translations.en)[key] || translations.en[key];
  };

  // Size styles
  const sizeStyles = {
    sm: {
      icon: "w-3 h-3",
      badge: "text-xs px-1.5 py-0",
      text: "text-xs",
    },
    md: {
      icon: "w-4 h-4",
      badge: "text-xs",
      text: "text-sm",
    },
    lg: {
      icon: "w-5 h-5",
      badge: "text-sm",
      text: "text-base",
    },
  };

  // Get badge variant and icon based on trust level
  const getBadgeInfo = () => {
    switch (trustBadge) {
      case "bronze":
        return {
          icon: <Shield className={`${sizeStyles[size].icon} text-amber-700`} />,
          variant: "outline" as const,
          text: t("bronze"),
          color: "border-amber-700/50 text-amber-700",
        };
      case "silver":
        return {
          icon: <Shield className={`${sizeStyles[size].icon} text-zinc-400`} />,
          variant: "outline" as const,
          text: t("silver"),
          color: "border-zinc-400/50 text-zinc-400",
        };
      case "gold":
        return {
          icon: <Award className={`${sizeStyles[size].icon} text-amber-500`} />,
          variant: "outline" as const,
          text: t("gold"),
          color: "border-amber-500/50 text-amber-500",
        };
      case "legend":
        return {
          icon: <Gem className={`${sizeStyles[size].icon} text-violet-500`} />,
          variant: "outline" as const,
          text: t("legend"),
          color: "border-violet-500/50 text-violet-500",
        };
      default:
        return null;
    }
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="flex items-center gap-2">
      {/* Trust Score */}
      <div className="flex items-center gap-1">
        <div 
          className={`${
            trustScore >= 80 ? "text-success" : 
            trustScore >= 50 ? "text-primary" : 
            trustScore >= 30 ? "text-warning" : 
            "text-destructive"
          } ${sizeStyles[size].text} font-medium`}
        >
          {trustScore}
        </div>
      </div>
      
      {/* Badge if applicable */}
      {badgeInfo && (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${badgeInfo.color} ${sizeStyles[size].badge}`}
        >
          {badgeInfo.icon}
          <span>{badgeInfo.text}</span>
        </Badge>
      )}
      
      {/* Verified indicator */}
      {isVerified && (
        <Badge 
          variant="secondary"
          className={`flex items-center gap-1 ${sizeStyles[size].badge}`}
        >
          <ShieldCheck className={sizeStyles[size].icon} />
          <span>{t("verified")}</span>
        </Badge>
      )}
    </div>
  );
};
