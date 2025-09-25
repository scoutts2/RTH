"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, MessageSquareText, BarChart3, Settings, CheckCircle, X, AlertCircle, XCircle, ChevronDown, ChevronRight, Download } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface PolicyDocument {
  id: string;
  name: string;
  content: string;
  pages: number;
  uploadedAt: Date;
}

interface AuditQuestion {
  id: string;
  number: number;
  text: string;
  reference?: string;
}

interface AnalysisResult {
  id: string;
  questionId: string;
  question: string;
  status: 'Yes' | 'No' | 'Maybe';
  confidence: number;
  citations: Citation[];
  timestamp: Date;
}

interface Citation {
  text: string;
  page: number;
  fileName: string;
  relevanceScore?: number;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ className = '', variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  
  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1 text-sm",
    lg: "h-12 px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Card Component
interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: CardProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: CardProps) {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children }: CardProps) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children }: CardProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

// Progress Component
interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div 
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

// Policy Upload Component
interface PolicyUploadProps {
  onUploadComplete: (policies: PolicyDocument[]) => void;
}

export function PolicyUpload({ onUploadComplete }: PolicyUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<PolicyDocument[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const processFiles = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await fetch('/api/simple?endpoint=upload-policies', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newPolicies = result.policies || [];
        const updatedPolicies = [...uploadedFiles, ...newPolicies];
        setUploadedFiles(updatedPolicies);
        onUploadComplete(updatedPolicies);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (id: string) => {
    const filtered = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(filtered);
    onUploadComplete(filtered);
  };

  return (
    <div className="space-y-4">
      <Card className={`relative cursor-pointer transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300 hover:border-gray-400'
      }`}>
        <div 
          className="p-8 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              Drop your policy documents here
            </p>
            <p className="mt-1 text-sm text-gray-600">
              or click to browse for PDF files
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </Card>

      {uploading && (
        <Card>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading files...</span>
              <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </Card>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Documents ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-600">{file.pages} pages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Question Upload Component
interface QuestionUploadProps {
  onUploadComplete: (questions: AuditQuestion[]) => void;
}

export function QuestionUpload({ onUploadComplete }: QuestionUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedQuestions, setExtractedQuestions] = useState<AuditQuestion[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await fetch('/api/simple?endpoint=upload-questions', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const questions = result.questions || [];
        setExtractedQuestions(questions);
        onUploadComplete(questions);
      }
    } catch (error) {
      console.error('Failed to process file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className={`relative cursor-pointer transition-colors ${
        isDragOver ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 hover:border-gray-400'
      }`}>
        <div 
          className="p-8 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <MessageSquareText className={`mx-auto h-12 w-12 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} />
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              Drop your questions document here
            </p>
            <p className="mt-1 text-sm text-gray-600">
              or click to browse for a PDF file containing audit questions
            </p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </Card>

      {uploading && (
        <Card>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Extracting questions...</span>
              <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </Card>
      )}

      {uploadedFile && extractedQuestions.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-600">
                    {extractedQuestions.length} questions extracted
                  </p>
                </div>
              </div>
            </div>
            
            <h4 className="mb-3 flex items-center space-x-2 font-medium text-gray-900">
              <MessageSquareText className="h-4 w-4" />
              <span>Sample Questions Preview</span>
            </h4>
            <div className="space-y-2">
              {extractedQuestions.slice(0, 3).map((question) => (
                <div key={question.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Q{question.number}:</p>
                  <p className="text-gray-700">{question.text}</p>
                  {question.reference && (
                    <p className="mt-1 text-xs text-gray-500">{question.reference}</p>
                  )}
                </div>
              ))}
              {extractedQuestions.length > 3 && (
                <p className="text-center text-sm text-gray-600">
                  ... and {extractedQuestions.length - 3} more questions
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Analysis Results Component
interface AnalysisResultsProps {
  results: AnalysisResult[];
}

export function AnalysisResults({ results }: AnalysisResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'status' | 'confidence' | 'question'>('status');

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Yes':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'No':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'Maybe':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Yes':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'No':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Maybe':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        const statusOrder = { 'Yes': 0, 'Maybe': 1, 'No': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'confidence':
        return b.confidence - a.confidence;
      case 'question':
        return a.question.localeCompare(b.question);
      default:
        return 0;
    }
  });

  const statusCounts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.Yes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.Maybe || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.No || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Detailed compliance analysis for each audit question
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'status' | 'confidence' | 'question')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="status">Sort by Status</option>
                <option value="confidence">Sort by Confidence</option>
                <option value="question">Sort by Question</option>
              </select>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedResults.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <div
                className="cursor-pointer p-4"
                onClick={() => toggleExpanded(result.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedResults.has(result.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Q{result.questionId}: {result.question}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-medium">{Math.round(result.confidence * 100)}%</p>
                      <p className="text-xs text-gray-500">confidence</p>
                    </div>
                  </div>
                </div>
              </div>

              {expandedResults.has(result.id) && (
                <div className="border-t bg-gray-50 p-4">
                  <h4 className="mb-3 font-medium text-gray-900">Citations & Evidence</h4>
                  <div className="space-y-3">
                    {result.citations.map((citation, index) => (
                      <div key={index} className="rounded-lg bg-white border p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">&quot;{citation.text}&quot;</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>📄 {citation.fileName}</span>
                              <span>📖 Page {citation.page}</span>
                              {citation.relevanceScore && (
                                <span>🎯 {Math.round(citation.relevanceScore * 100)}% relevant</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
