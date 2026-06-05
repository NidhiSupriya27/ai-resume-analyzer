import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { analysisApi, Analysis, JobDescription } from '../lib/api';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SkillBadge } from '../components/common/SkillBadge';
import { EmptyState } from '../components/common/EmptyState';
import { getScoreBg, formatDate } from '../lib/utils';
import {
  Trophy,
  Medal,
  ChevronDown,
  Loader2,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function RankingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJD = searchParams.get('jd') || '';
  const [selectedJD, setSelectedJD] = useState(initialJD);

  const { data: jdsData } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: () => analysisApi.getJDs(),
  });

  const { data: rankingsData, isLoading } = useQuery({
    queryKey: ['rankings', selectedJD],
    queryFn: () => analysisApi.getRankings(selectedJD),
    enabled: !!selectedJD,
  });

  const jds: JobDescription[] = jdsData?.data.data || [];
  const rankings: Analysis[] = rankingsData?.data.data || [];

  const handleJDChange = (id: string) => {
    setSelectedJD(id);
    setSearchParams(id ? { jd: id } : {});
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm font-mono text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Candidate Rankings</h1>
        <p className="text-muted-foreground text-sm">
          AI-ranked candidates based on semantic similarity and section scoring
        </p>
      </div>

      {/* JD Selector */}
      <div className="glass-card p-4 mb-6 flex items-center gap-4">
        <label className="text-sm font-medium whitespace-nowrap">Job Description:</label>
        <div className="relative flex-1 max-w-sm">
          <select
            value={selectedJD}
            onChange={(e) => handleJDChange(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">-- Select a job description --</option>
            {jds.map((jd) => (
              <option key={jd.id} value={jd.id}>
                {jd.title}{jd.company ? ` @ ${jd.company}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        {selectedJD && (
          <Link
            to={`/analysis`}
            className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
          >
            Run new analysis <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {!selectedJD ? (
        <EmptyState
          icon={Trophy}
          title="Select a job description"
          description="Choose a job description above to see candidate rankings"
        />
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rankings.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analyses yet"
          description="Run an analysis for this job description to see rankings"
          action={
            <Link to="/analysis" className="text-sm text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all">
              Run Analysis
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2 text-center">Overall</div>
            <div className="col-span-5">Score Breakdown</div>
            <div className="col-span-1">Details</div>
          </div>

          {rankings.map((analysis, idx) => {
            const rank = analysis.rank ?? idx + 1;
            return (
              <div
                key={analysis.id}
                className={cn(
                  'glass-card p-4 grid grid-cols-12 gap-4 items-center transition-all hover:shadow-md',
                  rank === 1 && 'ring-2 ring-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-900/10',
                  rank === 2 && 'ring-1 ring-slate-300/50',
                  rank === 3 && 'ring-1 ring-amber-300/50'
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  {rankIcon(rank)}
                </div>

                {/* Candidate */}
                <div className="col-span-3">
                  <p className="text-sm font-medium truncate">
                    {analysis.resume?.originalName?.replace(/\.[^.]+$/, '') || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(analysis.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {analysis.matchedSkills.slice(0, 3).map((s) => (
                      <SkillBadge key={s} skill={s} variant="matched" size="sm" />
                    ))}
                    {analysis.matchedSkills.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{analysis.matchedSkills.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Overall Score */}
                <div className="col-span-2 flex justify-center">
                  <ScoreGauge score={Math.round(analysis.overallScore)} size="sm" />
                </div>

                {/* Score Breakdown */}
                <div className="col-span-5 space-y-2">
                  {[
                    { label: 'Skills', score: analysis.skillsScore },
                    { label: 'Experience', score: analysis.experienceScore },
                    { label: 'Education', score: analysis.educationScore },
                    { label: 'Semantic', score: analysis.semanticScore },
                  ].map(({ label, score }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${score}%`,
                            backgroundColor:
                              score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className={cn('text-xs font-medium w-8 text-right', getScoreBg(Math.round(score)).split(' ')[1])}>
                        {Math.round(score)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Details Link */}
                <div className="col-span-1 flex justify-end">
                  <Link
                    to={`/analysis/${analysis.id}`}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    title="View full analysis"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
