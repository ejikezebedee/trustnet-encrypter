import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { JobFilter, JobCategory } from '@/lib/web3/marketplace/types';
import { getJobCategories } from '@/lib/web3/marketplace/core';

interface JobFiltersProps {
  filter: JobFilter;
  onFilterChange: (filter: JobFilter) => void;
  language: string;
}

export const JobFilters: React.FC<JobFiltersProps> = ({ filter, onFilterChange, language }) => {
  const translations = {
    en: {
      category: 'Category',
      allCategories: 'All Categories',
      location: 'Location',
      budgetRange: 'Budget Range',
      minBudget: 'Min',
      maxBudget: 'Max',
      trustScore: 'Trust Score Range',
      minTrustScore: 'Min',
      maxTrustScore: 'Max',
      deliveryMethod: 'Delivery Method',
      allMethods: 'All Methods',
      remote: 'Remote',
      inPerson: 'In Person',
      clearFilters: 'Clear All'
    },
    es: {
      category: 'Categoría',
      allCategories: 'Todas las Categorías',
      location: 'Ubicación',
      budgetRange: 'Rango de Presupuesto',
      minBudget: 'Mín',
      maxBudget: 'Máx',
      trustScore: 'Rango de Puntuación de Confianza',
      minTrustScore: 'Mín',
      maxTrustScore: 'Máx',
      deliveryMethod: 'Método de Entrega',
      allMethods: 'Todos los Métodos',
      remote: 'Remoto',
      inPerson: 'En Persona',
      clearFilters: 'Limpiar Todo'
    },
    sw: {
      category: 'Aina',
      allCategories: 'Aina Zote',
      location: 'Mahali',
      budgetRange: 'Mfululizo wa Bajeti',
      minBudget: 'Chini',
      maxBudget: 'Juu',
      trustScore: 'Mfululizo wa Alama ya Uaminifu',
      minTrustScore: 'Chini',
      maxTrustScore: 'Juu',
      deliveryMethod: 'Njia ya Utoaji',
      allMethods: 'Njia Zote',
      remote: 'Kwa Mbali',
      inPerson: 'Kibinafsi',
      clearFilters: 'Futa Vyote'
    },
    ig: {
      category: 'Ụdị',
      allCategories: 'Ụdị Niile',
      location: 'Ebe',
      budgetRange: 'Oke Ego',
      minBudget: 'Kacha Nta',
      maxBudget: 'Kacha Ukwuu',
      trustScore: 'Oke Akara Ntụkwasị Obi',
      minTrustScore: 'Kacha Nta',
      maxTrustScore: 'Kacha Ukwuu',
      deliveryMethod: 'Ụzọ Nnyefe',
      allMethods: 'Ụzọ Niile',
      remote: 'Site n\'ebe Dị Anya',
      inPerson: 'N\'onwe Onye',
      clearFilters: 'Hichapụ Niile'
    },
    hi: {
      category: 'श्रेणी',
      allCategories: 'सभी श्रेणियां',
      location: 'स्थान',
      budgetRange: 'बजट रेंज',
      minBudget: 'न्यूनतम',
      maxBudget: 'अधिकतम',
      trustScore: 'ट्रस्ट स्कोर रेंज',
      minTrustScore: 'न्यूनतम',
      maxTrustScore: 'अधिकतम',
      deliveryMethod: 'डिलीवरी विधि',
      allMethods: 'सभी विधियां',
      remote: 'दूरस्थ',
      inPerson: 'व्यक्तिगत रूप से',
      clearFilters: 'सभी साफ़ करें'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  const categories = getJobCategories();

  const updateFilter = (updates: Partial<JobFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium">{t('category')}</Label>
            <Select
              value={filter.category || ''}
              onValueChange={(value) => updateFilter({ category: value as JobCategory || undefined })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('location')}</Label>
            <Input
              className="mt-1"
              value={filter.location || ''}
              onChange={(e) => updateFilter({ location: e.target.value || undefined })}
              placeholder={t('location')}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">{t('budgetRange')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                placeholder={t('minBudget')}
                value={filter.minBudget || ''}
                onChange={(e) => updateFilter({ minBudget: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                type="number"
                placeholder={t('maxBudget')}
                value={filter.maxBudget || ''}
                onChange={(e) => updateFilter({ maxBudget: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('deliveryMethod')}</Label>
            <Select
              value={filter.deliveryMethod || ''}
              onValueChange={(value) => updateFilter({ deliveryMethod: value as 'in-person' | 'remote' || undefined })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('allMethods')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('allMethods')}</SelectItem>
                <SelectItem value="remote">{t('remote')}</SelectItem>
                <SelectItem value="in-person">{t('inPerson')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            {t('clearFilters')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};