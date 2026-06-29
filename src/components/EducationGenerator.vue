<script setup>
import { computed, ref, watch } from 'vue'
import { buildDeveloperPrompt, buildLearningBriefRequest, generateLearningBriefWithApi, normalizeBrief } from '../lib/educationService'

const props = defineProps({
  patient: Object,
  learnerRole: { type: String, default: 'PGY-1 Resident' },
  clinicalSpecialty: { type: String, default: 'Internal Medicine' }
})
const emit = defineEmits(['brief-generated'])

const learnerQuestion = ref('')
const loading = ref(false)
const brief = ref(null)
const errorMessage = ref('')
const source = ref('local')
const reviewedSources = ref([])
const reflection = ref('')
const developerMode = ref(false)
const hiddenPrompt = ref('')
const selectedIntent = ref('condition_overview')

watch([() => props.patient?.id, () => props.learnerRole, () => props.clinicalSpecialty], () => resetBrief())

const diagnosis = computed(() => props.patient?.encounter?.primaryDiagnosis || 'this condition')
const patientName = computed(() => props.patient?.name || 'this patient')

const learningIntents = computed(() => [
  {
    id: 'condition_overview',
    label: `Explain ${diagnosis.value} in 5 minutes`,
    shortLabel: 'Condition overview',
    question: `Explain ${diagnosis.value} in 5 minutes for a ${props.patient?.age || ''}-year-old patient.`,
    helper: 'Fast overview of the disease or clinical problem.'
  },
  {
    id: 'lab_interpretation',
    label: 'Why are these labs abnormal?',
    shortLabel: 'Abnormal labs',
    question: `Why are this patient's labs abnormal in the context of ${diagnosis.value}?`,
    helper: 'Connect abnormal labs to the condition.'
  },
  {
    id: 'monitoring_priorities',
    label: 'What should I monitor and why?',
    shortLabel: 'What to monitor',
    question: `What should I monitor for this patient with ${diagnosis.value}, and why does each item matter?`,
    helper: 'Learn what changes matter and why.'
  },
  {
    id: 'patient_explanation',
    label: 'How would I explain this to the patient?',
    shortLabel: 'Patient explanation',
    question: `How would I explain ${diagnosis.value} to this patient or family in plain language?`,
    helper: 'Practice clear, patient-centered communication.'
  },
  {
    id: 'preceptor_questions',
    label: 'What should I ask my preceptor?',
    shortLabel: 'Ask my preceptor',
    question: `What are the best learning questions to ask my preceptor about this patient with ${diagnosis.value}?`,
    helper: 'Prepare for bedside or rounds discussion.'
  }
])

const selectedIntentDetails = computed(() => learningIntents.value.find(i => i.id === selectedIntent.value) || learningIntents.value[0])

const contextHighlights = computed(() => {
  if (!props.patient) return []
  return [
    props.patient.encounter?.reasonForAdmission,
    ...(props.patient.problemList || []).slice(0, 4),
    ...(props.patient.dischargePlanning?.barriers || []).slice(0, 2)
  ].filter(Boolean)
})

const reviewedEvidence = computed(() => reviewedSources.value.length > 0)

function resetBrief() {
  learnerQuestion.value = ''
  loading.value = false
  brief.value = null
  errorMessage.value = ''
  source.value = 'local'
  reviewedSources.value = []
  reflection.value = ''
  developerMode.value = false
  hiddenPrompt.value = ''
  selectedIntent.value = 'condition_overview'
}

function chooseIntent(intent) {
  selectedIntent.value = intent.id
  learnerQuestion.value = intent.question
  brief.value = null
  errorMessage.value = ''
  reviewedSources.value = []
  reflection.value = ''
}

function pubmedUrl(query) {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`
}

function markReviewed(label) {
  if (!reviewedSources.value.includes(label)) reviewedSources.value.push(label)
}

function saveReflection() {
  emit('brief-generated', enrichBriefForEvent({
    ...brief.value,
    reflection: reflection.value,
    evidenceReviewed: reviewedSources.value
  }))
}

function buildHiddenPrompt(patient, question) {
  return buildDeveloperPrompt(buildLearningBriefRequest(patient, question, selectedIntent.value, props.learnerRole, props.clinicalSpecialty))
}

function enrichBriefForEvent(data) {
  return {
    ...data,
    _intent: selectedIntent.value,
    _intentLabel: selectedIntentDetails.value?.shortLabel || selectedIntentDetails.value?.label,
    _source: source.value,
    _patientName: patientName.value,
    _condition: diagnosis.value,
    _learnerRole: props.learnerRole,
    _clinicalSpecialty: props.clinicalSpecialty
  }
}

function evidenceFor(dx) {
  return [
    { label: 'Guideline or society statement', description: 'Start with a current guideline or society statement for the condition.', query: `${dx} guideline review` },
    { label: 'Focused review article', description: 'Use a review to connect pathophysiology, monitoring, and common pitfalls.', query: `${dx} pathophysiology review clinical education` },
    { label: 'Primary evidence if needed', description: 'Use primary studies for focused questions after the big picture is clear.', query: `${dx} clinical trial evidence` }
  ]
}

function localBrief(patient, question, intent = selectedIntent.value) {
  const dx = patient.encounter?.primaryDiagnosis || 'this condition'
  const lowerDx = dx.toLowerCase()
  const lowerQ = question.toLowerCase()

  const base = {
    title: selectedIntentDetails.value?.shortLabel ? `${selectedIntentDetails.value.shortLabel} Brief` : 'Precision Learning Brief',
    question,
    whyThisMatters: `${patient.name} is currently hospitalized with ${dx}. This is a good moment to connect the chart context to the learner's question so the learner can understand the patient more quickly before discussing clinical application with the supervising clinician.`,
    fiveMinuteExplanation: `Focus first on the mechanism of ${dx}, then connect that mechanism to the data visible in the chart. Use the patient context for learning, but keep clinical decisions with the supervising clinician.`,
    whatYouAreSeeing: contextHighlights.value,
    keyConcepts: ['Mechanism', 'Clinical pattern', 'Monitoring rationale', 'Patient communication'],
    clinicalPearls: [
      'Start with the pathophysiology before jumping to management.',
      'Use the chart to make learning relevant, not to generate unsupervised clinical actions.',
      'End by naming what you still need to confirm with your preceptor.'
    ],
    sources: evidenceFor(dx),
    preceptorQuestions: [
      `What features of this patient best illustrate ${dx}?`,
      'What findings would change your level of concern?',
      'What source would you recommend I review first?'
    ],
    reflectionPrompt: 'In one sentence, what do you understand better about this patient now?'
  }

  if (intent === 'lab_interpretation') {
    base.title = 'Abnormal Labs Brief'
    base.fiveMinuteExplanation = `Use the patient's abnormal labs as the learning path. For ${dx}, identify which values are abnormal, why the condition can produce those changes, which trends matter, and what questions should be confirmed with the supervising clinician.`
    base.keyConcepts = ['Which labs are abnormal', 'Mechanism behind each abnormality', 'Trends over time', 'Why monitoring matters']
    base.clinicalPearls = ['Do not memorize lab abnormalities as isolated facts; connect each value to the disease mechanism.', 'A trend is often more educational than a single number.', 'Ask your preceptor which abnormality is most concerning and why.']
    base.reflectionPrompt = 'Which lab abnormality now makes the most sense to you, and which one would you ask about on rounds?'
  } else if (intent === 'monitoring_priorities') {
    base.title = 'Monitoring Priorities Brief'
    base.fiveMinuteExplanation = `For ${dx}, focus on what the team is monitoring, why each item matters physiologically, and what clinical uncertainty remains. This is education about monitoring rationale, not a direction to place orders or change care.`
    base.keyConcepts = ['Monitoring rationale', 'Expected trends', 'Warning patterns', 'When to ask for help']
    base.clinicalPearls = ['Monitoring is most useful when you know what change you are looking for.', 'Connect each monitored item to a possible complication.', 'Escalation thresholds are clinical decisions that require supervision.']
    base.reflectionPrompt = 'What is one thing you would watch closely in this patient, and why?'
  } else if (intent === 'patient_explanation') {
    base.title = 'Patient Explanation Brief'
    base.fiveMinuteExplanation = `Translate ${dx} into plain language. Explain what is happening, why the team is watching certain findings, and what the patient or family may be worried about. Avoid jargon and avoid giving patient-specific instructions beyond what the care team has confirmed.`
    base.keyConcepts = ['Plain language', 'Patient concerns', 'Teach-back', 'Avoiding jargon']
    base.clinicalPearls = ['A good explanation starts with what the patient is likely experiencing or worrying about.', 'Use analogies carefully and check understanding.', 'Teach-back is more useful than asking “Do you understand?”']
    base.preceptorQuestions = ['How would you explain this diagnosis to this patient in one minute?', 'What language should I avoid because it may confuse or alarm the patient?', 'What teach-back question would you use?']
    base.reflectionPrompt = 'Write one sentence you could say to the patient or family in plain language.'
  } else if (intent === 'preceptor_questions') {
    base.title = 'Preceptor Discussion Brief'
    base.fiveMinuteExplanation = `Prepare for a focused learning conversation about ${dx}. The goal is to ask questions that reveal clinical reasoning, evidence interpretation, and patient-specific applicability without asking the AI to make patient-care decisions.`
    base.keyConcepts = ['Focused question', 'Clinical reasoning', 'Uncertainty', 'Supervised application']
    base.clinicalPearls = ['The best preceptor questions are specific, patient-linked, and answerable.', 'Ask why the team is monitoring or prioritizing something, not just what the plan is.', 'Close the loop by stating what you learned.']
    base.preceptorQuestions = [`What finding in this patient most strongly supports the diagnosis of ${dx}?`, 'What trend are you watching most closely today and why?', 'What would you recommend I read first to understand this case better?']
    base.reflectionPrompt = 'Which question will you ask your preceptor first?'
  }

  if (lowerDx.includes('tumor lysis')) {
    const tlsBrief = {
      ...base,
      whyThisMatters: `${patient.name} developed tumor lysis syndrome after starting induction therapy for acute myeloid leukemia. The learning priority is to understand why cell breakdown causes electrolyte abnormalities and kidney injury risk.`,
      fiveMinuteExplanation: 'Tumor lysis syndrome occurs when many malignant cells break down quickly and release intracellular contents into the bloodstream. This can increase uric acid, phosphorus, and potassium, lower calcium through calcium-phosphate binding, and stress the kidneys. Frequent lab monitoring helps the team detect high-consequence changes early. This brief is educational and does not replace supervised clinical judgment.',
      whatYouAreSeeing: ['AML receiving induction therapy', 'Hyperuricemia', 'Hyperphosphatemia', 'Hypocalcemia', 'Rising creatinine / kidney injury risk', 'Frequent tumor lysis labs'],
      keyConcepts: ['Rapid cell breakdown', 'Uric acid and kidney injury', 'Phosphorus-calcium relationship', 'Electrolyte monitoring', 'Patient explanation'],
      clinicalPearls: [
        'The lab pattern is not random; it reflects intracellular contents entering the bloodstream after tumor cell breakdown.',
        'Hypocalcemia in TLS often relates to phosphate binding calcium.',
        'Frequent blood draws can be explained to patients as a safety-monitoring tool, not just routine testing.'
      ],
      preceptorQuestions: [
        'Which lab trend worries you most in TLS and why?',
        'How do you explain frequent monitoring to a patient who is overwhelmed?',
        'When reviewing evidence, what source should I start with for TLS risk and monitoring?'
      ]
    }

    if (intent === 'lab_interpretation') {
      return {
        ...tlsBrief,
        title: 'Abnormal Labs Brief',
        whyThisMatters: `${patient.name}'s chart shows the classic lab pattern that makes tumor lysis syndrome a powerful teaching case: high uric acid, high phosphorus, low calcium, high potassium, and kidney injury risk.`,
        fiveMinuteExplanation: 'In tumor lysis syndrome, rapidly breaking tumor cells release intracellular potassium, phosphate, and nucleic acids. Nucleic acids are metabolized into uric acid, which can contribute to kidney injury. High phosphate can bind calcium, which helps explain hypocalcemia. Creatinine is followed because the kidneys are vulnerable when solute load and crystal risk increase. The learning goal is to connect each abnormal value to the mechanism rather than memorize a list.',
        keyConcepts: ['Potassium release from cells', 'Phosphate release from cells', 'Calcium-phosphate binding', 'Uric acid generation', 'Creatinine as kidney stress signal'],
        clinicalPearls: [
          'For TLS, the lab pattern tells the story of cell breakdown.',
          'Low calcium can be a downstream effect of high phosphate.',
          'Creatinine helps learners connect electrolyte abnormalities to organ risk.'
        ],
        preceptorQuestions: ['Which TLS lab trend is most urgent to understand today?', 'How do phosphate and calcium relate in this patient?', 'How do we explain frequent lab checks to a patient?'],
        reflectionPrompt: 'Pick one abnormal lab and explain why it is abnormal in plain language.'
      }
    }

    if (intent === 'monitoring_priorities') {
      return {
        ...tlsBrief,
        title: 'Monitoring Priorities Brief',
        fiveMinuteExplanation: 'For tumor lysis syndrome, monitoring focuses on electrolytes, uric acid, kidney function, urine output, and symptoms that might suggest complications. The reason for frequent monitoring is that changes can occur quickly after cancer cells break down. The learner should understand why the team tracks potassium, phosphorus, calcium, uric acid, creatinine, and urine output, while leaving clinical thresholds and interventions to the supervising team.',
        keyConcepts: ['Electrolyte trends', 'Kidney function', 'Urine output', 'Symptom changes', 'Timing after therapy'],
        clinicalPearls: ['Monitoring is a safety net for rapid biochemical change.', 'The “why” behind q6h labs is early detection, not routine repetition.', 'Ask which trend would change the team’s level of concern.'],
        preceptorQuestions: ['Which lab are we watching most closely today?', 'What trend would change our concern level?', 'How do we balance monitoring with patient burden?'],
        reflectionPrompt: 'What would you monitor most closely in this TLS case, and why?'
      }
    }

    if (intent === 'patient_explanation') {
      return {
        ...tlsBrief,
        title: 'Patient Explanation Brief',
        fiveMinuteExplanation: 'A plain-language explanation could be: “Because the leukemia treatment is breaking down many cancer cells quickly, those cells release substances into the blood. Some of those substances can affect the kidneys or minerals in the blood, so we check labs often to catch changes early and keep you safe.” The learner should practice reassurance without minimizing risk and should use teach-back to confirm understanding.',
        keyConcepts: ['Cancer cells breaking down', 'Minerals released into blood', 'Kidney protection', 'Frequent labs for safety', 'Teach-back'],
        clinicalPearls: ['Start with the patient’s likely question: “Why so many blood draws?”', 'Avoid saying “your labs are bad” without explanation.', 'Use teach-back: “Can you tell me why we are checking these labs so often?”'],
        preceptorQuestions: ['What wording would you use to explain TLS without overwhelming the patient?', 'What should I avoid saying?', 'How would you respond if the patient asks whether this means treatment is hurting them?'],
        reflectionPrompt: 'Write one sentence explaining TLS to the patient without using the words electrolyte, hyperuricemia, or pathophysiology.'
      }
    }

    return tlsBrief
  }

  if (lowerDx.includes('type 1 diabetes') || lowerQ.includes('type one') || lowerQ.includes('type 1') || lowerQ.includes('insulin')) {
    return {
      ...base,
      whyThisMatters: `${patient.name} is hospitalized with type 1 diabetes and hyperglycemia, and the chart notes a sick-day education need. The learner question is directly relevant to explaining insulin safety during illness.`,
      fiveMinuteExplanation: 'Type 1 diabetes involves severe loss of pancreatic beta-cell insulin production. Insulin is needed not only to lower glucose, but also to suppress ketone production. During illness or poor oral intake, patients may need careful supervised adjustment, but insulin is generally still required because lack of insulin can lead to diabetic ketoacidosis. This is educational physiology content, not a medication instruction.',
      whatYouAreSeeing: ['Type 1 diabetes', 'Hyperglycemia', 'Trace ketones', 'Recent nausea and poor oral intake', 'Family uncertainty about sick-day rules'],
      keyConcepts: ['Beta-cell destruction', 'Absolute insulin deficiency', 'Ketone production', 'Sick-day education', 'Supervisor confirmation'],
      clinicalPearls: [
        'Type 1 diabetes is primarily an insulin-deficiency state, not just a high-glucose state.',
        'Insulin helps prevent ketone production even when oral intake is poor.',
        'A learner should distinguish physiology education from patient-specific dosing advice.'
      ],
      preceptorQuestions: [
        'How do we explain “never stop insulin” safely without giving overly simplistic instructions?',
        'What should families know about ketone checks during illness?',
        'What would make this patient’s sick-day plan higher risk?'
      ]
    }
  }

  if (lowerDx.includes('asthma')) {
    return {
      ...base,
      whyThisMatters: `${patient.name} is improving after an asthma exacerbation, but the chart shows caregiver education needs before discharge.`,
      fiveMinuteExplanation: 'Asthma exacerbations involve airway inflammation, bronchospasm, mucus, and trigger exposure. Improvement in breathing is only part of readiness for discharge; learners should also understand inhaler technique, spacer use, action plans, and return precautions.',
      whatYouAreSeeing: ['Asthma exacerbation', 'Improved work of breathing', 'Spacer teaching issue', 'Caregiver concern about return precautions'],
      keyConcepts: ['Airway inflammation', 'Bronchospasm', 'Spacer technique', 'Action plan', 'Teach-back']
    }
  }

  if (lowerDx.includes('heart failure')) {
    return {
      ...base,
      whyThisMatters: `${patient.name} is hospitalized with heart failure exacerbation and has discharge barriers around daily weights, sodium intake, and medication access.`,
      fiveMinuteExplanation: 'Heart failure exacerbations often reflect a mismatch between fluid balance, cardiac function, medications, diet, kidney function, and self-management capacity. Learners should connect volume status findings to patient education and follow-up planning.',
      whatYouAreSeeing: ['Volume overload', 'Elevated BNP', 'CKD stage 3', 'Daily weight gap', 'Medication access concern'],
      keyConcepts: ['Volume status', 'Daily weights', 'Sodium intake', 'Medication access', 'Readmission prevention']
    }
  }

  if (lowerDx.includes('sepsis') || lowerDx.includes('pneumonia')) {
    return {
      ...base,
      whyThisMatters: `${patient.name} is being treated for sepsis due to community-acquired pneumonia, with language preference and delirium risk documented in the chart.`,
      fiveMinuteExplanation: 'Sepsis is a dysregulated response to infection associated with organ dysfunction. For learners, the educational task is to connect infection source, perfusion, oxygen needs, kidney function, reassessment, and communication needs. Urgent clinical changes require supervisor escalation rather than AI use.',
      whatYouAreSeeing: ['Fever and cough', 'Hypotension responsive to fluids', 'Elevated lactate', 'AKI', 'Spanish language preference', 'Delirium risk'],
      keyConcepts: ['Infection source', 'Organ dysfunction', 'Reassessment', 'Interpreter-supported communication', 'Escalation']
    }
  }

  return base
}

async function generateEducation() {
  if (!learnerQuestion.value.trim()) learnerQuestion.value = selectedIntentDetails.value.question
  loading.value = true
  brief.value = null
  errorMessage.value = ''
  source.value = 'local'
  reviewedSources.value = []
  reflection.value = ''
  hiddenPrompt.value = buildHiddenPrompt(props.patient, learnerQuestion.value)

  const fallback = localBrief(props.patient, learnerQuestion.value, selectedIntent.value)
  const request = buildLearningBriefRequest(props.patient, learnerQuestion.value, selectedIntent.value, props.learnerRole, props.clinicalSpecialty)

  try {
    const data = await generateLearningBriefWithApi(request)
    brief.value = normalizeBrief(data.brief || data, fallback)
    brief.value.question = learnerQuestion.value
    source.value = 'api'
    emit('brief-generated', enrichBriefForEvent(brief.value))
    loading.value = false
    return
  } catch (err) {
    errorMessage.value = `${err?.message || 'API unavailable'} Showing local prototype fallback.`
  }

  window.setTimeout(() => {
    brief.value = fallback
    emit('brief-generated', enrichBriefForEvent(brief.value))
    loading.value = false
  }, 350)
}
</script>

<template>
  <div class="learning-brief-shell">
    <section class="learn-question-card">
      <div class="learn-card-header">
        <div>
          <p class="eyebrow">Precision Learning Brief</p>
          <h2>Learn about this patient</h2>
          <p>Choose what you want to learn. Each topic changes the educational intent sent to the generator, so the brief focuses on the right kind of learning.</p>
        </div>
        <span class="coach-badge">Educational use only</span>
      </div>

      <div class="patient-context-strip">
        <strong>{{ patientName }}</strong>
        <span>{{ diagnosis }}</span>
        <span>{{ props.learnerRole }} · {{ props.clinicalSpecialty }}</span>
      </div>

      <label for="learnerQuestion">Learning question</label>
      <textarea id="learnerQuestion" v-model="learnerQuestion" placeholder="Choose a topic below or write your own focused learning question."></textarea>

      <div class="intent-heading">
        <strong>Suggested learning topics</strong>
        <span>{{ selectedIntentDetails.helper }}</span>
      </div>
      <div class="suggestion-row">
        <button
          v-for="intent in learningIntents"
          :key="intent.id"
          type="button"
          class="suggestion-chip"
          :class="{ active: selectedIntent === intent.id }"
          @click="chooseIntent(intent)"
        >
          {{ intent.label }}
        </button>
      </div>

      <button class="primary-button" type="button" :disabled="loading" @click="generateEducation">
        {{ loading ? 'Generating...' : 'Generate Learning Brief' }}
      </button>
      <span v-if="brief" class="source-badge">{{ source === 'api' ? 'Generated by OpenAI API' : 'Generated by local fallback' }}</span>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </section>

    <section v-if="brief" class="brief-output-card">
      <div class="brief-title-row">
        <div>
          <p class="eyebrow">Learner-facing output</p>
          <h2>{{ brief.title }}</h2>
        </div>
        <span class="coach-badge">Clinician remains decision maker</span>
      </div>

      <div class="brief-section emphasis-section">
        <h3>Why this matters for this patient</h3>
        <p>{{ brief.whyThisMatters }}</p>
      </div>

      <div class="brief-section">
        <h3>Five-minute explanation</h3>
        <p>{{ brief.fiveMinuteExplanation }}</p>
      </div>

      <div class="brief-section">
        <h3>What you are seeing in the chart</h3>
        <div class="concept-grid">
          <span v-for="item in brief.whatYouAreSeeing" :key="item">{{ item }}</span>
        </div>
      </div>

      <div class="two-column-brief">
        <div class="brief-section">
          <h3>Key concepts</h3>
          <ul>
            <li v-for="concept in brief.keyConcepts" :key="concept">{{ concept }}</li>
          </ul>
        </div>
        <div class="brief-section">
          <h3>Clinical pearls</h3>
          <ul>
            <li v-for="pearl in brief.clinicalPearls" :key="pearl">{{ pearl }}</li>
          </ul>
        </div>
      </div>

      <div class="brief-section">
        <h3>Recommended sources to review</h3>
        <p>Open at least one source to practice checking that the brief is supported by trustworthy evidence.</p>
        <div class="evidence-list">
          <a v-for="item in brief.sources" :key="item.label" class="evidence-source" :href="pubmedUrl(item.query)" target="_blank" rel="noopener" @click="markReviewed(item.label)">
            <span>
              <b>{{ item.label }}</b>
              <small>{{ item.description }}</small>
            </span>
            <em>{{ reviewedSources.includes(item.label) ? 'Reviewed' : 'Open source' }}</em>
          </a>
        </div>
        <p class="verification-note" :class="{ verified: reviewedEvidence }">{{ reviewedEvidence ? 'Source review recorded.' : 'Source review not yet recorded.' }}</p>
      </div>

      <div class="brief-section">
        <h3>Questions to discuss with your preceptor</h3>
        <ul>
          <li v-for="question in brief.preceptorQuestions" :key="question">{{ question }}</li>
        </ul>
      </div>

      <div class="brief-section reflection-box">
        <h3>Reflection</h3>
        <p>{{ brief.reflectionPrompt }}</p>
        <textarea v-model="reflection" placeholder="Write one sentence here..."></textarea>
        <button class="secondary-button" type="button" :disabled="!reflection.trim()" @click="saveReflection">Save reflection to portfolio</button>
      </div>

      <details class="developer-prompt">
        <summary>Developer mode: educational intelligence details</summary>
        <pre>{{ hiddenPrompt }}</pre>
      </details>
    </section>
  </div>
</template>
