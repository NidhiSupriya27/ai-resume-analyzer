import { useQuery } from '@tanstack/react-query';
import { resumeApi, analysisApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { formatDate } from '../lib/utils';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Trophy,
  Upload,
  TrendingUp,
  ArrowRight,
  BrainCircuit,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: resumesData } = useQuery({
    queryKey: ['resumes', 1, 5],
    queryFn: () => resumeApi.getAll(1, 5),
  });

  const { data: jdsData } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => analysisApi.getJDs(),
  });

  const resumes = resumesData?.data.data || [];
  const jds = jdsData?.data.data || [];
  const totalResumes = resumesData?.data.meta?.total || 0;
  const processedResumes = resumes.filter((r) => r.status === 'PROCESSED').length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Here's an overview of your resume analysis activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Resumes',
            value: totalResumes,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            link: '/resumes',
          },
          {
            label: 'Job Descriptions',
            value: jds.length,
            icon: BrainCircuit,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            link: '/analysis',
          },
          {
            label: 'Analyses Run',
            value: resumes.reduce((sum, r) => sum + (r._count?.analyses || 0), 0),
            icon: BarChart3,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            link: '/analysis',
          },
          {
            label: 'Processed',
            value: processedResumes,
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            link: '/resumes',
          },
        ].map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link}>
            <div className="glass-card p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="text-2xl font-bold mb-0.5">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resumes */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Recent Resumes</h2>
            <Link to="/resumes" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {resumes.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No resumes yet"
              description="Upload resumes to get started with AI analysis"
              action={
                <Link
                  to="/resumes"
                  className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Resume
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <Link key={resume.id} to={`/resumes/${resume.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resume.originalName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(resume.createdAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={resume.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Job Descriptions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Job Descriptions</h2>
            <Link to="/analysis" className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {jds.length === 0 ? (
            <EmptyState
              icon={BrainCircuit}
              title="No job descriptions"
              description="Create a job description to start matching resumes"
              action={
                <Link
                  to="/analysis"
                  className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
                >
                  <BrainCircuit className="w-3.5 h-3.5" /> Create JD
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {jds.slice(0, 5).map((jd) => (
                <Link key={jd.id} to={`/rankings?jd=${jd.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{jd.title}</p>
                      {jd.company && (
                        <p className="text-xs text-muted-foreground truncate">{jd.company}</p>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 glass-card p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/resumes"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload Resumes</p>
              <p className="text-xs text-muted-foreground">Batch or single upload</p>
            </div>
          </Link>
          <Link
            to="/analysis"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Run Analysis</p>
              <p className="text-xs text-muted-foreground">Match resumes to jobs</p>
            </div>
          </Link>
          <Link
            to="/rankings"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">View Rankings</p>
              <p className="text-xs text-muted-foreground">Candidate leaderboard</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
