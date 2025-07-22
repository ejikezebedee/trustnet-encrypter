import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Star, User, MessageCircle } from 'lucide-react';
import { Job, JobStatus } from '@/lib/web3/marketplace/types';
import { getJobStatusColor } from '@/lib/web3/marketplace/core';
import { UserTrustIndicator } from '@/components/messaging/UserTrustIndicator';
import { JobApplicationModal } from './JobApplicationModal';
import { useWallet } from '@/contexts/WalletContext';

interface JobCardProps {
  job: Job;
  language: string;
  onJobUpdate: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, language, onJobUpdate }) => {
  const { wallet } = useWallet();
  const [showApplication, setShowApplication] = useState(false);

  const translations = {
    en: {
      apply: 'Apply',
      viewDetails: 'View Details',
      inProgress: 'In Progress',
      delivered: 'Delivered',
      completed: 'Completed',
      disputed: 'Disputed',
      cancelled: 'Cancelled',
      open: 'Open',
      remote: 'Remote',
      inPerson: 'In Person',
      applicants: 'applicants',
      trustRequired: 'Trust Score Required',
      yourJob: 'Your Job',
      alreadyApplied: 'Applied'
    },
    es: {
      apply: 'Aplicar',
      viewDetails: 'Ver Detalles',
      inProgress: 'En Progreso',
      delivered: 'Entregado',
      completed: 'Completado',
      disputed: 'Disputado',
      cancelled: 'Cancelado',
      open: 'Abierto',
      remote: 'Remoto',
      inPerson: 'En Persona',
      applicants: 'aplicantes',
      trustRequired: 'Puntuación de Confianza Requerida',
      yourJob: 'Tu Trabajo',
      alreadyApplied: 'Aplicado'
    },
    sw: {
      apply: 'Omba',
      viewDetails: 'Ona Maelezo',
      inProgress: 'Inaendelea',
      delivered: 'Imefikishwa',
      completed: 'Imekamilika',
      disputed: 'Ina Ugomvi',
      cancelled: 'Imeghairiwa',
      open: 'Wazi',
      remote: 'Kwa Mbali',
      inPerson: 'Kibinafsi',
      applicants: 'waombaji',
      trustRequired: 'Alama ya Uaminifu Inahitajika',
      yourJob: 'Kazi Yako',
      alreadyApplied: 'Umeomba'
    },
    ig: {
      apply: 'Tinye Akwụkwọ',
      viewDetails: 'Lee Nkọwa',
      inProgress: 'Na-aga n\'ihu',
      delivered: 'Ewezigara',
      completed: 'Emechara',
      disputed: 'Na Esemokwu',
      cancelled: 'Akagbuola',
      open: 'Mepee',
      remote: 'Site n\'ebe dị anya',
      inPerson: 'N\'onwe onye',
      applicants: 'ndị na-achọ',
      trustRequired: 'Akara Ntụkwasị Obi Chọrọ',
      yourJob: 'Ọrụ Gị',
      alreadyApplied: 'Etinyela Akwụkwọ'
    },
    hi: {
      apply: 'आवेदन करें',
      viewDetails: 'विवरण देखें',
      inProgress: 'प्रगति में',
      delivered: 'वितरित',
      completed: 'पूर्ण',
      disputed: 'विवादित',
      cancelled: 'रद्द',
      open: 'खुला',
      remote: 'दूरस्थ',
      inPerson: 'व्यक्तिगत रूप से',
      applicants: 'आवेदक',
      trustRequired: 'ट्रस्ट स्कोर आवश्यक',
      yourJob: 'आपकी नौकरी',
      alreadyApplied: 'आवेदन किया'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return t('open');
      case JobStatus.IN_PROGRESS: return t('inProgress');
      case JobStatus.DELIVERED: return t('delivered');
      case JobStatus.COMPLETED: return t('completed');
      case JobStatus.DISPUTED: return t('disputed');
      case JobStatus.CANCELLED: return t('cancelled');
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    // Return appropriate icon based on category
    return '📋'; // Default icon
  };

  const isUserJob = wallet?.address === job.posterAddress;
  const hasApplied = job.applicants.some(app => app.applicantAddress === wallet?.address);
  const canApply = !isUserJob && !hasApplied && job.status === JobStatus.OPEN;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getCategoryIcon(job.category)}</span>
                <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                <Badge 
                  variant="secondary" 
                  className={getJobStatusColor(job.status)}
                >
                  {getStatusText(job.status)}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {job.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{job.budget} {job.currency}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{job.completionTime}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <UserTrustIndicator
                trustScore={job.posterTrustScore}
                trustBadge={job.posterTrustBadge as any}
                isVerified={job.posterTrustScore > 70}
                size="sm"
                language={language}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {job.applicants.length} {t('applicants')}
              </span>
              <span>
                {t('trustRequired')}: {job.requiredTrustScore}+
              </span>
              <Badge variant="outline" className="text-xs">
                {job.deliveryMethod === 'remote' ? t('remote') : t('inPerson')}
              </Badge>
            </div>

            <div className="flex gap-2">
              {isUserJob ? (
                <Badge variant="secondary">{t('yourJob')}</Badge>
              ) : hasApplied ? (
                <Badge variant="secondary">{t('alreadyApplied')}</Badge>
              ) : canApply ? (
                <Button 
                  size="sm" 
                  onClick={() => setShowApplication(true)}
                  className="text-xs"
                >
                  {t('apply')}
                </Button>
              ) : null}
              
              <Button variant="outline" size="sm" className="text-xs">
                {t('viewDetails')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showApplication && (
        <JobApplicationModal
          job={job}
          isOpen={showApplication}
          onClose={() => setShowApplication(false)}
          onApplicationSubmitted={onJobUpdate}
          language={language}
          userAddress={wallet?.address || ''}
        />
      )}
    </>
  );
};