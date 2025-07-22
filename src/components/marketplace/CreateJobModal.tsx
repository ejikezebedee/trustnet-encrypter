import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { JobCategory } from '@/lib/web3/marketplace/types';
import { createJob, getJobCategories } from '@/lib/web3/marketplace/core';
import { useToast } from '@/hooks/use-toast';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
  language: string;
  userAddress: string;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  language,
  userAddress
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as JobCategory,
    location: '',
    budget: '',
    requiredTrustScore: '50',
    completionTime: '',
    deliveryMethod: 'remote' as 'remote' | 'in-person'
  });

  const translations = {
    en: {
      createJob: 'Create New Job',
      jobTitle: 'Job Title',
      description: 'Description',
      category: 'Category',
      location: 'Location',
      budget: 'Budget (TRUST tokens)',
      trustScore: 'Minimum Trust Score Required',
      completionTime: 'Expected Completion Time',
      deliveryMethod: 'Delivery Method',
      remote: 'Remote',
      inPerson: 'In Person',
      create: 'Create Job',
      cancel: 'Cancel',
      titlePlaceholder: 'e.g., Website design for small business',
      descriptionPlaceholder: 'Provide detailed requirements and expectations...',
      locationPlaceholder: 'e.g., New York, NY or "Remote"',
      completionPlaceholder: 'e.g., 2 weeks, 3 days',
      jobCreated: 'Job created successfully!',
      fillAllFields: 'Please fill in all required fields',
      invalidBudget: 'Please enter a valid budget amount'
    },
    es: {
      createJob: 'Crear Nuevo Trabajo',
      jobTitle: 'Título del Trabajo',
      description: 'Descripción',
      category: 'Categoría',
      location: 'Ubicación',
      budget: 'Presupuesto (tokens TRUST)',
      trustScore: 'Puntuación de Confianza Mínima Requerida',
      completionTime: 'Tiempo de Finalización Esperado',
      deliveryMethod: 'Método de Entrega',
      remote: 'Remoto',
      inPerson: 'En Persona',
      create: 'Crear Trabajo',
      cancel: 'Cancelar',
      titlePlaceholder: 'ej., Diseño de sitio web para pequeña empresa',
      descriptionPlaceholder: 'Proporcione requisitos y expectativas detallados...',
      locationPlaceholder: 'ej., Nueva York, NY o "Remoto"',
      completionPlaceholder: 'ej., 2 semanas, 3 días',
      jobCreated: '¡Trabajo creado exitosamente!',
      fillAllFields: 'Por favor complete todos los campos requeridos',
      invalidBudget: 'Por favor ingrese un monto de presupuesto válido'
    },
    sw: {
      createJob: 'Unda Kazi Mpya',
      jobTitle: 'Kichwa cha Kazi',
      description: 'Maelezo',
      category: 'Aina',
      location: 'Mahali',
      budget: 'Bajeti (tokens TRUST)',
      trustScore: 'Alama ya Chini ya Uaminifu Inayohitajika',
      completionTime: 'Muda wa Kukamilisha Unaotumainiwa',
      deliveryMethod: 'Njia ya Utoaji',
      remote: 'Kwa Mbali',
      inPerson: 'Kibinafsi',
      create: 'Unda Kazi',
      cancel: 'Ghairi',
      titlePlaceholder: 'mfano, Muundo wa tovuti kwa biashara ndogo',
      descriptionPlaceholder: 'Toa mahitaji na mategemeo ya kina...',
      locationPlaceholder: 'mfano, New York, NY au "Kwa Mbali"',
      completionPlaceholder: 'mfano, wiki 2, siku 3',
      jobCreated: 'Kazi imeundwa kwa mafanikio!',
      fillAllFields: 'Tafadhali jaza sehemu zote zinazohitajika',
      invalidBudget: 'Tafadhali ingiza kiasi halali cha bajeti'
    },
    ig: {
      createJob: 'Mepụta Ọrụ Ọhụrụ',
      jobTitle: 'Aha Ọrụ',
      description: 'Nkọwa',
      category: 'Ụdị',
      location: 'Ebe',
      budget: 'Ego (tokens TRUST)',
      trustScore: 'Akara Ntụkwasị Obi Kacha Nta Chọrọ',
      completionTime: 'Oge Mmecha A Na-atụ Anya Ya',
      deliveryMethod: 'Ụzọ Nnyefe',
      remote: 'Site n\'ebe Dị Anya',
      inPerson: 'N\'onwe Onye',
      create: 'Mepụta Ọrụ',
      cancel: 'Kagbuo',
      titlePlaceholder: 'ọmụmaatụ, Nhazi webụsaịtị maka obere azụmaahịa',
      descriptionPlaceholder: 'Nye ihe ndị chọrọ na atụmanya zuru oke...',
      locationPlaceholder: 'ọmụmaatụ, New York, NY ma ọ bụ "Site n\'ebe Dị Anya"',
      completionPlaceholder: 'ọmụmaatụ, izu 2, ụbọchị 3',
      jobCreated: 'Emepụtara ọrụ nke ọma!',
      fillAllFields: 'Biko dejupụta akụkụ niile achọrọ',
      invalidBudget: 'Biko tinye ego ego ziri ezi'
    },
    hi: {
      createJob: 'नई नौकरी बनाएं',
      jobTitle: 'नौकरी का शीर्षक',
      description: 'विवरण',
      category: 'श्रेणी',
      location: 'स्थान',
      budget: 'बजट (TRUST टोकन)',
      trustScore: 'न्यूनतम ट्रस्ट स्कोर आवश्यक',
      completionTime: 'अपेक्षित पूर्णता समय',
      deliveryMethod: 'डिलीवरी विधि',
      remote: 'दूरस्थ',
      inPerson: 'व्यक्तिगत रूप से',
      create: 'नौकरी बनाएं',
      cancel: 'रद्द करें',
      titlePlaceholder: 'उदा., छोटे व्यवसाय के लिए वेबसाइट डिज़ाइन',
      descriptionPlaceholder: 'विस्तृत आवश्यकताएं और अपेक्षाएं प्रदान करें...',
      locationPlaceholder: 'उदा., नई दिल्ली या "दूरस्थ"',
      completionPlaceholder: 'उदा., 2 सप्ताह, 3 दिन',
      jobCreated: 'नौकरी सफलतापूर्वक बनाई गई!',
      fillAllFields: 'कृपया सभी आवश्यक फील्ड भरें',
      invalidBudget: 'कृपया एक वैध बजट राशि दर्ज करें'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  const categories = getJobCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.location || !formData.budget || !formData.completionTime) {
      toast({
        title: "Error",
        description: t('fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      toast({
        title: "Error",
        description: t('invalidBudget'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createJob(
        formData.title,
        formData.description,
        formData.category,
        formData.location,
        budget,
        parseInt(formData.requiredTrustScore),
        formData.completionTime,
        formData.deliveryMethod,
        userAddress,
        75 // Mock user trust score
      );

      toast({
        title: "Success",
        description: t('jobCreated')
      });

      onJobCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create job",
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
          <DialogTitle>{t('createJob')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('jobTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('titlePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">{t('category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as JobCategory })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">{t('location')}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('locationPlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">{t('budget')}</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="100"
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="trustScore">{t('trustScore')}</Label>
            <Input
              id="trustScore"
              type="number"
              value={formData.requiredTrustScore}
              onChange={(e) => setFormData({ ...formData, requiredTrustScore: e.target.value })}
              min="0"
              max="100"
              required
            />
          </div>

          <div>
            <Label htmlFor="completionTime">{t('completionTime')}</Label>
            <Input
              id="completionTime"
              value={formData.completionTime}
              onChange={(e) => setFormData({ ...formData, completionTime: e.target.value })}
              placeholder={t('completionPlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="deliveryMethod">{t('deliveryMethod')}</Label>
            <Select
              value={formData.deliveryMethod}
              onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value as 'remote' | 'in-person' })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">{t('remote')}</SelectItem>
                <SelectItem value="in-person">{t('inPerson')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};