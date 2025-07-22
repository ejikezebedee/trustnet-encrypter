import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, DollarSign, Star, Users, CheckCircle, XCircle } from 'lucide-react';
import { Job, JobApplication, JobStatus, ApplicationStatus } from '@/lib/web3/marketplace/types';
import { getUserJobHistory, getJobStatusColor, acceptApplication } from '@/lib/web3/marketplace/core';
import { UserTrustIndicator } from '@/components/messaging/UserTrustIndicator';
import { useToast } from '@/hooks/use-toast';

interface MyJobsDashboardProps {
  language: string;
  userAddress: string;
}

export const MyJobsDashboard: React.FC<MyJobsDashboardProps> = ({ language, userAddress }) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const translations = {
    en: {
      postedJobs: 'Posted Jobs',
      appliedJobs: 'Applied Jobs',
      noJobsPosted: 'No jobs posted yet',
      noJobsApplied: 'No jobs applied to yet',
      applicants: 'Applicants',
      viewApplication: 'View Application',
      accept: 'Accept',
      reject: 'Reject',
      accepted: 'Accepted',
      rejected: 'Rejected',
      pending: 'Pending',
      applicationMessage: 'Application Message',
      trustScore: 'Trust Score',
      appliedOn: 'Applied on',
      status: 'Status'
    },
    es: {
      postedJobs: 'Trabajos Publicados',
      appliedJobs: 'Trabajos Aplicados',
      noJobsPosted: 'Aún no se han publicado trabajos',
      noJobsApplied: 'Aún no se ha aplicado a trabajos',
      applicants: 'Aplicantes',
      viewApplication: 'Ver Aplicación',
      accept: 'Aceptar',
      reject: 'Rechazar',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      pending: 'Pendiente',
      applicationMessage: 'Mensaje de Aplicación',
      trustScore: 'Puntuación de Confianza',
      appliedOn: 'Aplicado el',
      status: 'Estado'
    },
    sw: {
      postedJobs: 'Kazi Zilizochapishwa',
      appliedJobs: 'Kazi Zilizoombwa',
      noJobsPosted: 'Hakuna kazi zilizochapishwa bado',
      noJobsApplied: 'Hakuna kazi zilizoombwa bado',
      applicants: 'Waombaji',
      viewApplication: 'Ona Maombi',
      accept: 'Kubali',
      reject: 'Kataa',
      accepted: 'Imekubaliwa',
      rejected: 'Imekataliwa',
      pending: 'Inasubiri',
      applicationMessage: 'Ujumbe wa Maombi',
      trustScore: 'Alama ya Uaminifu',
      appliedOn: 'Aliomba tarehe',
      status: 'Hali'
    },
    ig: {
      postedJobs: 'Ọrụ Ebipụtara',
      appliedJobs: 'Ọrụ Etinyere Akwụkwọ',
      noJobsPosted: 'Ebipụtabeghị ọrụ ọ bụla',
      noJobsApplied: 'Etinyebeghị akwụkwọ maka ọrụ ọ bụla',
      applicants: 'Ndị Na-achọ',
      viewApplication: 'Lee Ntinye Akwụkwọ',
      accept: 'Nabata',
      reject: 'Jụ',
      accepted: 'Anabatala',
      rejected: 'Ajụla',
      pending: 'Na-echere',
      applicationMessage: 'Ozi Ntinye Akwụkwọ',
      trustScore: 'Akara Ntụkwasị Obi',
      appliedOn: 'Tinyere akwụkwọ na',
      status: 'Ọnọdụ'
    },
    hi: {
      postedJobs: 'पोस्ट की गई नौकरियां',
      appliedJobs: 'आवेदन की गई नौकरियां',
      noJobsPosted: 'अभी तक कोई नौकरी पोस्ट नहीं की गई',
      noJobsApplied: 'अभी तक किसी नौकरी के लिए आवेदन नहीं किया गया',
      applicants: 'आवेदक',
      viewApplication: 'आवेदन देखें',
      accept: 'स्वीकार करें',
      reject: 'अस्वीकार करें',
      accepted: 'स्वीकृत',
      rejected: 'अस्वीकृत',
      pending: 'लंबित',
      applicationMessage: 'आवेदन संदेश',
      trustScore: 'ट्रस्ट स्कोर',
      appliedOn: 'आवेदन दिया गया',
      status: 'स्थिति'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en];

  useEffect(() => {
    loadJobs();
  }, [userAddress]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const userJobs = await getUserJobHistory(userAddress);
      setJobs(userJobs);
    } catch (error) {
      console.error('Error loading user jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const postedJobs = jobs.filter(job => job.posterAddress === userAddress);
  const appliedJobs = jobs.filter(job => job.selectedApplicant === userAddress || job.applicants.some(app => app.applicantAddress === userAddress));

  const handleAcceptApplication = async (jobId: string, applicationId: string) => {
    try {
      await acceptApplication(jobId, applicationId, userAddress);
      toast({
        title: "Success",
        description: "Application accepted successfully!"
      });
      loadJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept application",
        variant: "destructive"
      });
    }
  };

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN: return 'Open';
      case JobStatus.IN_PROGRESS: return 'In Progress';
      case JobStatus.DELIVERED: return 'Delivered';
      case JobStatus.COMPLETED: return 'Completed';
      case JobStatus.DISPUTED: return 'Disputed';
      case JobStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  };

  const getApplicationStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING: return t('pending');
      case ApplicationStatus.ACCEPTED: return t('accepted');
      case ApplicationStatus.REJECTED: return t('rejected');
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="posted" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posted">{t('postedJobs')} ({postedJobs.length})</TabsTrigger>
          <TabsTrigger value="applied">{t('appliedJobs')} ({appliedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posted" className="mt-4">
          {postedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noJobsPosted')}
            </div>
          ) : (
            <div className="space-y-4">
              {postedJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                      </div>
                      <Badge className={getJobStatusColor(job.status)}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{job.budget} {job.currency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{job.applicants.length} {t('applicants')}</span>
                      </div>
                    </div>

                    {job.applicants.length > 0 && job.status === JobStatus.OPEN && (
                      <div className="space-y-3">
                        <h4 className="font-medium">{t('applicants')}</h4>
                        {job.applicants.map((application) => (
                          <div key={application.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <UserTrustIndicator
                                  trustScore={application.applicantTrustScore}
                                  trustBadge={application.applicantTrustBadge as any}
                                  isVerified={application.applicantTrustScore > 70}
                                  size="sm"
                                  language={language}
                                />
                                <span className="text-sm font-medium">
                                  {application.applicantAddress.slice(0, 6)}...{application.applicantAddress.slice(-4)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {application.status === ApplicationStatus.PENDING && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAcceptApplication(job.id, application.id)}
                                      className="gap-1"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      {t('accept')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      {t('reject')}
                                    </Button>
                                  </>
                                )}
                                {application.status !== ApplicationStatus.PENDING && (
                                  <Badge variant={application.status === ApplicationStatus.ACCEPTED ? "default" : "destructive"}>
                                    {getApplicationStatusText(application.status)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {application.message && (
                              <p className="text-sm text-muted-foreground">
                                "{application.message}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied" className="mt-4">
          {appliedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noJobsApplied')}
            </div>
          ) : (
            <div className="space-y-4">
              {appliedJobs.map((job) => {
                const userApplication = job.applicants.find(app => app.applicantAddress === userAddress);
                return (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getJobStatusColor(job.status)}>
                            {getStatusText(job.status)}
                          </Badge>
                          {userApplication && (
                            <Badge variant="outline" className="ml-2">
                              {getApplicationStatusText(userApplication.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{job.budget} {job.currency}</span>
                        </div>
                        {userApplication && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{t('appliedOn')} {userApplication.appliedAt.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};