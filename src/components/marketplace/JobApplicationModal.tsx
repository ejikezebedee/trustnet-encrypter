import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Job } from '@/lib/web3/marketplace/types';
import { applyToJob } from '@/lib/web3/marketplace/core';
import { useToast } from '@/hooks/use-toast';

interface JobApplicationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted: () => void;
  language: string;
  userAddress: string;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  job,
  isOpen,
  onClose,
  onApplicationSubmitted,
  language,
  userAddress
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = {
    en: {
      applyToJob: 'Apply to Job',
      applicationMessage: 'Application Message',
      messagePlaceholder: 'Tell the job poster why you\'re the right person for this job...',
      submit: 'Submit Application',
      cancel: 'Cancel',
      applicationSubmitted: 'Application submitted successfully!',
      trustScoreTooLow: 'Your trust score is too low for this job',
      alreadyApplied: 'You have already applied to this job',
      submitting: 'Submitting...'
    },
    es: {
      applyToJob: 'Aplicar al Trabajo',
      applicationMessage: 'Mensaje de Aplicación',
      messagePlaceholder: 'Dile al empleador por qué eres la persona adecuada para este trabajo...',
      submit: 'Enviar Aplicación',
      cancel: 'Cancelar',
      applicationSubmitted: '¡Aplicación enviada exitosamente!',
      trustScoreTooLow: 'Tu puntuación de confianza es muy baja para este trabajo',
      alreadyApplied: 'Ya has aplicado a este trabajo',
      submitting: 'Enviando...'
    },
    sw: {
      applyToJob: 'Omba Kazi',
      applicationMessage: 'Ujumbe wa Maombi',
      messagePlaceholder: 'Mwambie mwajiri kwa nini wewe ni mtu sahihi kwa kazi hii...',
      submit: 'Tuma Maombi',
      cancel: 'Ghairi',
      applicationSubmitted: 'Maombi yametumwa kwa mafanikio!',
      trustScoreTooLow: 'Alama yako ya uaminifu ni chini sana kwa kazi hii',
      alreadyApplied: 'Tayari umeomba kazi hii',
      submitting: 'Inatuma...'
    },
    ig: {
      applyToJob: 'Tinye Akwụkwọ Maka Ọrụ',
      applicationMessage: 'Ozi Ntinye Akwụkwọ',
      messagePlaceholder: 'Gwa onye na-enye ọrụ ihe mere ị bụ onye kwesịrị ekwesị maka ọrụ a...',
      submit: 'Ziga Ntinye Akwụkwọ',
      cancel: 'Kagbuo',
      applicationSubmitted: 'Ezigara ntinye akwụkwọ nke ọma!',
      trustScoreTooLow: 'Akara ntụkwasị obi gị dị ala maka ọrụ a',
      alreadyApplied: 'Ị tinyela akwụkwọ maka ọrụ a',
      submitting: 'Na-eziga...'
    },
    hi: {
      applyToJob: 'नौकरी के लिए आवेदन करें',
      applicationMessage: 'आवेदन संदेश',
      messagePlaceholder: 'नियोक्ता को बताएं कि आप इस नौकरी के लिए सही व्यक्ति क्यों हैं...',
      submit: 'आवेदन जमा करें',
      cancel: 'रद्द करें',
      applicationSubmitted: 'आवेदन सफलतापूर्वक जमा किया गया!',
      trustScoreTooLow: 'इस नौकरी के लिए आपका ट्रस्ट स्कोर बहुत कम है',
      alreadyApplied: 'आपने पहले ही इस नौकरी के लिए आवेदन किया है',
      submitting: 'जमा कर रहे हैं...'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await applyToJob(
        job.id,
        userAddress,
        75, // Mock user trust score
        message
      );

      toast({
        title: "Success",
        description: t('applicationSubmitted')
      });

      onApplicationSubmitted();
      onClose();
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : "Failed to submit application";
      
      if (errorMessage.includes('Trust score too low')) {
        errorMessage = t('trustScoreTooLow');
      } else if (errorMessage.includes('already applied')) {
        errorMessage = t('alreadyApplied');
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('applyToJob')}</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <h4 className="font-medium text-foreground">{job.title}</h4>
          <p className="text-sm text-muted-foreground">
            Budget: {job.budget} {job.currency} • Trust Score Required: {job.requiredTrustScore}+
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">{t('applicationMessage')}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};