/*
# Northstar Seed Data — Fields, Professions, Compass Picks

## Overview
Seeds the reference data: 3 fields (IT/CS, Finance, Law) with all their
professions, each carrying 2-3 query keywords. Also seeds an initial
compass pick (hand-curated weekly item visible to all users).

## Seeded Data
- fields: IT/CS, Finance, Law
- professions: 15 IT/CS, 12 Finance, 11 Law (38 total)
- compass_picks: 1 initial weekly pick

## Notes
- Keywords are used by edge functions to query external APIs (GNews, Google Books, arXiv, etc.)
- No security changes — data only.
*/

INSERT INTO fields (name, slug, display_order) VALUES
  ('IT/CS', 'it-cs', 1),
  ('Finance', 'finance', 2),
  ('Law', 'law', 3)
ON CONFLICT (slug) DO NOTHING;

-- IT/CS professions
INSERT INTO professions (field_id, name, slug, keywords, display_order)
SELECT f.id, v.prof_name, v.prof_slug, v.keywords, v.ord
FROM fields f
JOIN (VALUES
  ('it-cs', 'Software Engineer', 'software-engineer', ARRAY['software engineering','system design','scalability'], 1),
  ('it-cs', 'Web Developer', 'web-developer', ARRAY['web development','javascript','css'], 2),
  ('it-cs', 'Data Scientist', 'data-scientist', ARRAY['data science','machine learning','statistics'], 3),
  ('it-cs', 'Data Analyst', 'data-analyst', ARRAY['data analysis','sql','data visualization'], 4),
  ('it-cs', 'ML Engineer', 'ml-engineer', ARRAY['machine learning','model deployment','MLOps'], 5),
  ('it-cs', 'AI Engineer', 'ai-engineer', ARRAY['artificial intelligence','LLM','neural networks'], 6),
  ('it-cs', 'DevOps Engineer', 'devops-engineer', ARRAY['devops','CI/CD','kubernetes'], 7),
  ('it-cs', 'Cybersecurity Analyst', 'cybersecurity-analyst', ARRAY['cybersecurity','threat intelligence','security operations'], 8),
  ('it-cs', 'Cloud Engineer', 'cloud-engineer', ARRAY['cloud computing','AWS','cloud architecture'], 9),
  ('it-cs', 'Backend Developer', 'backend-developer', ARRAY['backend development','API','databases'], 10),
  ('it-cs', 'Frontend Developer', 'frontend-developer', ARRAY['frontend development','React','user interface'], 11),
  ('it-cs', 'Full-Stack Developer', 'fullstack-developer', ARRAY['full stack development','web application','API'], 12),
  ('it-cs', 'Mobile App Developer', 'mobile-app-developer', ARRAY['mobile development','iOS','android'], 13),
  ('it-cs', 'QA/Test Engineer', 'qa-test-engineer', ARRAY['software testing','test automation','quality assurance'], 14),
  ('it-cs', 'Database Administrator', 'database-administrator', ARRAY['database administration','SQL','database performance'], 15)
) AS v(field_slug, prof_name, prof_slug, keywords, ord)
ON v.field_slug = f.slug
ON CONFLICT (field_id, slug) DO NOTHING;

-- Finance professions
INSERT INTO professions (field_id, name, slug, keywords, display_order)
SELECT f.id, v.prof_name, v.prof_slug, v.keywords, v.ord
FROM fields f
JOIN (VALUES
  ('finance', 'Financial Analyst', 'financial-analyst', ARRAY['financial analysis','valuation','modeling'], 1),
  ('finance', 'Investment Banker', 'investment-banker', ARRAY['investment banking','M&A','capital markets'], 2),
  ('finance', 'Accountant', 'accountant', ARRAY['accounting','audit','financial reporting'], 3),
  ('finance', 'Auditor', 'auditor', ARRAY['auditing','internal controls','compliance'], 4),
  ('finance', 'Financial Planner', 'financial-planner', ARRAY['financial planning','wealth management','retirement'], 5),
  ('finance', 'Risk Analyst', 'risk-analyst', ARRAY['risk management','market risk','credit risk'], 6),
  ('finance', 'Quantitative Analyst', 'quantitative-analyst', ARRAY['quantitative finance','derivatives','statistical modeling'], 7),
  ('finance', 'Actuary', 'actuary', ARRAY['actuarial science','insurance','probability'], 8),
  ('finance', 'Corporate Finance Manager', 'corporate-finance-manager', ARRAY['corporate finance','capital structure','budgeting'], 9),
  ('finance', 'Tax Consultant', 'tax-consultant', ARRAY['tax planning','tax law','corporate tax'], 10),
  ('finance', 'Credit Analyst', 'credit-analyst', ARRAY['credit analysis','credit risk','lending'], 11),
  ('finance', 'Portfolio Manager', 'portfolio-manager', ARRAY['portfolio management','asset allocation','investment strategy'], 12)
) AS v(field_slug, prof_name, prof_slug, keywords, ord)
ON v.field_slug = f.slug
ON CONFLICT (field_id, slug) DO NOTHING;

-- Law professions
INSERT INTO professions (field_id, name, slug, keywords, display_order)
SELECT f.id, v.prof_name, v.prof_slug, v.keywords, v.ord
FROM fields f
JOIN (VALUES
  ('law', 'Corporate Lawyer', 'corporate-lawyer', ARRAY['corporate law','mergers acquisitions','governance'], 1),
  ('law', 'Litigation Attorney', 'litigation-attorney', ARRAY['litigation','civil procedure','court proceedings'], 2),
  ('law', 'Criminal Defense Attorney', 'criminal-defense-attorney', ARRAY['criminal law','criminal defense','trial advocacy'], 3),
  ('law', 'Intellectual Property Lawyer', 'ip-lawyer', ARRAY['intellectual property','patent law','trademark'], 4),
  ('law', 'Family Lawyer', 'family-lawyer', ARRAY['family law','divorce','child custody'], 5),
  ('law', 'Tax Attorney', 'tax-attorney', ARRAY['tax law','tax controversy','estate planning'], 6),
  ('law', 'Legal Consultant', 'legal-consultant', ARRAY['legal consulting','regulatory compliance','advisory'], 7),
  ('law', 'Paralegal', 'paralegal', ARRAY['paralegal','legal research','case management'], 8),
  ('law', 'Compliance Officer', 'compliance-officer', ARRAY['regulatory compliance','risk management','AML KYC'], 9),
  ('law', 'Contract Lawyer', 'contract-lawyer', ARRAY['contract law','drafting contracts','commercial agreements'], 10),
  ('law', 'Employment Lawyer', 'employment-lawyer', ARRAY['employment law','labor law','workplace disputes'], 11)
) AS v(field_slug, prof_name, prof_slug, keywords, ord)
ON v.field_slug = f.slug
ON CONFLICT (field_id, slug) DO NOTHING;

-- Compass pick (hand-curated, global)
INSERT INTO compass_picks (title, body, link, week_label)
VALUES (
  'The half-life of a professional skill is now ~5 years',
  'IBM research estimates that technical skills expire roughly every five years, down from thirty a generation ago. The professionals who stay relevant are not the ones who know the most today — they are the ones who build a habit of noticing what is shifting, early. Northstar is built around that habit.',
  NULL,
  'Week 1'
)
ON CONFLICT DO NOTHING;
