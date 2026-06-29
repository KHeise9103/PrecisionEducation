import { supabase } from './supabase'

export function buildLearningBriefRequest(patient, learnerQuestion, educationalIntent = 'condition_overview', learnerRole = 'PGY-1 Resident', clinicalSpecialty = 'Internal Medicine') {
  return {
    mode: 'precision-learning-brief',
    learnerRole,
    clinicalSpecialty,
    learnerQuestion,
    educationalIntent,
    patient: {
      id: patient?.id,
      name: patient?.name,
      age: patient?.age,
      gender: patient?.gender,
      language: patient?.language,
      encounter: patient?.encounter,
      problemList: patient?.problemList || [],
      vitals: patient?.vitals || [],
      labs: patient?.labs || [],
      medications: patient?.medications || [],
      orders: patient?.orders || [],
      notes: patient?.notes || [],
      dischargePlanning: patient?.dischargePlanning || {}
    },
    guardrails: [
      'Educational content only',
      'Do not recommend diagnoses, orders, medication changes, or patient-specific treatment decisions',
      'Use patient context to identify learning opportunities, not to direct care',
      'Make uncertainty explicit and direct the learner to discuss clinical application with the supervising clinician'
    ]
  }
}

export function buildDeveloperPrompt(request) {
  const patient = request.patient || {}
  return [
    'You are Precision Education, an educational intelligence service embedded in clinical workflow.',
    'Generate learner-facing educational content only. Do not provide clinical decision support.',
    `Learner role: ${request.learnerRole}`,
    `Clinical specialty/context: ${request.clinicalSpecialty || 'Not specified'}`,
    `Learner question: ${request.learnerQuestion}`,
    `Educational intent: ${request.educationalIntent || 'condition_overview'}`
    + `
Patient learning context: ${patient.encounter?.primaryDiagnosis || 'unknown condition'}`,
    `Reason for admission: ${patient.encounter?.reasonForAdmission || 'not provided'}`,
    `Relevant problems: ${(patient.problemList || []).join('; ')}`,
    `Relevant labs: ${(patient.labs || []).map(l => `${l.name}: ${l.value} ${l.unit || ''} (${l.flag || 'unflagged'})`).join('; ')}`,
    `Relevant notes: ${(patient.notes || []).map(n => `${n.type}: ${n.text}`).join(' | ')}`,
    `Discharge or education barriers: ${(patient.dischargePlanning?.barriers || []).join('; ')}`,
    '',
    'Return strict JSON with these keys:',
    'title, question, whyThisMatters, fiveMinuteExplanation, whatYouAreSeeing, keyConcepts, clinicalPearls, sources, preceptorQuestions, reflectionPrompt.',
    'sources must be an array of objects with label, description, query.',
    'Keep it concise and appropriate for the learner role.'
  ].join('\n')
}

export function normalizeBrief(raw, fallback) {
  const source = raw?.brief || raw || {}
  return {
    ...fallback,
    ...source,
    title: source.title || fallback.title || 'Precision Learning Brief',
    question: source.question || fallback.question,
    whyThisMatters: source.whyThisMatters || fallback.whyThisMatters,
    fiveMinuteExplanation: source.fiveMinuteExplanation || fallback.fiveMinuteExplanation,
    whatYouAreSeeing: Array.isArray(source.whatYouAreSeeing) ? source.whatYouAreSeeing : fallback.whatYouAreSeeing,
    keyConcepts: Array.isArray(source.keyConcepts) ? source.keyConcepts : fallback.keyConcepts,
    clinicalPearls: Array.isArray(source.clinicalPearls) ? source.clinicalPearls : fallback.clinicalPearls,
    sources: Array.isArray(source.sources) ? source.sources : fallback.sources,
    preceptorQuestions: Array.isArray(source.preceptorQuestions) ? source.preceptorQuestions : fallback.preceptorQuestions,
    reflectionPrompt: source.reflectionPrompt || fallback.reflectionPrompt
  }
}

export async function generateLearningBriefWithApi(request) {
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  if (!hasSupabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use generated content.')
  }

  const { data, error } = await supabase.functions.invoke('generate-learning-brief', { body: request })
  if (error) throw error
  if (!data) throw new Error('The API returned no data.')
  return data
}


export function buildFacultyTeachingGuideRequest(patient, learnerRole = 'PGY-1 Resident', learnerBrief = null, options = {}) {
  return {
    mode: 'faculty-teaching-guide',
    learnerRole,
    clinicalSpecialty: options.clinicalSpecialty || 'Internal Medicine',
    educationalIntent: 'faculty_teaching_companion',
    teachingFocus: options.teachingFocus || patient?.encounter?.primaryDiagnosis || 'Patient-specific teaching moment',
    estimatedTeachingTime: options.estimatedTeachingTime || '3-5 min',
    learnerBrief,
    patient: {
      id: patient?.id,
      name: patient?.name,
      age: patient?.age,
      gender: patient?.gender,
      language: patient?.language,
      encounter: patient?.encounter,
      problemList: patient?.problemList || [],
      vitals: patient?.vitals || [],
      labs: patient?.labs || [],
      medications: patient?.medications || [],
      orders: patient?.orders || [],
      notes: patient?.notes || [],
      dischargePlanning: patient?.dischargePlanning || {}
    },
    guardrails: [
      'Educational faculty development support only',
      'Do not recommend diagnoses, orders, medication changes, or patient-specific treatment decisions',
      'Help the faculty member teach, coach, and assess educational reasoning under supervision',
      'Frame all recommendations as developmental teaching support, not faculty surveillance'
    ]
  }
}

export function fallbackTeachingGuide(patient, learnerRole = 'PGY-1 Resident', teachingFocus = '', estimatedTeachingTime = '3-5 min', clinicalSpecialty = 'Internal Medicine') {
  const dx = patient?.encounter?.primaryDiagnosis || 'this patient\'s condition'
  const focus = teachingFocus || `Teaching ${dx}`
  const abnormal = (patient?.labs || []).filter(l => l.flag && l.flag !== 'Normal')
  const topLabs = abnormal.length
    ? abnormal.slice(0, 4).map(l => `${l.name} ${l.value}${l.unit ? ' ' + l.unit : ''} (${l.flag})`)
    : ['the most relevant chart findings']
  const firstNote = patient?.notes?.[0]?.text || patient?.encounter?.reasonForAdmission || ''

  return {
    title: `${dx}: ${focus}`,
    teachingObjective: `Use this case to help the learner connect the patient\'s clinical pattern with one transferable concept: ${focus}.`,
    beforeRounds: `Take ${estimatedTeachingTime} to choose one chart finding that makes the teaching point concrete. For this case, a useful starting point is ${topLabs[0]}.`,
    questionsToAsk: [
      `What is the key mechanism behind ${dx} in this patient?`,
      `Which chart finding best supports your explanation?`,
      `How would you explain this concept to the patient or family in plain language?`,
      'What evidence or supervisor input would you review before applying this learning to care?'
    ],
    commonMisconceptions: [
      'Memorizing findings without explaining the underlying mechanism.',
      'Using AI-generated educational content as if it were a patient-specific care recommendation.',
      'Skipping the step of naming uncertainty or confirming clinical application with a supervisor.'
    ],
    teachingPearls: [
      `${dx} becomes easier to teach when the learner connects mechanism to observable chart data.`,
      `High-yield findings for discussion: ${topLabs.join('; ')}.`,
      firstNote ? `A useful chart anchor is: ${firstNote.slice(0, 160)}${firstNote.length > 160 ? '...' : ''}` : 'Ask the learner to identify one finding that changed their understanding of the case.'
    ],
    feedbackTips: [
      'You connected the chart finding to the mechanism clearly; next time, add what uncertainty remains.',
      'That was a focused learning question. Now verify one supporting source and state how well it applies here.',
      'Try translating the concept into patient-friendly language before using technical terms.'
    ],
    oneMinutePreceptor: [
      'Get a commitment: ask for the learner\'s explanation first.',
      'Probe reasoning: ask which chart findings support that explanation.',
      'Teach one general rule that transfers to the next patient.',
      'Reinforce one behavior and correct one misconception.'
    ],
    followUp: 'After rounds, ask the learner to save one reflection or one question they would discuss with the supervising clinician.',
    source: 'local fallback'
  }
}

export function normalizeTeachingGuide(raw, fallback) {
  const source = raw?.teachingGuide || raw?.guide || raw || {}
  return {
    ...fallback,
    ...source,
    title: source.title || fallback.title,
    teachingObjective: source.teachingObjective || fallback.teachingObjective,
    beforeRounds: source.beforeRounds || fallback.beforeRounds,
    questionsToAsk: Array.isArray(source.questionsToAsk) ? source.questionsToAsk : fallback.questionsToAsk,
    commonMisconceptions: Array.isArray(source.commonMisconceptions) ? source.commonMisconceptions : fallback.commonMisconceptions,
    teachingPearls: Array.isArray(source.teachingPearls) ? source.teachingPearls : fallback.teachingPearls,
    feedbackTips: Array.isArray(source.feedbackTips) ? source.feedbackTips : fallback.feedbackTips,
    oneMinutePreceptor: Array.isArray(source.oneMinutePreceptor) ? source.oneMinutePreceptor : fallback.oneMinutePreceptor,
    followUp: source.followUp || fallback.followUp,
    source: raw?.source || source.source || fallback.source
  }
}

export async function generateFacultyTeachingGuideWithApi(request) {
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  if (!hasSupabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use generated content.')
  }

  const { data, error } = await supabase.functions.invoke('generate-learning-brief', { body: request })
  if (error) throw error
  if (!data) throw new Error('The API returned no data.')
  return data
}
