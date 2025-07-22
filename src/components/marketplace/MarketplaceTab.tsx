import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, MapPin, Clock, DollarSign, Star } from 'lucide-react';
import { Job, JobFilter, JobCategory } from '@/lib/web3/marketplace/types';
import { getJobs, getJobCategories } from '@/lib/web3/marketplace/core';
import { JobCard } from './JobCard';
import { CreateJobModal } from './CreateJobModal';
import { JobFilters } from './JobFilters';
import { MyJobsDashboard } from './MyJobsDashboard';
import { useWallet } from '@/contexts/WalletContext';

interface MarketplaceTabProps {
  language: string;
}

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ language }) => {
  const { wallet } = useWallet();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [currentFilter, setCurrentFilter] = useState<JobFilter>({});

  const translations = {
    en: {
      marketplace: 'Marketplace',
      postJob: 'Post a Job',
      findJobs: 'Find Jobs',
      myJobs: 'My Jobs',
      browse: 'Browse Jobs',
      filters: 'Filters',
      search: 'Search jobs...',
      noJobs: 'No jobs found',
      tryDifferentFilters: 'Try adjusting your filters',
      location: 'Location',
      budget: 'Budget',
      trustScore: 'Trust Score',
      category: 'Category',
      deadline: 'Deadline',
      jobsFound: 'jobs found'
    },
    es: {
      marketplace: 'Mercado',
      postJob: 'Publicar Trabajo',
      findJobs: 'Buscar Trabajos',
      myJobs: 'Mis Trabajos',
      browse: 'Explorar Trabajos',
      filters: 'Filtros',
      search: 'Buscar trabajos...',
      noJobs: 'No se encontraron trabajos',
      tryDifferentFilters: 'Intenta ajustar tus filtros',
      location: 'Ubicación',
      budget: 'Presupuesto',
      trustScore: 'Puntuación de Confianza',
      category: 'Categoría',
      deadline: 'Fecha límite',
      jobsFound: 'trabajos encontrados'
    },
    sw: {
      marketplace: 'Soko',
      postJob: 'Chapisha Kazi',
      findJobs: 'Tafuta Kazi',
      myJobs: 'Kazi Zangu',
      browse: 'Chunguza Kazi',
      filters: 'Vichungi',
      search: 'Tafuta kazi...',
      noJobs: 'Hakuna kazi zilizopatikana',
      tryDifferentFilters: 'Jaribu kubadilisha vichungi vyako',
      location: 'Mahali',
      budget: 'Bajeti',
      trustScore: 'Alama ya Uaminifu',
      category: 'Aina',
      deadline: 'Muda wa mwisho',
      jobsFound: 'kazi zilizopatikana'
    },
    ig: {
      marketplace: 'Ahịa',
      postJob: 'Bipụta Ọrụ',
      findJobs: 'Chọọ Ọrụ',
      myJobs: 'Ọrụ M',
      browse: 'Nyochaa Ọrụ',
      filters: 'Nzacha',
      search: 'Chọọ ọrụ...',
      noJobs: 'Ọ dịghị ọrụ achọtara',
      tryDifferentFilters: 'Gbalịa ịgbanwe nzacha gị',
      location: 'Ebe',
      budget: 'Ego',
      trustScore: 'Akara Ntụkwasị Obi',
      category: 'Ụdị',
      deadline: 'Oge ikpeazụ',
      jobsFound: 'ọrụ achọtara'
    },
    hi: {
      marketplace: 'बाज़ार',
      postJob: 'नौकरी पोस्ट करें',
      findJobs: 'नौकरी खोजें',
      myJobs: 'मेरी नौकरियां',
      browse: 'नौकरियां ब्राउज़ करें',
      filters: 'फ़िल्टर',
      search: 'नौकरियां खोजें...',
      noJobs: 'कोई नौकरी नहीं मिली',
      tryDifferentFilters: 'अपने फ़िल्टर समायोजित करने का प्रयास करें',
      location: 'स्थान',
      budget: 'बजट',
      trustScore: 'ट्रस्ट स्कोर',
      category: 'श्रेणी',
      deadline: 'समय सीमा',
      jobsFound: 'नौकरियां मिलीं'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, currentFilter]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const allJobs = await getJobs();
      setJobs(allJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (currentFilter.category) {
      filtered = filtered.filter(job => job.category === currentFilter.category);
    }
    if (currentFilter.minBudget !== undefined) {
      filtered = filtered.filter(job => job.budget >= currentFilter.minBudget!);
    }
    if (currentFilter.maxBudget !== undefined) {
      filtered = filtered.filter(job => job.budget <= currentFilter.maxBudget!);
    }
    if (currentFilter.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(currentFilter.location!.toLowerCase())
      );
    }
    if (currentFilter.deliveryMethod) {
      filtered = filtered.filter(job => job.deliveryMethod === currentFilter.deliveryMethod);
    }

    setFilteredJobs(filtered);
  };

  const handleJobCreated = () => {
    setShowCreateJob(false);
    loadJobs();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold text-foreground">{t('marketplace')}</h1>
        <Button onClick={() => setShowCreateJob(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('postJob')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="browse">{t('browse')}</TabsTrigger>
          <TabsTrigger value="myJobs">{t('myJobs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="flex-1 flex flex-col mt-4">
          <div className="flex items-center gap-2 px-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-foreground"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (searchTerm) {
                    const filtered = jobs.filter(job =>
                      job.title.toLowerCase().includes(searchTerm) ||
                      job.description.toLowerCase().includes(searchTerm) ||
                      job.category.toLowerCase().includes(searchTerm)
                    );
                    setFilteredJobs(filtered);
                  } else {
                    applyFilters();
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('filters')}
            </Button>
          </div>

          {showFilters && (
            <div className="px-4 mb-4">
              <JobFilters
                filter={currentFilter}
                onFilterChange={setCurrentFilter}
                language={language}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4">
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredJobs.length} {t('jobsFound')}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">{t('noJobs')}</div>
                <div className="text-sm text-muted-foreground">{t('tryDifferentFilters')}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    language={language}
                    onJobUpdate={loadJobs}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="myJobs" className="flex-1 mt-4">
          <MyJobsDashboard language={language} userAddress={wallet?.address || ''} />
        </TabsContent>
      </Tabs>

      {showCreateJob && (
        <CreateJobModal
          isOpen={showCreateJob}
          onClose={() => setShowCreateJob(false)}
          onJobCreated={handleJobCreated}
          language={language}
          userAddress={wallet?.address || ''}
        />
      )}
    </div>
  );
};