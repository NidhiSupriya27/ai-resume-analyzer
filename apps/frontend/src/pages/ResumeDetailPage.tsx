import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resumeApi } from '../lib/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkillBadge } from '../components/common/SkillBadge';
import { formatDate, formatFileSize } from '../lib/utils';
import { ArrowLeft, FileText, Loader2, BarChart3 } from 'lucide-react';

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const r = query.state.data?.data.data;
      return r?.status === 'PENDING' || r?.status === 'PROCESSING' ? 3000 : false;
    },
  });

  const resume = data?.data.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Resume not found.</p>
        <Link to="/resumes" className="text-primary text-sm mt-2 inline-block hover:underline">Back to Resumes</Link>
      </div>
    );
  }

  const contactSection = resume.sections?.find((s) => s.type === 'CONTACT');
  const skillsSection = resume.sections?.find((s) => s.type === 'SKILLS');
  const summarySection = resume.sections?.find((s) => s.type === 'SUMMARY');
  const experienceSection = resume.sections?.find((s) => s.type === 'EXPERIENCE');
  const educationSection = resume.sections?.find((s) => s.type === 'EDUCATION');

  const skills = skillsSection?.content?.split(', ').filter(Boolean) || [];

  let experience: Array<{ company: string; title: string; startDate: string; endDate: string; description: string }> = [];
  let education: Array<{ institution: string; degree: string; field: string; startDate: string; endDate: string }> = [];

  try { experience = JSON.parse(experienceSection?.content || '[]'); } catch {}
  try { education = JSON.parse(educationSection?.content || '[]'); } catch {}

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/resumes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Resumes
      </Link>

      {/* Header */}
      <div className="glass-card p-6 mb-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1">{resume.originalName}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatFileSize(resume.fileSize)}</span>
                <span>Uploaded {formatDate(resume.createdAt)}</span>
              </div>
            </div>
            <StatusBadge status={resume.status} />
          </div>
        </div>
      </div>

      {resume.status === 'PROCESSING' || resume.status === 'PENDING' ? (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-medium">Processing resume…</p>
          <p className="text-sm text-muted-foreground mt-1">AI is extracting and parsing content</p>
        </div>
      ) : resume.status === 'FAILED' ? (
        <div className="glass-card p-12 text-center">
          <p className="text-destructive font-medium">Processing failed</p>
          <p className="text-sm text-muted-foreground mt-1">Unable to extract text from this file</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            {contactSection && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Contact Information</h2>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{contactSection.content}</div>
              </div>
            )}

            {/* Summary */}
            {summarySection?.content && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Professional Summary</h2>
                <p className="text-sm leading-relaxed">{summarySection.content}</p>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Work Experience</h2>
                <div className="space-y-5">
                  {experience.map((exp, i) => (
                    <div key={i} className="relative pl-4 border-l-2 border-primary/20">
                      <h3 className="font-medium text-sm">{exp.title}</h3>
                      <p className="text-sm text-primary">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mb-2">{exp.startDate} – {exp.endDate}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Education</h2>
                <div className="space-y-4">
                  {education.map((edu, i) => (
                    <div key={i} className="relative pl-4 border-l-2 border-accent/20">
                      <h3 className="font-medium text-sm">{edu.degree} in {edu.field}</h3>
                      <p className="text-sm text-accent">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">{edu.startDate} – {edu.endDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Skills */}
            {skills.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => <SkillBadge key={s} skill={s} variant="neutral" />)}
                </div>
              </div>
            )}

            {/* Analyses */}
            {(resume as { analyses?: Array<{ id: string; jobDescription?: { title: string }; overallScore: number; createdAt: string }> }).analyses && (resume as { analyses?: Array<{ id: string; jobDescription?: { title: string }; overallScore: number; createdAt: string }> }).analyses!.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Past Analyses</h2>
                <div className="space-y-2">
                  {(resume as { analyses?: Array<{ id: string; jobDescription?: { title: string }; overallScore: number; createdAt: string }> }).analyses!.map((a) => (
                    <Link
                      key={a.id}
                      to={`/analysis/${a.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group"
                    >
                      <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.jobDescription?.title || 'Analysis'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{Math.round(a.overallScore)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
