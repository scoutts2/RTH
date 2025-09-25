"use client";

import { useState } from "react";
import { Upload, FileText, MessageSquareText, BarChart3, Settings } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, PolicyUpload, QuestionUpload, AnalysisResults } from "../components";

// Types (simplified from separate file)
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
  citations: Array<{
    text: string;
    page: number;
    fileName: string;
    relevanceScore?: number;
  }>;
  timestamp: Date;
}

export default function ReadilyProfessional() {
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'results'>('upload');
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [questions, setQuestions] = useState<AuditQuestion[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const tabs = [
    { id: 'upload', label: 'Upload Documents', icon: Upload },
    { id: 'analysis', label: 'Run Analysis', icon: MessageSquareText },
    { id: 'results', label: 'View Results', icon: BarChart3 },
  ];

  // Handle policy upload
  const handlePolicyUpload = (uploadedPolicies: PolicyDocument[]) => {
    setPolicies(uploadedPolicies);
  };

  // Handle question upload
  const handleQuestionUpload = (uploadedQuestions: AuditQuestion[]) => {
    setQuestions(uploadedQuestions);
  };

  // Run analysis
  const runAnalysis = async () => {
    if (!policies.length || !questions.length) {
      alert('Please upload both policies and questions before running analysis.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/simple?endpoint=analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policies,
          questions,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result.results || []);
        setActiveTab('results');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Readily Professional</h1>
                <p className="text-sm text-gray-600">Policy Compliance Analysis Platform</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'upload' | 'analysis' | 'results')}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Upload Your Documents</h2>
              <p className="mt-2 text-lg text-gray-600">
                Start by uploading your policy documents and audit questions
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Policy Documents</span>
                  </CardTitle>
                  <CardDescription>
                    Upload PDF files containing your organization&apos;s policies and procedures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PolicyUpload onUploadComplete={handlePolicyUpload} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquareText className="h-5 w-5 text-green-600" />
                    <span>Audit Questions</span>
                  </CardTitle>
                  <CardDescription>
                    Upload PDF containing the audit questions to be analyzed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionUpload onUploadComplete={handleQuestionUpload} />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => setActiveTab('analysis')}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!policies.length || !questions.length}
              >
                Proceed to Analysis
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Run Analysis</h2>
              <p className="mt-2 text-lg text-gray-600">
                Configure and execute your policy compliance analysis
              </p>
            </div>

            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>Analysis Configuration</CardTitle>
                <CardDescription>
                  Review your uploaded documents and start the analysis process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium text-gray-900">Policy Documents</h4>
                    <p className="text-sm text-gray-600">{policies.length} documents uploaded</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium text-gray-900">Audit Questions</h4>
                    <p className="text-sm text-gray-600">{questions.length} questions extracted</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                  >
                    Back to Upload
                  </Button>
                  <Button 
                    onClick={runAnalysis}
                    disabled={analyzing || !policies.length || !questions.length}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {analyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Analysis Results</h2>
              <p className="mt-2 text-lg text-gray-600">
                Review your policy compliance analysis results
              </p>
            </div>

            {results.length > 0 ? (
              <AnalysisResults results={results} />
            ) : (
              <Card className="mx-auto max-w-2xl">
                <CardContent className="text-center py-12">
                  <p className="text-gray-600">No results yet. Please run an analysis first.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setActiveTab('analysis')}
                  >
                    Go to Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 Readily Professional. Advanced Policy Compliance Analysis.</p>
        </div>
      </footer>
    </div>
  );
}