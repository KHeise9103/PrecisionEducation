<script setup>
import { computed, ref, watch } from 'vue'
import { mockPatients } from './data/mockPatients'
import EducationGenerator from './components/EducationGenerator.vue'
import {
  buildFacultyTeachingGuideRequest,
  fallbackTeachingGuide,
  generateFacultyTeachingGuideWithApi,
  normalizeTeachingGuide
} from './lib/educationService'

const selectedPatient = ref(mockPatients[3] || mockPatients[0])
const selectedPersona = ref('PGY-1 Resident')
const selectedSpecialty = ref('Internal Medicine')
const learnerRoleOptions = [
  'Medical Student',
  'PGY-1 Resident',
  'PGY-2 Resident',
  'PGY-3 Resident',
  'Fellow',
  'Advanced Practice Provider',
  'Registered Nurse',
  'Respiratory Therapist',
  'Pharmacist',
  'Interprofessional Learner'
]
const programLearnerOptions = computed(() => ['All learner types', ...learnerRoleOptions])

const specialtyOptions = [
  'Internal Medicine',
  'Pediatrics',
  'Emergency Medicine',
  'Family Medicine',
  'Critical Care',
  'Hematology Oncology',
  'Cardiology',
  'Pulmonary Medicine',
  'Endocrinology',
  'Pharmacy',
  'Respiratory Care',
  'Interprofessional Team Care'
]
const activeWorkspace = ref('Home')
const activeEpicTab = ref('PrecisionEducation')
const programFocus = ref('Internal Medicine Residency')
const programLearnerFilter = ref('All learner types')
const activeFacultyRecommendation = ref('Patient Teaching')
const selectedTeachingFocus = ref('')
const estimatedTeachingTime = ref('3-5 min')
const toast = ref('')
const latestBrief = ref(null)
const teachingGuide = ref(null)
const teachingGuideLoading = ref(false)
const teachingGuideSource = ref('not generated')
const teachingMomentCompleted = ref(false)

const portfolioArtifacts = ref([
  { type: 'Learning reflection', title: 'Finding trustworthy evidence for patient care', status: 'Saved' }
])
const facultyDossier = ref([
  { type: 'Teaching activity', title: 'Feedback microlearning completed', status: 'Ready for export' }
])

const educationEvents = ref([])

const nav = ['Home', 'Clinical Learning', 'Faculty', 'Programs', 'Epic View']
const patientContextWorkspaces = ['Clinical Learning', 'Faculty', 'Epic View']
const needsPatientContext = computed(() => patientContextWorkspaces.includes(activeWorkspace.value))

const selectedDx = computed(() => selectedPatient.value?.encounter?.primaryDiagnosis || 'Clinical context')
const firstBarrier = computed(() => selectedPatient.value?.dischargePlanning?.barriers?.[0] || 'Learning opportunity identified')
const abnormalLabs = computed(() => (selectedPatient.value?.labs || []).filter(l => l.flag && l.flag !== 'Normal'))

const teachingFocusOptions = computed(() => buildTeachingFocusOptions(selectedPatient.value))

watch(
  [() => selectedPatient.value?.id, teachingFocusOptions],
  () => {
    selectedTeachingFocus.value = teachingFocusOptions.value[0] || inferLearningOpportunity(selectedDx.value)
  },
  { immediate: true }
)

watch(
  [() => selectedPatient.value?.id, selectedPersona, selectedSpecialty],
  () => {
    teachingGuide.value = null
    teachingGuideSource.value = 'not generated'
    teachingMomentCompleted.value = false
  }
)

const contextSummary = computed(() => ({
  patient: selectedPatient.value.name,
  condition: selectedDx.value,
  learner: `${selectedPersona.value} · ${selectedSpecialty.value}`,
  learnerRole: selectedPersona.value,
  specialty: selectedSpecialty.value,
  setting: selectedPatient.value.encounter.location,
  opportunity: inferLearningOpportunity(selectedDx.value)
}))

const homeMetrics = computed(() => [
  { value: 143 + (latestBrief.value ? 1 : 0), label: 'Learning opportunities', detail: 'Detected from patient context, role, and workflow signals' },
  { value: 96 + portfolioArtifacts.value.length, label: 'Completed today', detail: 'Briefs, reflections, source reviews, and faculty confirmations' },
  { value: 28, label: 'Faculty coaching opportunities', detail: 'Teaching moments connected to faculty development' },
  { value: 7, label: 'Reusable learning pathways', detail: 'Evidence, labs, monitoring, patient education, feedback, teaching, reflection' }
])

const intelligenceFeed = computed(() => [
  { time: '09:05', title: 'Clinical context received', body: `${selectedPatient.value.name} is associated with ${selectedDx.value}.` },
  { time: '09:06', title: 'Learning opportunity detected', body: `${contextSummary.value.opportunity} matched to ${selectedPersona.value} in ${selectedSpecialty.value}.` },
  { time: latestBrief.value ? '09:08' : 'Ready', title: latestBrief.value ? 'Learning brief generated' : 'Learning brief ready', body: latestBrief.value ? `${latestBrief.value.title} created from current context.` : 'Learner can choose a plain-language topic and generate the brief.' },
  { time: 'Next', title: 'Artifact loop', body: 'Reflection, source review, and faculty confirmation can be saved as educational evidence without requiring a separate portfolio workspace.' }
])

const facultyRecommendations = computed(() => ({
  'Patient Teaching': {
    title: `Teach ${selectedDx.value} in 5 minutes`,
    time: '4 min',
    why: `Recommended because ${selectedPatient.value.name}'s chart has a high-yield teaching context and ${firstBarrier.value.toLowerCase()}.`,
    doNow: 'Use the learning brief as a pre-rounds teaching script. Ask the learner to explain one concept back in plain language.',
    artifact: 'Teaching preparation activity saved to educator dossier'
  },
  'Feedback Coaching': {
    title: 'Give one specific coaching point after rounds',
    time: '3 min',
    why: 'Recommended because short, actionable feedback reinforces learning without disrupting workflow.',
    doNow: 'Use: “You did X well. Next time, try Y because Z.”',
    artifact: 'Feedback practice activity saved to educator dossier'
  },
  'AI Evidence Coaching': {
    title: 'Supervise safe use of an AI-enabled evidence tool',
    time: '5 min',
    why: 'Recommended when learners use AI or evidence tools during clinical learning.',
    doNow: 'Ask the learner to open one source, state applicability, and name what still needs supervision.',
    artifact: 'Responsible AI teaching activity saved to educator dossier'
  }
}))

const educationalHealth = computed(() => [
  { area: 'Clinical reasoning', status: 'Strong', tone: 'green', detail: 'Learners are connecting symptoms, labs, and assessment patterns.' },
  { area: 'Finding trustworthy evidence', status: latestBrief.value ? 'Improving' : 'Developing', tone: 'blue', detail: 'Learning briefs create a consistent source-review workflow.' },
  { area: 'Patient education', status: 'Opportunity', tone: 'yellow', detail: 'Discharge barriers and family concerns are recurring learning triggers.' },
  { area: 'Reflection capture', status: portfolioArtifacts.value.length > 1 ? 'Improving' : 'Needs reinforcement', tone: 'purple', detail: 'More reflections should be saved into the learner portfolio.' }
])

const currentLearnerActivity = computed(() => {
  if (!latestBrief.value) {
    return {
      title: 'No learner brief generated yet',
      status: 'Ready',
      detail: 'Generate a learner brief first, or create a teaching guide directly from the patient context.'
    }
  }
  return {
    title: latestBrief.value.title || 'Precision Learning Brief',
    status: 'Completed',
    detail: latestBrief.value.question || `Learning brief generated for ${selectedDx.value}`
  }
})

const recentTeachingMoments = computed(() => [
  { title: teachingGuide.value?.title || `Teaching Companion: ${selectedDx.value}`, status: teachingMomentCompleted.value ? 'Completed today' : 'Ready to teach' },
  { title: 'Heart failure patient explanation', status: 'Saved' },
  { title: 'Sepsis reassessment teaching', status: 'Saved' },
  { title: 'Diabetes sick-day learning moment', status: 'Saved' }
])

const enterpriseTrends = computed(() => [
  { topic: selectedDx.value, count: latestBrief.value ? 43 : 42, signal: 'Current patient context' },
  { topic: 'Patient explanation', count: 37, signal: 'Common learner intent' },
  { topic: 'Abnormal lab interpretation', count: abnormalLabs.value.length ? 31 : 26, signal: 'High-yield chart pattern' },
  { topic: 'Faculty feedback coaching', count: 24, signal: 'Teaching support opportunity' }
])

const programEvents = computed(() => {
  if (programLearnerFilter.value === 'All learner types') return educationEvents.value
  return educationEvents.value.filter(e => e.metadata?.learnerRole === programLearnerFilter.value)
})

const liveEvents = computed(() => programEvents.value.slice(0, 8).map(event => ({
  id: event.id,
  time: event.time,
  type: event.type,
  condition: event.metadata?.condition || 'Clinical context',
  learnerRole: event.metadata?.learnerRole || 'Learner',
  specialty: event.metadata?.specialty || 'Specialty not specified',
  topic: event.metadata?.topic || event.metadata?.intentLabel || event.metadata?.condition || 'Learning activity',
  source: event.metadata?.source || 'Prototype session'
})))

const sessionOutputs = computed(() => ({
  learningBriefs: programEvents.value.filter(e => e.type === 'Learning brief generated').length,
  teachingGuides: programEvents.value.filter(e => e.type === 'Teaching guide generated').length,
  teachingMoments: programEvents.value.filter(e => e.type === 'Teaching moment completed').length,
  contextChanges: programEvents.value.filter(e => e.type === 'Context updated').length
}))

const sessionTopics = computed(() => {
  const topics = programEvents.value
    .map(e => e.metadata?.topic || e.metadata?.intentLabel || e.metadata?.condition)
    .filter(Boolean)
  return [...new Set(topics)].slice(0, 6)
})

const sessionConditions = computed(() => {
  const conditions = programEvents.value
    .map(e => e.metadata?.condition)
    .filter(Boolean)
  return [...new Set(conditions)].slice(0, 5)
})

const latestLearningOutput = computed(() => {
  const output = programEvents.value.find(e => ['Learning brief generated', 'Teaching guide generated', 'Teaching moment completed'].includes(e.type))
  return output || null
})

const pathwayFromCurrentSession = computed(() => {
  const label = programLearnerFilter.value === 'All learner types' ? 'Deidentified session activity' : `${programLearnerFilter.value} activity`
  const steps = []
  if (sessionConditions.value.length) steps.push(...sessionConditions.value.map(c => `Clinical topic: ${c}`))
  if (sessionTopics.value.length) steps.push(...sessionTopics.value.map(t => `Learning topic: ${t}`))
  if (sessionOutputs.value.learningBriefs) steps.push('Learner-facing Precision Learning Briefs')
  if (sessionOutputs.value.teachingGuides) steps.push('Faculty Teaching Companion guides')
  if (sessionOutputs.value.teachingMoments) steps.push('Educator dossier artifacts')
  if (!steps.length) steps.push('Generate a learner brief or teaching guide to build a pathway preview')
  return { condition: label, steps: [...new Set(steps)].slice(0, 6) }
})

const platformActivitySummary = computed(() => [
  { label: 'Data scope', value: 'Deidentified activity', detail: 'No patient names shown in this view' },
  { label: 'Learner segment', value: programLearnerFilter.value, detail: programLearnerFilter.value === 'All learner types' ? 'All current-session events' : 'Filtered current-session events' },
  { label: 'Learning briefs', value: sessionOutputs.value.learningBriefs, detail: 'Generated in this session' },
  { label: 'Teaching guides', value: sessionOutputs.value.teachingGuides, detail: 'Generated in this session' }
])

const reviewedActivity = computed(() => {
  const events = programEvents.value
  const generated = events.filter(e => ['Learning brief generated', 'Teaching guide generated', 'Teaching moment completed', 'Reflection saved'].includes(e.type))
  const roles = [...new Set(events.map(e => e.metadata?.learnerRole).filter(Boolean))]
  const specialties = [...new Set(events.map(e => e.metadata?.specialty).filter(Boolean))]
  const topics = sessionTopics.value
  const products = []
  if (sessionOutputs.value.learningBriefs) products.push(`${sessionOutputs.value.learningBriefs} learner-facing brief${sessionOutputs.value.learningBriefs === 1 ? '' : 's'}`)
  if (sessionOutputs.value.teachingGuides) products.push(`${sessionOutputs.value.teachingGuides} faculty teaching guide${sessionOutputs.value.teachingGuides === 1 ? '' : 's'}`)
  if (sessionOutputs.value.teachingMoments) products.push(`${sessionOutputs.value.teachingMoments} completed teaching moment${sessionOutputs.value.teachingMoments === 1 ? '' : 's'}`)

  return {
    totalEvents: events.length,
    generatedCount: generated.length,
    roles,
    specialties,
    topics,
    products,
    hasActivity: events.length > 0
  }
})

const platformReviewSummary = computed(() => {
  const r = reviewedActivity.value
  if (!r.hasActivity) {
    return 'No platform activity has been captured in this session yet. Once learners generate briefs or faculty generate teaching guides, this page will summarize what happened without displaying patient identifiers.'
  }
  const roleText = r.roles.length ? r.roles.join(', ') : 'the selected learner group'
  const specialtyText = r.specialties.length ? r.specialties.join(', ') : 'the selected clinical context'
  const topicText = r.topics.length ? r.topics.slice(0, 3).join('; ') : 'patient-specific learning needs'
  const productText = r.products.length ? r.products.join(' and ') : `${r.generatedCount} educational product${r.generatedCount === 1 ? '' : 's'}`
  return `In this deidentified session, ${roleText} in ${specialtyText} used Precision Education to explore ${topicText}. The platform generated ${productText}, creating a traceable educational activity record without exposing patient names in this program view.`
})

const activityReviewCards = computed(() => [
  {
    label: 'What people used it for',
    value: sessionTopics.value[0] || 'No topic yet',
    detail: sessionTopics.value.length
      ? `Topics explored: ${sessionTopics.value.join(', ')}`
      : 'Topics will appear after a learning brief or teaching guide is generated.'
  },
  {
    label: 'Who used it',
    value: reviewedActivity.value.roles.length ? reviewedActivity.value.roles.join(', ') : programLearnerFilter.value,
    detail: reviewedActivity.value.specialties.length ? `Clinical context: ${reviewedActivity.value.specialties.join(', ')}` : 'Learner role and specialty will be captured from the current selections.'
  },
  {
    label: 'What was produced',
    value: reviewedActivity.value.products.length ? reviewedActivity.value.products.join(' + ') : 'No outputs yet',
    detail: 'Outputs include learner briefs, faculty guides, reflections, and completed teaching moments.'
  },
  {
    label: 'What this suggests',
    value: reviewedActivity.value.hasActivity ? 'Potential pathway signal' : 'Awaiting activity',
    detail: reviewedActivity.value.hasActivity
      ? 'Repeated topics can become reusable learning pathways after governance review.'
      : 'Generate activity elsewhere in the prototype to create a summary here.'
  }
])

const deidentifiedActivityTimeline = computed(() => {
  return programEvents.value.slice(0, 10).map((event, index) => {
    const metadata = event.metadata || {};
    return {
      id: event.id,
      number: programEvents.value.length - index,
      time: event.time,
      type: event.type,
      summary: event.title,
      detail: event.detail,
      learnerRole: metadata.learnerRole || 'Learner role not specified',
      specialty: metadata.specialty || 'Specialty not specified',
      topic: metadata.topic || metadata.intentLabel || metadata.condition || 'Learning activity',
      source: metadata.source || 'Prototype session'
    };
  });
});

const programTakeaways = computed(() => {
  if (!reviewedActivity.value.hasActivity) {
    return [
      'This page will summarize deidentified platform use after activity is generated.',
      'It is designed for program review, not patient-level review.',
      'No patient names are displayed in the program workspace.'
    ]
  }
  const takeaways = []
  if (sessionOutputs.value.learningBriefs) takeaways.push('Learners are using patient context to generate brief, role-aware educational summaries.')
  if (sessionOutputs.value.teachingGuides) takeaways.push('Faculty are using the same context to create short teaching guides for rounds or supervision.')
  if (sessionOutputs.value.teachingMoments) takeaways.push('Teaching moments are being completed and converted into educator-controlled artifacts.')
  if (sessionTopics.value.length) takeaways.push(`Most visible learning theme in this session: ${sessionTopics.value[0]}.`)
  takeaways.push('At enterprise scale, these deidentified activity records could support curriculum planning, pathway design, and faculty development without creating summative judgments.')
  return takeaways
})


function topCount(items) {
  const counts = items.filter(Boolean).reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {})
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return entries[0] || null
}

const intelligenceEvents = computed(() => educationEvents.value)

const intelligenceOutputs = computed(() => ({
  learningBriefs: intelligenceEvents.value.filter(e => e.type === 'Learning brief generated').length,
  teachingGuides: intelligenceEvents.value.filter(e => e.type === 'Teaching guide generated').length,
  reflections: intelligenceEvents.value.filter(e => e.type === 'Reflection saved').length,
  teachingMoments: intelligenceEvents.value.filter(e => e.type === 'Teaching moment completed').length,
  contextUpdates: intelligenceEvents.value.filter(e => e.type === 'Context updated').length,
  total: intelligenceEvents.value.length
}))

const intelligenceTopTopic = computed(() => topCount(intelligenceEvents.value.map(e => e.metadata?.topic || e.metadata?.intentLabel || e.metadata?.condition)))
const intelligenceTopRole = computed(() => topCount(intelligenceEvents.value.map(e => e.metadata?.learnerRole)))
const intelligenceTopSpecialty = computed(() => topCount(intelligenceEvents.value.map(e => e.metadata?.specialty)))

const intelligenceActivityCards = computed(() => [
  {
    label: 'Educational events',
    value: intelligenceOutputs.value.total,
    detail: 'Generated from this session, not fabricated enterprise totals'
  },
  {
    label: 'Most visible topic',
    value: intelligenceTopTopic.value?.[0] || 'No topic yet',
    detail: intelligenceTopTopic.value ? `${intelligenceTopTopic.value[1]} event${intelligenceTopTopic.value[1] === 1 ? '' : 's'} in this session` : 'Generate a brief or teaching guide to create a signal'
  },
  {
    label: 'Most active role',
    value: intelligenceTopRole.value?.[0] || 'No role yet',
    detail: intelligenceTopSpecialty.value ? `Most common context: ${intelligenceTopSpecialty.value[0]}` : 'Role and context are captured from page selections'
  },
  {
    label: 'Outputs created',
    value: intelligenceOutputs.value.learningBriefs + intelligenceOutputs.value.teachingGuides,
    detail: `${intelligenceOutputs.value.learningBriefs} learner brief${intelligenceOutputs.value.learningBriefs === 1 ? '' : 's'} + ${intelligenceOutputs.value.teachingGuides} teaching guide${intelligenceOutputs.value.teachingGuides === 1 ? '' : 's'}`
  }
])

const intelligenceObservations = computed(() => {
  if (!intelligenceOutputs.value.total) {
    return [
      'No activity has been captured yet. Generate a learner brief or teaching guide to show how the engine converts platform use into educational insight.',
      'This view will summarize what learners and faculty did on the platform without displaying patient identifiers.',
      'The purpose is organizational learning: detect repeated educational needs, then convert them into reusable learning pathways.'
    ]
  }
  const observations = []
  if (intelligenceTopTopic.value) observations.push(`The strongest current signal is ${intelligenceTopTopic.value[0]}, appearing in ${intelligenceTopTopic.value[1]} deidentified event${intelligenceTopTopic.value[1] === 1 ? '' : 's'}.`)
  if (intelligenceOutputs.value.learningBriefs) observations.push(`Learners generated ${intelligenceOutputs.value.learningBriefs} patient-contextual learning brief${intelligenceOutputs.value.learningBriefs === 1 ? '' : 's'}, showing demand for rapid, role-aware explanation at the point of care.`)
  if (intelligenceOutputs.value.teachingGuides) observations.push(`Faculty generated ${intelligenceOutputs.value.teachingGuides} teaching companion guide${intelligenceOutputs.value.teachingGuides === 1 ? '' : 's'}, showing how the same context can support supervision and teaching.`)
  if (intelligenceOutputs.value.reflections || intelligenceOutputs.value.teachingMoments) observations.push('The session includes portfolio or teaching-moment artifacts, demonstrating how individual learning activity can become educational evidence.')
  if (!observations.length) observations.push('The session currently contains context updates. Generate an educational product to create stronger learning signals.')
  return observations
})

const intelligenceSuggestedActions = computed(() => {
  if (!intelligenceOutputs.value.total) {
    return [
      { title: 'Generate activity', detail: 'Create a learner brief or faculty teaching guide to populate this intelligence view.' },
      { title: 'Review deidentified signals', detail: 'Use this page to see what the platform is learning from user activity.' },
      { title: 'Convert patterns into pathways', detail: 'Repeated topics can become reusable learning pathways after governance review.' }
    ]
  }
  const topic = intelligenceTopTopic.value?.[0] || 'the most common learning need'
  return [
    { title: `Package ${topic} as a pathway`, detail: 'Combine learner brief, faculty teaching guide, reflection prompt, and source-review habit into a reusable learning pathway.' },
    { title: 'Prepare faculty support', detail: 'Use Teaching Companion outputs to help faculty coach the same theme consistently across encounters.' },
    { title: 'Review knowledge sources', detail: 'Before enterprise deployment, connect the pathway to institutionally governed sources and versioned references.' }
  ]
})

const intelligencePathwayTitle = computed(() => intelligenceTopTopic.value?.[0] || sessionTopics.value[0] || 'Emerging learning need')

const intelligencePathwaySteps = computed(() => {
  const topic = intelligencePathwayTitle.value
  return [
    `Learner brief: ${topic}`,
    'Faculty teaching guide',
    'Source review checkpoint',
    'One-sentence reflection',
    'Deidentified activity summary',
    'Governance review before enterprise scaling'
  ]
})

const intelligenceRecentEvents = computed(() => intelligenceEvents.value.slice(0, 8).map(event => {
  const metadata = event.metadata || {}
  return {
    id: event.id,
    time: event.time,
    type: event.type,
    topic: metadata.topic || metadata.intentLabel || metadata.condition || 'Learning activity',
    role: metadata.learnerRole || 'Learner role not specified',
    specialty: metadata.specialty || 'Specialty not specified',
    source: metadata.source || 'Prototype session'
  }
}))

const programMetrics = computed(() => [
  { value: '2,842', label: 'Learning briefs generated', detail: 'Across rotations in the last 30 days' },
  { value: '624', label: 'Teaching guides generated', detail: 'Faculty-facing supports created from clinical context' },
  { value: 'Patient education', label: 'Top learning need', detail: 'Most frequent learner question theme' },
  { value: '68%', label: 'Reflection saved', detail: 'Completed briefs with a learner reflection artifact' }
])

const topLearningNeeds = computed(() => [
  { topic: 'Patient education', signal: 'Most frequent', detail: 'Learners ask how to explain conditions, monitoring, and discharge instructions in plain language.' },
  { topic: 'Lab interpretation', signal: 'High volume', detail: 'Learners need help connecting abnormal data to pathophysiology and monitoring rationale.' },
  { topic: 'Evidence review', signal: 'Growing', detail: 'Learners are using evidence tools and need consistent source-verification habits.' },
  { topic: 'Reassessment and escalation', signal: 'Targeted need', detail: 'Sepsis, heart failure, and respiratory cases generate questions about reassessment over time.' }
])

const recommendedProgramActions = computed(() => [
  { action: 'Launch a 2-week Patient Education pathway', owner: 'Program + Faculty Development', impact: 'Practice plain-language explanations before rounds and discharge conversations.' },
  { action: 'Send faculty a Teaching Companion guide', owner: 'Chief residents / APDs', impact: 'Give attendings 3-minute prompts for the most common learner needs.' },
  { action: 'Add a one-sentence reflection prompt', owner: 'Program coordinator', impact: 'Increase portfolio artifacts without adding a new evaluation form.' },
  { action: 'Review trends at the next program meeting', owner: 'Program leadership', impact: 'Turn aggregate learning signals into curriculum planning.' }
])

const pathwayBuilderDefaults = computed(() => ({
  topic: 'Patient Education',
  audience: 'PGY-1 Residents',
  duration: '2 weeks',
  activities: [
    'Generate one patient-specific Learning Brief before rounds',
    'Practice one plain-language explanation with faculty coaching',
    'Save one reflection artifact each week'
  ]
}))

const facultySupportNeeds = computed(() => [
  { need: 'Patient education coaching', count: 32, action: 'Use Teaching Companion prompts for plain-language explanations.' },
  { need: 'AI evidence coaching', count: 21, action: 'Help faculty supervise source verification without turning AI into clinical decision support.' },
  { need: 'Narrative feedback', count: 14, action: 'Offer a short guide for specific, actionable feedback.' }
])

function inferLearningOpportunity(dx) {
  const lower = (dx || '').toLowerCase()
  if (lower.includes('tumor lysis')) return 'Abnormal labs, monitoring rationale, and patient explanation'
  if (lower.includes('diabetes')) return 'Sick-day education, insulin physiology, and patient communication'
  if (lower.includes('asthma')) return 'Discharge readiness, inhaler technique, and teach-back'
  if (lower.includes('heart failure')) return 'Volume assessment, self-management, and readmission prevention'
  if (lower.includes('sepsis') || lower.includes('pneumonia')) return 'Reassessment, communication, and escalation awareness'
  return 'Patient-specific clinical learning'
}

function buildTeachingFocusOptions(patient) {
  const dx = (patient?.encounter?.primaryDiagnosis || '').toLowerCase()
  const barriers = patient?.dischargePlanning?.barriers || []
  if (dx.includes('tumor lysis')) {
    return [
      'Why tumor lysis changes potassium, phosphorus, calcium, uric acid, and kidney function',
      'How to teach TLS monitoring without turning it into a treatment recommendation',
      'How to explain frequent labs and kidney monitoring to an overwhelmed patient',
      'How to coach a PGY-1 through safe evidence review for TLS'
    ]
  }
  if (dx.includes('diabetes')) {
    return [
      'Sick-day education, insulin physiology, and patient communication',
      'Why patients with type 1 diabetes need insulin even when they are not eating well',
      'How to assess adolescent self-management readiness during diabetes teaching',
      'How to coach a learner to explain ketone monitoring in plain language'
    ]
  }
  if (dx.includes('asthma')) {
    return [
      'Discharge readiness, inhaler technique, and teach-back',
      'How to teach spacer technique using observation and feedback',
      'How to coach return precautions in plain language',
      'How to turn caregiver concern into a brief teaching moment'
    ]
  }
  if (dx.includes('heart failure')) {
    return [
      'Volume assessment, self-management, and readmission prevention',
      'How to teach daily weights and sodium restriction without overwhelming the patient',
      'How to connect kidney function, diuresis, and medication adherence as a learning conversation',
      'How to coach a learner through patient-centered discharge education'
    ]
  }
  if (dx.includes('sepsis') || dx.includes('pneumonia')) {
    return [
      'Reassessment, communication, and escalation awareness',
      'How to teach clinical trajectory and reassessment after initial stabilization',
      'How to use interpreter-supported education as a teaching moment',
      'How to coach safe evidence review in an acutely ill patient context'
    ]
  }
  return [
    inferLearningOpportunity(patient?.encounter?.primaryDiagnosis),
    `How to teach ${patient?.encounter?.primaryDiagnosis || 'this condition'} in 5 minutes`,
    barriers[0] ? `How to address: ${barriers[0]}` : 'How to connect the chart to a focused teaching question',
    'How to coach the learner to explain the key concept in plain language'
  ]
}

function chooseTeachingFocus(focus) {
  selectedTeachingFocus.value = focus
  teachingGuide.value = null
  teachingGuideSource.value = 'not generated'
  teachingMomentCompleted.value = false
  logEducationEvent('Teaching focus selected', focus, 'Faculty teaching guide prompt will use this focus.', { topic: focus })
}

function resetRoleSensitiveContent() {
  teachingGuide.value = null
  teachingGuideSource.value = 'not generated'
  teachingMomentCompleted.value = false
  latestBrief.value = null
}

function chooseLearnerRole(role) {
  selectedPersona.value = role
  resetRoleSensitiveContent()
  logEducationEvent('Context updated', `Learner role changed to ${role}`, 'Future learner briefs and teaching guides will use the selected role.', { learnerRole: role })
  notify(`Learner role changed to ${role}`)
}

function chooseSpecialty(specialty) {
  selectedSpecialty.value = specialty
  resetRoleSensitiveContent()
  logEducationEvent('Context updated', `Specialty changed to ${specialty}`, 'Future learner briefs and teaching guides will use the selected specialty.', { specialty })
  notify(`Specialty changed to ${specialty}`)
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('')
}

function logEducationEvent(type, title, detail, metadata = {}) {
  educationEvents.value.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type,
    title,
    detail,
    metadata: {
      patient: selectedPatient.value?.name,
      condition: selectedDx.value,
      learnerRole: selectedPersona.value,
      specialty: selectedSpecialty.value,
      ...metadata
    }
  })
}

function notify(message) {
  toast.value = message
  window.setTimeout(() => { toast.value = '' }, 2200)
}

function selectPatient(index) {
  selectedPatient.value = mockPatients[index]
  latestBrief.value = null
  logEducationEvent('Context updated', `${selectedPatient.value.name} selected`, `Clinical context changed to ${selectedDx.value}.`, { condition: selectedDx.value })
  notify(`Clinical context changed to ${selectedDx.value}`)
}

function go(workspace) {
  activeWorkspace.value = workspace
}

function handleBriefGenerated(brief) {
  latestBrief.value = brief
  if (brief?.reflection) {
    portfolioArtifacts.value.unshift({ type: 'Reflection', title: brief.title || 'Precision Learning Brief', status: 'Saved to portfolio' })
    logEducationEvent('Reflection saved', brief.title || 'Learner reflection', 'Learner saved a portfolio artifact from the generated brief.', { topic: brief._intentLabel || brief.title })
    notify('Reflection saved to portfolio')
  } else {
    logEducationEvent('Learning brief generated', brief.title || 'Precision Learning Brief', brief.question || `Generated for ${selectedDx.value}.`, { topic: brief._intentLabel || brief.title, source: brief._source || 'generator' })
    notify('Learning brief generated')
  }
}

async function generateTeachingGuide() {
  teachingGuideLoading.value = true
  teachingMomentCompleted.value = false
  const fallback = fallbackTeachingGuide(selectedPatient.value, selectedPersona.value, selectedTeachingFocus.value, estimatedTeachingTime.value, selectedSpecialty.value)
  const request = buildFacultyTeachingGuideRequest(selectedPatient.value, selectedPersona.value, latestBrief.value, {
    teachingFocus: selectedTeachingFocus.value,
    estimatedTeachingTime: estimatedTeachingTime.value,
    clinicalSpecialty: selectedSpecialty.value
  })
  try {
    const apiResult = await generateFacultyTeachingGuideWithApi(request)
    teachingGuide.value = normalizeTeachingGuide(apiResult, fallback)
    teachingGuideSource.value = apiResult?.source === 'openai' ? 'Generated by API' : 'Generated'
    logEducationEvent('Teaching guide generated', teachingGuide.value.title || `Teaching Companion: ${selectedDx.value}`, selectedTeachingFocus.value, { topic: selectedTeachingFocus.value, source: teachingGuideSource.value })
    notify('Teaching guide generated')
  } catch (error) {
    teachingGuide.value = fallback
    teachingGuideSource.value = 'Local fallback'
    logEducationEvent('Teaching guide generated', teachingGuide.value.title || `Teaching Companion: ${selectedDx.value}`, selectedTeachingFocus.value, { topic: selectedTeachingFocus.value, source: 'Local fallback' })
    notify('Teaching guide generated with local fallback')
  } finally {
    teachingGuideLoading.value = false
  }
}

function completeTeachingMoment() {
  if (!teachingGuide.value) {
    teachingGuide.value = fallbackTeachingGuide(selectedPatient.value, selectedPersona.value, selectedTeachingFocus.value, estimatedTeachingTime.value, selectedSpecialty.value)
    teachingGuideSource.value = 'Local fallback'
  }
  teachingMomentCompleted.value = true
  facultyDossier.value.unshift({
    type: 'Teaching moment',
    title: teachingGuide.value.title || `Teaching Companion: ${selectedDx.value}`,
    status: 'Saved to educator dossier'
  })
  logEducationEvent('Teaching moment completed', teachingGuide.value.title || `Teaching Companion: ${selectedDx.value}`, 'Faculty completed the teaching moment and saved an educator dossier artifact.', { topic: selectedTeachingFocus.value })
  notify('Teaching moment completed')
}

function saveFacultyArtifact() {
  const rec = facultyRecommendations.value[activeFacultyRecommendation.value]
  facultyDossier.value.unshift({ type: activeFacultyRecommendation.value, title: rec.title, status: 'Saved to educator dossier' })
  notify('Faculty artifact saved')
}

function exportDossier() {
  const text = [
    'Precision Education Educator Dossier',
    `Faculty context: ${selectedDx.value}`,
    '',
    ...facultyDossier.value.map(i => `${i.type}: ${i.title} (${i.status})`)
  ].join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'precision-education-dossier.txt'
  a.click()
  URL.revokeObjectURL(url)
  notify('Dossier exported')
}
</script>

<template>
  <div class="platform-shell">
    <aside class="left-rail">
      <div class="brand-lockup">
        <img src="/hero.png" alt="Precision Education" />
        <div>
          <strong>Precision Education</strong>
          <span>Enterprise Educational Intelligence Platform</span>
        </div>
      </div>

      <button
        v-for="item in nav"
        :key="item"
        class="nav-button"
        :class="{ active: activeWorkspace === item }"
        @click="go(item)"
      >
        {{ item }}
      </button>

      <div class="rail-note">
        <strong>Educational use only</strong>
        <span>Clinical context informs learning. It does not generate diagnoses, orders, or treatment recommendations.</span>
      </div>
    </aside>

    <main class="workspace">
      <div v-if="toast" class="toast">{{ toast }}</div>

      <header class="enterprise-header" :class="{ 'with-context-controls': needsPatientContext }">
        <div class="enterprise-title-block">
          <p class="eyebrow">Precision Education</p>
          <h1>{{ activeWorkspace }}</h1>
          <p>Transforming clinical context into personalized, workflow-integrated learning.</p>
        </div>

        <div v-if="needsPatientContext" class="header-context-controls">
          <div class="context-picker-field patient-field">
            <label>Current patient</label>
            <select @change="selectPatient($event.target.value)">
              <option v-for="(patient, index) in mockPatients" :key="patient.id" :value="index" :selected="patient.id === selectedPatient.id">
                {{ patient.name }} — {{ patient.encounter.primaryDiagnosis }}
              </option>
            </select>
          </div>

          <div class="context-picker-field learner-field">
            <label>Learner role</label>
            <select v-model="selectedPersona" @change="chooseLearnerRole(selectedPersona)">
              <option v-for="role in learnerRoleOptions" :key="role">{{ role }}</option>
            </select>
          </div>

          <div class="context-picker-field specialty-field">
            <label>Specialty / context</label>
            <select v-model="selectedSpecialty" @change="chooseSpecialty(selectedSpecialty)">
              <option v-for="specialty in specialtyOptions" :key="specialty">{{ specialty }}</option>
            </select>
          </div>
        </div>
      </header>

      <section v-if="needsPatientContext" class="compact-context-header">
        <div class="compact-context-main">
          <strong>{{ contextSummary.patient }}</strong>
          <span>•</span>
          <span>{{ contextSummary.condition }}</span>
        </div>
        <div class="compact-context-meta">
          <span>{{ contextSummary.learner }}</span>
          <span>•</span>
          <span>Learning opportunity: {{ contextSummary.opportunity }}</span>
        </div>
        <div class="compact-flow">
          <span>Clinical Context</span>
          <b>→</b>
          <span>Educational Intelligence</span>
          <b>→</b>
          <span>Learning Brief</span>
        </div>
      </section>

      <section v-if="activeWorkspace === 'Home'" class="page-grid">
        <div class="hero-panel span-12">
          <div>
            <p class="eyebrow">Mission control</p>
            <h2>One patient context powers learner, faculty, and program insights.</h2>
            <p>Select a patient, generate a learning brief, then watch the same context support faculty teaching and deidentified program review.</p>
            <div class="button-row">
              <button class="primary-button" @click="go('Clinical Learning')">Open Patient Learning</button>
              <button class="secondary-button" @click="go('Programs')">View Program Summary</button>
            </div>
          </div>
          <div class="metric-stack">
            <div v-for="metric in homeMetrics" :key="metric.label">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </div>
          </div>
        </div>

        <div class="card span-8">
          <h3>Platform Activity Feed</h3>
          <div class="timeline">
            <div v-for="item in intelligenceFeed" :key="item.title">
              <span>{{ item.time }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.body }}</p>
            </div>
          </div>
        </div>

        <div class="card span-4 patient-card-large">
          <div class="avatar">{{ initials(selectedPatient.name) }}</div>
          <h3>{{ selectedPatient.name }}</h3>
          <p>{{ selectedPatient.age }}-year-old {{ selectedPatient.gender.toLowerCase() }}</p>
          <p><strong>Setting:</strong> {{ selectedPatient.encounter.location }}</p>
          <p><strong>First barrier:</strong> {{ firstBarrier }}</p>
          <button class="primary-button" @click="go('Clinical Learning')">Learn about this patient</button>
        </div>
      </section>

      <section v-if="activeWorkspace === 'Clinical Learning'" class="page-grid clinical-learning-simple">
        <div class="card span-4 clinical-context-card">
          <p class="eyebrow">Clinical context</p>
          <h3>{{ selectedPatient.name }}</h3>
          <p><strong>{{ selectedDx }}</strong></p>
          <p>{{ selectedPatient.encounter.reasonForAdmission }}</p>
          <h4>Why this patient is a good learning case</h4>
          <ul>
            <li v-for="problem in selectedPatient.problemList.slice(0,5)" :key="problem">{{ problem }}</li>
          </ul>
          <h4>Abnormal labs</h4>
          <ul v-if="abnormalLabs.length">
            <li v-for="lab in abnormalLabs.slice(0,5)" :key="lab.name">{{ lab.name }}: {{ lab.value }} {{ lab.unit }} — {{ lab.flag }}</li>
          </ul>
          <p v-else>No major abnormal labs in this mock chart.</p>
        </div>
        <div class="card span-8 action-card">
          <EducationGenerator :patient="selectedPatient" :learner-role="selectedPersona" :clinical-specialty="selectedSpecialty" @brief-generated="handleBriefGenerated" />
        </div>
      </section>

      <section v-if="activeWorkspace === 'Faculty'" class="page-grid faculty-workspace teaching-companion-workspace">
        <div class="card span-12 workspace-intro">
          <div>
            <p class="eyebrow">Faculty workspace</p>
            <h2>Teaching Companion</h2>
            <p>Turn the current patient context into a brief, practical teaching guide for the supervising clinician.</p>
          </div>
          <button class="secondary-button" @click="exportDossier">Export Educator Dossier</button>
        </div>

        <div class="card span-4 teaching-context-card">
          <p class="eyebrow">Today you're teaching</p>
          <h3>{{ selectedDx }}</h3>
          <div class="teaching-context-list">
            <div><span>Patient</span><strong>{{ selectedPatient.name }}</strong></div>
            <div><span>Learner role</span><strong>{{ selectedPersona }}</strong></div>
            <div><span>Specialty / context</span><strong>{{ selectedSpecialty }}</strong></div>
            <div>
              <span>Estimated teaching time</span>
              <select v-model="estimatedTeachingTime" class="inline-select" @change="resetRoleSensitiveContent()">
                <option>2-3 min</option>
                <option>3-5 min</option>
                <option>5-7 min</option>
                <option>10 min</option>
              </select>
            </div>
          </div>

          <div class="editable-teaching-focus">
            <span>Teaching focus</span>
            <textarea v-model="selectedTeachingFocus" @input="teachingGuide = null; teachingGuideSource = 'not generated'"></textarea>
          </div>

          <div class="focus-chip-grid">
            <button
              v-for="focus in teachingFocusOptions"
              :key="focus"
              :class="{ active: selectedTeachingFocus === focus }"
              @click="chooseTeachingFocus(focus)"
            >
              {{ focus }}
            </button>
          </div>

          <button class="primary-button full-width" :disabled="teachingGuideLoading" @click="generateTeachingGuide">
            {{ teachingGuideLoading ? 'Generating teaching guide...' : 'Generate Teaching Guide' }}
          </button>
          <span class="source-badge">{{ teachingGuideSource }}</span>
        </div>

        <div class="card span-8 teaching-guide-card primary-teaching-output">
          <div v-if="!teachingGuide" class="empty-guide-state">
            <p class="eyebrow">Teaching guide</p>
            <h3>Ready to generate</h3>
            <p>Use the same patient context that powers the learner brief to create a faculty-facing guide: questions to ask, misconceptions to watch for, teaching pearls, and feedback language. Changing the teaching focus above changes the prompt sent to the generator.</p>
          </div>

          <div v-else>
            <p class="eyebrow">Teaching guide</p>
            <h3>{{ teachingGuide.title }}</h3>
            <div class="guide-section highlight">
              <span>Teaching objective</span>
              <p>{{ teachingGuide.teachingObjective }}</p>
            </div>
            <div class="guide-section">
              <span>Before rounds</span>
              <p>{{ teachingGuide.beforeRounds }}</p>
            </div>
            <div class="guide-grid">
              <div>
                <h4>Questions to ask</h4>
                <ul><li v-for="item in teachingGuide.questionsToAsk" :key="item">{{ item }}</li></ul>
              </div>
              <div>
                <h4>Common misconceptions</h4>
                <ul><li v-for="item in teachingGuide.commonMisconceptions" :key="item">{{ item }}</li></ul>
              </div>
              <div>
                <h4>Teaching pearls</h4>
                <ul><li v-for="item in teachingGuide.teachingPearls" :key="item">{{ item }}</li></ul>
              </div>
              <div>
                <h4>Feedback language</h4>
                <ul><li v-for="item in teachingGuide.feedbackTips" :key="item">{{ item }}</li></ul>
              </div>
            </div>
            <div class="guide-section">
              <span>One-Minute Preceptor reminder</span>
              <ol><li v-for="item in teachingGuide.oneMinutePreceptor" :key="item">{{ item }}</li></ol>
            </div>
            <div class="guide-section highlight">
              <span>Follow-up</span>
              <p>{{ teachingGuide.followUp }}</p>
            </div>
            <div class="button-row">
              <button class="primary-button" @click="completeTeachingMoment">Complete Teaching Moment</button>
              <button class="secondary-button" @click="generateTeachingGuide">Regenerate</button>
            </div>
          </div>
        </div>

        <div class="card span-12 faculty-support-row">
          <div>
            <p class="eyebrow">Teaching record</p>
            <h3>{{ facultyDossier.length }} saved artifacts</h3>
            <p>Teaching moments are developmental and faculty-controlled. Generated guides can be saved as educator portfolio artifacts when the faculty member chooses.</p>
          </div>
          <div class="recent-moments compact-recent-moments">
            <div v-for="item in recentTeachingMoments" :key="item.title">
              <strong>{{ item.title }}</strong>
              <span>{{ item.status }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeWorkspace === 'Programs'" class="page-grid program-workspace">
        <div class="card span-12 workspace-intro program-leader-intro">
          <div>
            <p class="eyebrow">Program Review</p>
            <h2>What People Have Been Doing on Precision Education</h2>
            <p>This page summarizes deidentified platform activity from the current session. It reviews learner briefs, faculty teaching guides, reflections, and completed teaching moments without showing patient names.</p>
          </div>
          <div class="program-filter-panel">
            <label>Learner type</label>
            <select v-model="programLearnerFilter">
              <option v-for="role in programLearnerOptions" :key="role" :value="role">{{ role }}</option>
            </select>
          </div>
        </div>

        <div class="card span-12 activity-summary-card">
          <p class="eyebrow">Session summary</p>
          <h3>Deidentified activity review</h3>
          <p>{{ platformReviewSummary }}</p>
          <div class="program-snapshot-grid compact-snapshot">
            <div class="snapshot-card" v-for="item in activityReviewCards" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.detail }}</small>
            </div>
          </div>
        </div>

        <div class="card span-7">
          <h3>Activity Log</h3>
          <p class="subtle">A deidentified review of what was generated or changed during this session.</p>
          <div v-if="!deidentifiedActivityTimeline.length" class="empty-state compact-empty">
            <strong>No platform activity yet</strong>
            <p>When someone generates a learner brief, faculty teaching guide, reflection, or teaching moment, the summary will appear here.</p>
          </div>
          <div v-else class="event-stream summary-event-stream">
            <div v-for="event in deidentifiedActivityTimeline" :key="event.id" class="event-row summary-event-row">
              <span class="event-time">{{ event.time }}</span>
              <div>
                <strong>{{ event.type }}</strong>
                <p>{{ event.topic }}</p>
                <small>{{ event.learnerRole }} · {{ event.specialty }} · {{ event.source }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="card span-5">
          <h3>Program Takeaways</h3>
          <p class="subtle">What a program leader could learn from the activity record.</p>
          <ul class="takeaway-list">
            <li v-for="item in programTakeaways" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="card span-6">
          <h3>Topics People Explored</h3>
          <p class="subtle">Built from the learning topics and teaching focuses selected in this session.</p>
          <div v-if="sessionTopics.length" class="topic-chip-list larger-topic-list">
            <span v-for="topic in sessionTopics" :key="topic" class="topic-chip">{{ topic }}</span>
          </div>
          <p v-else class="subtle">No topics yet.</p>
        </div>

        <div class="card span-6">
          <h3>Outputs Created</h3>
          <div class="engine-learnings output-summary-grid">
            <div>
              <span>Learner briefs</span>
              <strong>{{ sessionOutputs.learningBriefs }}</strong>
            </div>
            <div>
              <span>Faculty teaching guides</span>
              <strong>{{ sessionOutputs.teachingGuides }}</strong>
            </div>
            <div>
              <span>Completed teaching moments</span>
              <strong>{{ sessionOutputs.teachingMoments }}</strong>
            </div>
            <div>
              <span>Context / role changes</span>
              <strong>{{ sessionOutputs.contextChanges }}</strong>
            </div>
          </div>
        </div>

        <div class="card span-12 governance-card">
          <h3>Why this matters</h3>
          <p>At scale, Precision Education can help education leaders understand what learners and faculty are actually doing on the platform: what topics they explore, which roles are using it, what educational products are generated, and which themes may deserve a reusable learning pathway. This view is intentionally deidentified and educational. It does not display patient names, generate clinical recommendations, or create summative judgments about learners or faculty.</p>
        </div>
      </section>

      <section v-if="activeWorkspace === 'Epic View'" class="epic-embedded">
        <aside class="patient-banner">
          <div class="avatar">{{ initials(selectedPatient.name) }}</div>
          <h2>{{ selectedPatient.name }}</h2>
          <p>{{ selectedPatient.gender }}, {{ selectedPatient.age }} y.o.</p>
          <p>MRN: {{ selectedPatient.mrn }}</p>
          <div class="banner-section alert">Allergies: {{ selectedPatient.allergies.join(', ') }}</div>
          <div class="banner-section">Active Problem: {{ selectedDx }}</div>
        </aside>
        <div class="epic-main">
          <div class="epic-tabs">
            <button v-for="tab in ['PrecisionEducation','Summary','Notes','Orders']" :key="tab" :class="{ active: activeEpicTab === tab }" @click="activeEpicTab = tab">{{ tab }}</button>
          </div>
          <div class="alert-strip">Educational content only. Clinical decisions remain with the supervising clinician.</div>
          <div v-if="activeEpicTab === 'PrecisionEducation'" class="card action-card">
            <h3>Precision Learning Brief</h3>
            <p>Same reusable learning experience as the Clinical Learning workspace, embedded in an Epic-style view.</p>
            <EducationGenerator :patient="selectedPatient" :learner-role="selectedPersona" :clinical-specialty="selectedSpecialty" @brief-generated="handleBriefGenerated" />
          </div>
          <div v-if="activeEpicTab === 'Summary'" class="card"><h3>Problem list</h3><ul><li v-for="p in selectedPatient.problemList" :key="p">{{ p }}</li></ul></div>
          <div v-if="activeEpicTab === 'Notes'" class="card"><h3>Notes</h3><div v-for="n in selectedPatient.notes" :key="n.type"><strong>{{ n.type }} — {{ n.author }}</strong><p>{{ n.text }}</p></div></div>
          <div v-if="activeEpicTab === 'Orders'" class="card"><h3>Orders</h3><ul><li v-for="o in selectedPatient.orders" :key="o">{{ o }}</li></ul></div>
        </div>
      </section>
    </main>
  </div>
</template>
