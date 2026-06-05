import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resumeApi, analysisApi, JobDescription, Resume } from '../lib/api';
import { formatDate } from '../lib/utils';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BrainCircuit,
  Plus,
  X,
  Loader2,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const jdSchema = z.object({
  title: z.string().min(2, 'Title required'),
  company: z.string().optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  skills: z.string().optional(),
});
type JDFormData = z.infer<typeof jdSchema>;

export default function AnalysisPage() {
  const queryClient = useQueryClient();
  const [showJDForm, setShowJDForm] = useState(false);
  const [selectedJD, setSelectedJD] = useState<string | null>(null);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [expandedJD, setExpandedJD] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ successful: number; failed: number } | null>(null);

  const { data: jdsData, isLoading: jdsLoading } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => analysisApi.getJDs(),
  });

  const { data: resumesData } = useQuery({
    queryKey: ['resumes', 1, 100],
    queryFn: () => resumeApi.getAll(1, 100),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JDFormData>({
    resolver: zodResolver(jdSchema),
  });

  const createJDMutation = useMutation({
    mutationFn: (data: JDFormData) =>
      analysisApi.createJD({
        title: data.title,
        company: data.company,
        description: data.description,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-descriptions'] });
      reset();
      setShowJDForm(false);
    },
  });

  const runAnalysisMutation = useMutation({
    mutationFn: () =>
      analysisApi.runAnalysis({ resumeIds: selectedResumes, jobDescriptionId: selectedJD! }),
    onSuccess: (res) => {
      const result = res.data.data as { successful: unknown[]; failed: unknown[] };
      setAnalysisResult({ successful: result.successful.length, failed: result.failed.length });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      setSelectedResumes([]);
    },
  });

  const jds: JobDescription[] = jdsData?.data.data || [];
  const resumes: Resume[] = (resumesData?.data.data || []).filter((r) => r.status === 'PROCESSED');

  const toggleResume = (id: string) => {
    setSelectedResumes((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">AI Analysis</h1>
          <p className="text-muted-foreground text-sm">Create job descriptions and run semantic resume matching</p>
        </div>
        <button
          onClick={() => setShowJDForm(!showJDForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Job Description
        </button>
      </div>

      {/* JD Creation Form */}
      {showJDForm && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">New Job Description</h2>
            <button onClick={() => setShowJDForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit((d) => createJDMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Job Title *</label>
                <input
                  {...register('title')}
                  placeholder="Senior Frontend Engineer"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Company</label>
                <input
                  {...register('company')}
                  placeholder="Acme Corp (optional)"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Job Description *</label>
              <textarea
                {...register('description')}
                rows={6}
                placeholder="Paste the full job description here. Include responsibilities, requirements, and qualifications..."
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Required Skills (comma-separated)</label>
              <input
                {...register('skills')}
                placeholder="React, TypeScript, Node.js, PostgreSQL"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createJDMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {createJDMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Job Description
              </button>
              <button type="button" onClick={() => { reset(); setShowJDForm(false); }}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Analysis Success */}
      {analysisResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Analysis Complete — {analysisResult.successful} succeeded, {analysisResult.failed} failed
            </p>
            <Link to="/rankings" className="text-xs text-green-700 dark:text-green-400 underline mt-0.5 inline-block">
              View Rankings →
            </Link>
          </div>
          <button onClick={() => setAnalysisResult(null)} className="ml-auto text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Descriptions List */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4">Job Descriptions</h2>
          {jdsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : jds.length === 0 ? (
            <EmptyState
              icon={BrainCircuit}
              title="No job descriptions yet"
              description="Create your first job description to start matching resumes"
            />
          ) : (
            <div className="space-y-3">
              {jds.map((jd) => (
                <div
                  key={jd.id}
                  className={cn(
                    'glass-card overflow-hidden transition-all',
                    selectedJD === jd.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="p-4 flex items-start gap-3">
                    <button
                      onClick={() => setSelectedJD(selectedJD === jd.id ? null : jd.id)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all',
                        selectedJD === jd.id
                          ? 'border-primary bg-primary'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {selectedJD === jd.id && (
                        <span className="block w-full h-full rounded-full bg-white scale-[0.4]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{jd.title}</h3>
                          {jd.company && <p className="text-xs text-muted-foreground">{jd.company}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{formatDate(jd.createdAt)}</span>
                          <button
                            onClick={() => setExpandedJD(expandedJD === jd.id ? null : jd.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedJD === jd.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {jd.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {jd.skills.slice(0, 6).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-secondary text-xs">{s}</span>
                          ))}
                          {jd.skills.length > 6 && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
                              +{jd.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedJD === jd.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-border">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {jd.description}
                      </p>
                      <Link
                        to={`/rankings?jd=${jd.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
                      >
                        <BarChart3 className="w-3 h-3" /> View Rankings
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Run Analysis Panel */}
        <div>
          <h2 className="font-semibold mb-4">Run Analysis</h2>
          <div className="glass-card p-5 sticky top-6">
            {!selectedJD ? (
              <div className="text-center py-6">
                <BrainCircuit className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a job description to start</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  Select processed resumes to analyze against the selected JD
                </p>

                {resumes.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No processed resumes available</p>
                    <Link to="/resumes" className="text-xs text-primary mt-1 inline-block hover:underline">
                      Upload resumes first
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                      <button
                        onClick={() =>
                          setSelectedResumes(
                            selectedResumes.length === resumes.length ? [] : resumes.map((r) => r.id)
                          )
                        }
                        className="text-xs text-primary hover:underline mb-1"
                      >
                        {selectedResumes.length === resumes.length ? 'Deselect All' : 'Select All'}
                      </button>
                      {resumes.map((resume) => (
                        <label
                          key={resume.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedResumes.includes(resume.id)}
                            onChange={() => toggleResume(resume.id)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{resume.originalName}</p>
                            <StatusBadge status={resume.status} />
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => runAnalysisMutation.mutate()}
                      disabled={selectedResumes.length === 0 || runAnalysisMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {runAnalysisMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                      ) : (
                        <><Play className="w-4 h-4" /> Analyze {selectedResumes.length} Resume{selectedResumes.length !== 1 && 's'}</>
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
