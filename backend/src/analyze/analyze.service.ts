import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;
  private model: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.model = config.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-20b';
    this.openai = new OpenAI({
      apiKey: config.get<string>('GROQ_API_KEY')!,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  private async generateWithRetry(
    prompt: string,
    maxRetries = 3,
    temperature = 0.7,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.openai.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: 16384,
        });
        return res.choices[0]?.message?.content ?? '';
      } catch (error: any) {
        const is429 =
          error?.status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.includes('rate_limit') ||
          error?.message?.includes('requests');

        if (is429 && attempt < maxRetries) {
          const delayMs = attempt * 15000;
          console.log(
            `Groq 429 hit (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delayMs / 1000)}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (is429) {
          throw new HttpException(
            'AI service rate limited. Please wait a moment and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new BadRequestException(`AI request failed: ${error.message}`);
      }
    }

    throw new BadRequestException('AI request failed after retries');
  }

  private extractJson(raw: string): any {
    let text = raw.trim();
    text = text
      .replace(/```jsonl?\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(text);
    } catch {
      const repaired = text.replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(repaired);
      } catch {
        throw new BadRequestException(
          `Failed to parse AI response. Raw (first 300 chars): ${raw.slice(0, 300)}`,
        );
      }
    }
  }

  private async completeJsonResponse(raw: string): Promise<any> {
    const prompt = `The following JSON document was cut off mid-way. Rebuild it into ONE complete, valid JSON object, preserving all existing keys and values and finishing anything that was truncated. Add sensible placeholder content if a value was cut off. Return ONLY the finished JSON, no markdown, no backticks, no explanation.

${raw}`;
    const completed = await this.generateWithRetry(prompt, 2, 0);
    return this.extractJson(completed);
  }

  async analyzeResume(userId: string, resumeText: string, jobDescription: string, opts?: { resumeId?: string }) {
    const prompt = `You are an expert ATS resume analyzer. Given this resume and job description, return a JSON object with:
- matchScore: number (0-100)
- matchedSkills: string[] (skills in both resume and JD)
- missingSkills: string[] (skills in JD but not in resume)
- resumeSuggestions: string[] (3-5 short bullet improvements, each under 25 words)
- summary: string (2-3 sentence overall assessment, under 60 words)

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON, no markdown, no backticks.`;

    const response = await this.generateWithRetry(prompt, 3, 0);

    let parsed: any;
    try {
      parsed = this.extractJson(response);
    } catch {
      parsed = await this.completeJsonResponse(response);
    }

    const matchScore = Number(parsed.matchScore);
    if (!Number.isFinite(matchScore)) {
      throw new BadRequestException(
        'AI response missing matchScore. Raw (first 300 chars): ' + response.slice(0, 300),
      );
    }

    const matchedSkills = Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [];
    const missingSkills = Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [];
    const resumeSuggestions = Array.isArray(parsed.resumeSuggestions) ? parsed.resumeSuggestions : [];
    const summary =
      typeof parsed.summary === 'string' ? parsed.summary : '';

    const analysis = await this.prisma.analysis.create({
      data: {
        matchScore,
        matchedSkills,
        missingSkills,
        suggestions: resumeSuggestions,
        summary,
        jobDescription,
        userId,
        ...(opts?.resumeId ? { resumeId: opts.resumeId } : {}),
      },
    });

    // Fire-and-forget webhook notification
    const webhookUrl = this.config.get<string>('WEBHOOK_URL');
    if (webhookUrl) {
      fetch(`${webhookUrl}/webhook/analysis-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          resumeId: opts?.resumeId ?? analysis.id,
          matchScore,
          fileName: null,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.warn('Webhook failed:', err.message));
    }

    return { ...analysis, resumeSuggestions };
  }

  async generateColdEmail(userId: string, role: string, jobDescription: string, userName: string) {
    const prompt = `You are a professional career coach. Write a cold outreach email for the following job application.

Applicant Name: ${userName}
Target Role: ${role}
Job Description: ${jobDescription}

Write a professional, concise cold email (under 200 words) that:
1. Opens with a compelling hook
2. Highlights relevant value
3. Ends with a clear call to action

Return ONLY the email text, no JSON wrapping.`;

    const email = await this.generateWithRetry(prompt);

    return { email };
  }
}
