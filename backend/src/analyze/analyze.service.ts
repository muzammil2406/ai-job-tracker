import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: config.get<string>('GROQ_API_KEY')!,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  private async generateWithRetry(
    prompt: string,
    maxRetries = 3,
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.openai.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048,
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

  async analyzeResume(userId: string, resumeText: string, jobDescription: string) {
    const prompt = `You are an expert ATS resume analyzer. Given this resume and job description, return a JSON object with:
- matchScore: number (0-100)
- matchedSkills: string[] (skills in both resume and JD)
- missingSkills: string[] (skills in JD but not in resume)
- resumeSuggestions: string[] (3-5 specific bullet point improvements)
- summary: string (2-3 sentence overall assessment)

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON, no markdown, no backticks.`;

    const response = await this.generateWithRetry(prompt);

    let parsed: {
      matchScore: number;
      matchedSkills: string[];
      missingSkills: string[];
      resumeSuggestions: string[];
      summary: string;
    };

    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new BadRequestException('Failed to parse AI response');
    }

    const analysis = await this.prisma.analysis.create({
      data: {
        matchScore: parsed.matchScore,
        matchedSkills: parsed.matchedSkills,
        missingSkills: parsed.missingSkills,
        suggestions: parsed.resumeSuggestions,
        summary: parsed.summary,
        jobDescription,
        userId,
      },
    });

    return { ...analysis, resumeSuggestions: parsed.resumeSuggestions };
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
