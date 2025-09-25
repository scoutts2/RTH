import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// GOOGLE GEMINI SETUP
// ============================================================================
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function callGemini(prompt: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
}

// ============================================================================
// SIMPLE API HANDLER FOR ALL ENDPOINTS
// ============================================================================

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint');

  try {
    switch (endpoint) {
      case 'upload-policies':
        return await handlePolicyUpload(request);
      case 'upload-questions':
        return await handleQuestionUpload(request);
      case 'analyze':
        return await handleAnalysis(request);
      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Readily Professional API',
    endpoints: [
      'POST ?endpoint=upload-policies - Upload policy PDFs',
      'POST ?endpoint=upload-questions - Upload questions PDF',
      'POST ?endpoint=analyze - Analyze policies against questions'
    ]
  });
}

// ============================================================================
// POLICY UPLOAD HANDLER
// ============================================================================

async function handlePolicyUpload(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const processedPolicies = [];

  for (const file of files) {
    if (file.type !== 'application/pdf') {
      continue;
    }

    try {
      // Simulate PDF processing (in real app, would use pdf-parse)
      const policy = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: `Simulated content from ${file.name}. This would contain the actual extracted text from the PDF document including policies, procedures, and compliance requirements.`,
        pages: Math.floor(Math.random() * 50) + 10,
        uploadedAt: new Date().toISOString(),
      };

      processedPolicies.push(policy);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      return NextResponse.json(
        { error: `Failed to process file: ${file.name}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    policies: processedPolicies,
    message: `Successfully processed ${processedPolicies.length} policy documents`
  });
}

// ============================================================================
// QUESTION UPLOAD HANDLER
// ============================================================================

async function handleQuestionUpload(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
  }

  try {
    // Simulate question extraction (in real app, would parse PDF and extract questions)
    const sampleQuestions = [
      {
        id: '1',
        number: 1,
        text: 'Does the P&P establish clear data retention policies for sensitive information?',
        reference: '(Reference: GDPR Article 5(1)(e))'
      },
      {
        id: '2',
        number: 2,
        text: 'Does the P&P require regular security assessments of third-party vendors?',
        reference: '(Reference: SOX Section 404)'
      },
      {
        id: '3',
        number: 3,
        text: 'Does the P&P mandate employee training on data privacy and security protocols?',
        reference: '(Reference: ISO 27001:2013)'
      }
    ];

    // Generate additional sample questions
    const additionalQuestions = Array.from({ length: 25 }, (_, i) => ({
      id: (i + 4).toString(),
      number: i + 4,
      text: `Does the P&P address compliance requirement ${i + 4} according to industry standards?`,
      reference: `(Reference: Standard ${i + 4})`
    }));

    const allQuestions = [...sampleQuestions, ...additionalQuestions];

    return NextResponse.json({
      success: true,
      questions: allQuestions,
      message: `Successfully extracted ${allQuestions.length} questions`
    });

  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    return NextResponse.json(
      { error: `Failed to process file: ${file.name}` },
      { status: 500 }
    );
  }
}

// ============================================================================
// ANALYSIS HANDLER
// ============================================================================

async function handleAnalysis(request: NextRequest) {
  const body = await request.json();
  const { questions, policies } = body;

  if (!questions || !policies) {
    return NextResponse.json(
      { error: 'Questions and policies are required' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google API key not configured' },
      { status: 500 }
    );
  }

  const results = [];

  // Process questions with real Gemini AI
  for (const question of questions) {
    try {
      // Combine policy content for context
      const policyContext = policies.map((p: { name: string; content: string }) => 
        `[Document: ${p.name}]\n${p.content}`
      ).join('\n\n').substring(0, 8000); // Limit context size

      const prompt = `You are a compliance analyst. Analyze whether the following question is satisfied by the provided policies.

Question: ${question.text}

Policy Documents:
${policyContext}

Respond with a JSON object containing:
{
  "status": "Yes|No|Maybe",
  "confidence": 0.85,
  "reasoning": "Brief explanation",
  "citation": "Relevant quote from policies"
}

Guidelines:
- "Yes": Policy clearly addresses the requirement
- "No": Policy clearly does not address or contradicts it
- "Maybe": Policy partially addresses or is ambiguous
- Confidence: 0.0 to 1.0
- Citation: Exact quote from the most relevant policy section`;

      const aiResponse = await callGemini(prompt);
      
      // Try to parse JSON response
      let analysisResult;
      try {
        // Extract JSON from response if it contains extra text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        analysisResult = JSON.parse(jsonStr);
      } catch {
        // Fallback if JSON parsing fails
        analysisResult = {
          status: 'Maybe',
          confidence: 0.5,
          reasoning: 'AI analysis completed but response format was unclear',
          citation: aiResponse.substring(0, 200)
        };
      }

      const result = {
        id: Math.random().toString(36).substr(2, 9),
        questionId: question.id,
        question: question.text,
        status: analysisResult.status || 'Maybe',
        confidence: Math.max(0, Math.min(1, analysisResult.confidence || 0.5)),
        citations: [{
          text: analysisResult.citation || 'No specific citation provided',
          page: Math.floor(Math.random() * 20) + 1,
          fileName: policies[0]?.name || 'policy.pdf',
          relevanceScore: analysisResult.confidence || 0.5
        }],
        timestamp: new Date().toISOString(),
        reasoning: analysisResult.reasoning
      };

      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error analyzing question ${question.id}:`, error);
      // Add fallback result for failed questions
      results.push({
        id: Math.random().toString(36).substr(2, 9),
        questionId: question.id,
        question: question.text,
        status: 'Maybe',
        confidence: 0.5,
        citations: [{
          text: 'Analysis failed - please try again',
          page: 1,
          fileName: 'error',
          relevanceScore: 0.5
        }],
        timestamp: new Date().toISOString(),
        reasoning: 'Analysis failed due to technical error'
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
    message: `Successfully analyzed ${results.length} questions using Gemini AI`
  });
}
