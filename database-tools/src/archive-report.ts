import * as fs from 'fs';
import * as path from 'path';
import knex, { Knex } from 'knex';
import config from '../knexfile';

interface ArchiveRow {
  resume_id: string;
  user_id: string;
  label: string;
  created_at: Date;
  matched_job_id: string | null;
}

const db: Knex = knex(config.development);

function toCsv(rows: ArchiveRow[]): string {
  const header = 'resume_id,user_id,label,created_at,matched_job_id';
  const escape = (value: string | number | Date | null): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = rows.map((r) =>
    [
      escape(r.resume_id),
      escape(r.user_id),
      escape(r.label),
      escape(r.created_at.toISOString()),
      escape(r.matched_job_id),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

async function main(): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const rows: ArchiveRow[] = await db('resumes')
    .leftJoin('job_analysis', 'job_analysis.resumeId', 'resumes.id')
    .where('resumes.createdAt', '<', cutoff)
    .whereNull('job_analysis.id')
    .select({
      resume_id: 'resumes.id',
      user_id: 'resumes.userId',
      label: 'resumes.label',
      created_at: 'resumes.createdAt',
      matched_job_id: 'job_analysis.id',
    });

  const outPath = path.join(__dirname, '..', 'reports', 'stale-resumes.csv');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const csv = toCsv(rows);
  fs.writeFileSync(outPath, csv, 'utf8');

  console.log(`Found ${rows.length} resume(s) older than 90 days with no matched job.`);
  console.log(`Report written to ${outPath}`);
  if (rows.length > 0) {
    console.log('\n' + csv);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.destroy());