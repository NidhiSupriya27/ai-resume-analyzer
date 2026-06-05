import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { resumeApi, Resume } from '../lib/api';
import { formatFileSize, formatDate } from '../lib/utils';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadingFile {
  file: File;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['resumes', page, limit],
    queryFn: () => resumeApi.getAll(page, limit),
    refetchInterval: (query) => {
      const resumes = query.state.data?.data.data || [];
      const hasProcessing = resumes.some((r) => r.status === 'PENDING' || r.status === 'PROCESSING');
      return hasProcessing ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const resumes = data?.data.data || [];
  const meta = data?.data.meta;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const newItems: UploadingFile[] = files.map((f) => ({ file: f, status: 'uploading' }));
      setUploadQueue((prev) => [...prev, ...newItems]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          await resumeApi.upload(file);
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === prev.length - files.length + i ? { ...item, status: 'done' } : item
            )
          );
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } };
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === prev.length - files.length + i
                ? { ...item, status: 'error', error: error.response?.data?.message || 'Upload failed' }
                : item
            )
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setTimeout(() => setUploadQueue([]), 3000);
    },
    [queryClient]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Resume Library</h1>
        <p className="text-muted-foreground text-sm">Upload and manage candidate resumes</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-all', isDragActive ? 'bg-primary/20' : 'bg-muted')}>
            <Upload className={cn('w-5 h-5', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-medium text-sm">
              {isDragActive ? 'Drop files here...' : 'Drop resumes here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF & DOCX — up to 10MB each — multiple files OK</p>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="mb-6 space-y-2">
          {uploadQueue.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border text-sm">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 truncate">{item.file.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</span>
              {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {item.status === 'error' && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> {item.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes uploaded"
            description="Drop files above or click to upload your first resumes"
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">File</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Analyses</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Uploaded</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resumes.map((resume: Resume) => (
                  <tr key={resume.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/resumes/${resume.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors truncate max-w-[200px]">
                          {resume.originalName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{formatFileSize(resume.fileSize)}</td>
                    <td className="px-5 py-4"><StatusBadge status={resume.status} /></td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{resume._count?.analyses || 0}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(resume.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteMutation.mutate(resume.id)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of {meta.total} resumes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm px-3">
                    {page} / {meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
