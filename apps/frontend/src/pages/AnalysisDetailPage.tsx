import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../lib/api';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SkillBadge } from '../components/common/SkillBadge';
import { formatDate } from '../lib/utils';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Lightbulb,
  MessageSquare,
  Star,
  AlertTriangle,
  BookOpen,
  Cpu,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => analysisApi.getAnalysis(id!),
    enabled: !!id,
  });

  const analysis = data?.data.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Link to="/rankings" className="text-primary text-sm mt-2 inline-block hover:underline">
          Back to Rankings
        </Link>
      </div>
    );
  }

  const radarData = [
    { subject: 'Skills', score: analysis.skillsScore },
    { subject: 'Experience', score: analysis.experienceScore },
    { subject: 'Education', score: analysis.educationScore },
    { subject: 'Semantic', score: analysis.semanticScore },
  ];

  const scoreCards = [
    { label: 'Skills', score: analysis.skillsScore, icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Experience', score: analysis.experienceScore, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Education', score: analysis.educationScore, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Semantic Match', score: analysis.semanticScore, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <Link to="/rankings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Rankings
      </Link>

      {/* Header */}
      <div className="glass-card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ScoreGauge score={Math.round(analysis.overallScore)} size="lg" label="Overall Score" animate />
        <div className="flex-1">
          <h1 className="text-xl font-bold mb-1">
            {analysis.resume?.originalName?.replace(/\.[^.]+$/, '') || 'Candidate Analysis'}
          </h1>
          <p className="text-sm text-muted-foreground mb-1">
            Position: <span className="text-foreground font-medium">{analysis.jobDescription?.title}</span>
            {analysis.jobDescription?.company && ` @ ${analysis.jobDescription.company}`}
          </p>
          <p className="text-xs text-muted-foreground">Analyzed {formatDate(analysis.createdAt)}</p>
          {analysis.rank && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium">
              <Star className="w-3 h-3" />
              Ranked #{analysis.rank}
            </div>
          )}
        </div>
        {analysis.detailedReport?.overallAssessment && (
          <div className="flex-1 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground leading-relaxed max-w-sm hidden lg:block">
            {analysis.detailedReport.overallAssessment}
          </div>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {scoreCards.map(({ label, score, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold">{Math.round(score)}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Analysis */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-5">Skills Analysis</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-medium">Matched Skills ({analysis.matchedSkills.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedSkills.length > 0
                    ? analysis.matchedSkills.map((s) => <SkillBadge key={s} skill={s} variant="matched" />)
                    : <p className="text-xs text-muted-foreground">No matched skills</p>}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-medium">Missing Skills ({analysis.missingSkills.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills.length > 0
                    ? analysis.missingSkills.map((s) => <SkillBadge key={s} skill={s} variant="missing" />)
                    : <p className="text-xs text-muted-foreground">No missing skills</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-5">Strengths & Weaknesses</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-sm font-medium">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Weaknesses</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h2 className="font-semibold">Improvement Suggestions</h2>
            </div>
            <ul className="space-y-3">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Interview Notes */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Interview Readiness Notes</h2>
            </div>
            <ul className="space-y-2">
              {analysis.interviewNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Radar Chart */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4">Score Radar</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Reports */}
          {analysis.detailedReport && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold">Detailed Analysis</h2>
              {[
                { key: 'skillsAnalysis', label: 'Skills', icon: Cpu },
                { key: 'experienceAnalysis', label: 'Experience', icon: TrendingUp },
                { key: 'educationAnalysis', label: 'Education', icon: GraduationCap },
              ].map(({ key, label, icon: Icon }) => {
                const content = analysis.detailedReport?.[key as keyof typeof analysis.detailedReport];
                if (!content) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
