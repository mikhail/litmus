import type { DemoContext } from '../types';

export const demoContexts: DemoContext[] = [
  {
    id: 'law-firm',
    name: 'Law Firm',
    icon: '⚖️',
    packets: [
      {
        id: 'legal-brief-standards',
        name: 'Legal Brief Standards',
        description: 'Ensures legal memos meet professional standards for citations, precision, and formality.',
        criteria: [
          {
            id: 'cite-case-numbers',
            label: 'Every factual claim cites a case number or statute',
            description: 'Any assertion of legal fact, precedent, or ruling must include a specific case citation (e.g., Smith v. Jones, 123 F.3d 456) or statutory reference.',
          },
          {
            id: 'no-speculative-language',
            label: 'No speculative language',
            description: 'The text must not contain hedging words like "might", "could potentially", "possibly", "perhaps", or "it seems". Legal writing should be assertive and definitive.',
          },
          {
            id: 'full-legal-names',
            label: 'All party names use full legal names on first reference',
            description: 'The first mention of any party must use their full legal name (e.g., "Defendant John Michael Smith" not just "the defendant" or "Smith").',
          },
          {
            id: 'no-contractions',
            label: 'No contractions',
            description: 'Formal legal writing must not use contractions (e.g., use "does not" instead of "doesn\'t", "cannot" instead of "can\'t").',
          },
        ],
        createdAt: Date.now(),
      },
    ],
    sampleText: `<h2>Memorandum: Contract Dispute — Henderson Matter</h2>
<p>The defendant has repeatedly failed to meet contractual obligations as outlined in the original agreement dated March 15, 2023. This could potentially constitute a material breach under state law.</p>
<p>Similar cases have established that repeated non-performance is grounds for termination of the agreement. The plaintiff shouldn't have to continue performing under these circumstances.</p>
<p>We recommend pursuing immediate legal action. The defendant's conduct might expose them to significant liability, and it's clear that the pattern of behavior won't change without judicial intervention.</p>`,
  },
  {
    id: 'product-team',
    name: 'Product Team',
    icon: '🚀',
    packets: [
      {
        id: 'product-comms-standards',
        name: 'Product Comms Standards',
        description: 'Ensures external product communications follow company guidelines for terminology, confidentiality, and clarity.',
        criteria: [
          {
            id: 'no-financial-disclosures',
            label: 'No financial figures or revenue disclosures',
            description: 'The text must not contain any specific financial numbers, revenue figures, ARR, MRR, pricing details, or growth percentages that are not publicly disclosed.',
          },
          {
            id: 'approved-terminology',
            label: 'Uses approved product terminology (no internal codenames)',
            description: 'The text must not reference internal project codenames (e.g., "Project Falcon", "Operation Phoenix"). Use only the official, public-facing product names.',
          },
          {
            id: 'user-benefit-statement',
            label: 'Each feature has a user-facing benefit statement',
            description: 'Every feature mentioned must include a clear statement of how it benefits the end user, not just what it does technically.',
          },
          {
            id: 'concise-features',
            label: 'No more than 3 sentences per feature description',
            description: 'Each feature section should be concise — no more than 3 sentences. This keeps release notes scannable.',
          },
        ],
        createdAt: Date.now(),
      },
    ],
    sampleText: `<h2>Release Notes — v4.2.0</h2>
<p><strong>Smart Search (Project Falcon)</strong></p>
<p>We've completely rebuilt our search infrastructure from the ground up. The new system uses vector embeddings and semantic matching to deliver results that actually understand what you're looking for. This has driven a 34% increase in search engagement and contributed to our $2.3M ARR growth this quarter.</p>
<p><strong>Batch Export</strong></p>
<p>Users can now export up to 10,000 records at once in CSV or JSON format.</p>
<p><strong>Dashboard Redesign</strong></p>
<p>The analytics dashboard has been completely redesigned with new chart types, customizable layouts, and real-time data streaming. We've moved from polling to WebSocket connections for live updates. The new rendering engine reduces paint times by 60%. Users have reported significantly improved workflow efficiency since the beta launch. Early feedback from our enterprise segment has been overwhelmingly positive.</p>`,
  },
  {
    id: 'engineering-org',
    name: 'Engineering Org',
    icon: '🔧',
    packets: [
      {
        id: 'design-doc-checklist',
        name: 'Design Doc Checklist',
        description: 'Ensures engineering design documents are complete, well-structured, and ready for review.',
        criteria: [
          {
            id: 'problem-statement',
            label: 'Has a clear problem statement in the first paragraph',
            description: 'The document must open with a clear, concise statement of the problem being solved. The reader should understand the "why" before the "how".',
          },
          {
            id: 'alternatives-considered',
            label: 'Lists at least one alternative considered',
            description: 'The document must include a section discussing at least one alternative approach that was considered and why it was rejected.',
          },
          {
            id: 'no-undefined-acronyms',
            label: 'No undefined acronyms',
            description: 'Every acronym must be expanded on first use (e.g., "Remote Procedure Call (RPC)"). Do not assume the reader knows all acronyms.',
          },
          {
            id: 'rollback-plan',
            label: 'Includes a rollback plan',
            description: 'The document must describe how to safely roll back the change if something goes wrong after deployment.',
          },
          {
            id: 'no-todos',
            label: 'No TODOs or placeholder text',
            description: 'The document must not contain TODO comments, placeholder text like "TBD", "fill in later", or incomplete sections.',
          },
        ],
        createdAt: Date.now(),
      },
    ],
    sampleText: `<h2>Design Doc: Migration to gRPC-based Service Mesh</h2>
<p>Our current REST API gateway is hitting performance limits. We propose migrating inter-service communication to gRPC with an Envoy-based service mesh using mTLS for authentication.</p>
<p><strong>Proposed Solution</strong></p>
<p>We will replace the existing HTTP/1.1 REST calls between microservices with gRPC streams. This gives us multiplexed connections, binary serialization via protobuf, and native streaming support. The SLA for p99 latency should improve from 200ms to under 50ms.</p>
<p><strong>Implementation Plan</strong></p>
<p>Phase 1: Deploy Envoy sidecars to all services in the staging environment. Phase 2: Migrate the highest-traffic service (the recommendation engine) as a pilot. Phase 3: TODO: add remaining services migration plan.</p>
<p><strong>Metrics</strong></p>
<p>TODO: define success metrics and monitoring dashboard.</p>`,
  },
  {
    id: 'journalist',
    name: 'Journalist',
    icon: '📰',
    packets: [
      {
        id: 'editorial-standards',
        name: 'Editorial Standards',
        description: 'Ensures news articles meet journalistic standards for clarity, attribution, and objectivity.',
        criteria: [
          {
            id: 'no-passive-voice',
            label: 'No passive voice',
            description: 'The text should use active voice throughout. Passive constructions like "mistakes were made" or "it was decided" should be rewritten to identify the actor.',
          },
          {
            id: 'stats-attributed',
            label: 'All statistics must be attributed to a source',
            description: 'Every statistic, percentage, or numerical claim must cite its source (e.g., "according to a Pew Research study" or "city records show").',
          },
          {
            id: 'reading-level',
            label: 'Reading level below grade 10',
            description: 'The text should be written in clear, simple language accessible to a general audience. Avoid jargon, complex sentence structures, and unnecessarily long words.',
          },
          {
            id: 'no-adjectives-in-headlines',
            label: 'No subjective adjectives in headlines',
            description: 'Headlines must be factual and neutral. Subjective adjectives like "amazing", "terrible", "incredible", "revolutionary" are not permitted.',
          },
          {
            id: 'quotes-identify-speaker',
            label: 'Direct quotes must identify the speaker',
            description: 'Every direct quote must clearly attribute who said it, with their name and relevant title or role.',
          },
        ],
        createdAt: Date.now(),
      },
    ],
    sampleText: `<h2>Revolutionary New Transit Plan Transforms Downtown</h2>
<p>A sweeping new transportation plan was unveiled yesterday that promises to reshape the city's downtown corridor. The plan, which was developed over 18 months, was approved by the city council in a 7-2 vote.</p>
<p>"This is going to change everything for commuters," said one official. The plan includes dedicated bus lanes on three major streets and 42% more bike parking — a significant increase that reflects growing demand.</p>
<p>Opposition to the plan was expressed by local business owners, who worry about reduced street parking. A petition with over 3,000 signatures was submitted to the council last week.</p>
<p>The $47 million project is expected to be completed by 2028. "We're confident this will reduce average commute times by 15 minutes," a spokesperson said.</p>`,
  },
];
