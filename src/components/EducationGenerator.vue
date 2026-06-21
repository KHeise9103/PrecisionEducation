<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  patient: Object
})

const loading = ref(false)
const learningFocus = ref("Overview")
const learningBrief = ref("")

watch(
  () => props.patient.id,
  () => {
    learningBrief.value = ""
    loading.value = false
    learningFocus.value = "Overview"
  }
)

function generateEducation() {
  loading.value = true

  setTimeout(() => {
    learningBrief.value = buildBrief(props.patient, learningFocus.value)
    loading.value = false
  }, 500)
}

function formatList(items) {
  return items.map(item => `- ${item}`).join("\n")
}

function buildArticleSearches(patient, focus) {
  const baseSearches = [
    `${patient.diagnosis} pediatric clinical education`,
    `${patient.diagnosis} discharge readiness pediatric`,
    `${patient.learningNeed} pediatric care team education`,
    `teach-back pediatric hospitalization discharge`
  ]

  if (focus === "Medication Education") {
    baseSearches.unshift(`${patient.diagnosis} medication education pediatric`)
  }

  if (focus === "Discharge Readiness") {
    baseSearches.unshift(`${patient.diagnosis} pediatric discharge transition readmission`)
  }

  if (focus === "Nursing Education") {
    baseSearches.unshift(`${patient.diagnosis} nursing education pediatric inpatient`)
  }

  if (focus === "Resident Teaching") {
    baseSearches.unshift(`${patient.diagnosis} resident education pediatric hospital medicine`)
  }

  return baseSearches.map(search => `- PubMed search: "${search}"`).join("\n")
}

function buildStandardSections(patient, focus, options = {}) {
  const {
    why,
    teachingPoints,
    bedsideApplication,
    commonPitfalls
  } = options

  return `
${focus} Brief: ${patient.diagnosis}

Why this matters for this patient:
${why}

Care team teaching points:
${formatList(teachingPoints)}

Bedside application:
${formatList(bedsideApplication)}

Common pitfalls:
${formatList(commonPitfalls)}

Evidence and article recommendations:
${buildArticleSearches(patient, focus)}

Recommendation:
Use these searches to confirm current peer-reviewed articles, guidelines, and institutional standards before citing specific literature.
`
}

function buildBrief(patient, focus) {
  const clinicalPearls = patient.clinicalPearls
  const evidenceSummary = patient.evidenceSummary
  const learningTopics = patient.learningTopics
  const medications = patient.medications

  const briefs = {
    Overview: buildStandardSections(patient, "Clinical Learning", {
      why:
        `This admission creates a focused learning opportunity around ${patient.learningNeed}. The care team should connect the active diagnosis, hospital course, and discharge plan to the specific risks that could lead to confusion, delayed recovery, or return care.`,
      teachingPoints: [
        `Connect ${patient.diagnosis} to the current admission rather than giving generic disease education.`,
        `Explain how the hospital course changes the immediate teaching priorities.`,
        `Clarify what improvement looks like and what should prompt concern.`,
        `Identify what the team needs to reinforce before discharge.`,
        `Use team discussion or teach-back to confirm shared understanding.`
      ],
      bedsideApplication: [
        `Ask what the patient or family is most worried about.`,
        `Confirm the bedside team is giving consistent instructions.`,
        `Reinforce the highest-risk transition point before discharge.`,
        `Identify whether nursing, APP, resident, or attending teaching is still needed.`
      ],
      commonPitfalls: [
        `Repeating textbook education without tying it to this admission.`,
        `Assuming discharge readiness because symptoms have improved.`,
        `Missing medication confusion or follow-up barriers.`,
        `Failing to document remaining education needs.`
      ]
    }),

    "Clinical Pearls": buildStandardSections(patient, "Clinical Pearls", {
      why:
        `The most useful education for this patient is focused on high-yield clinical concepts that change bedside decision-making today.`,
      teachingPoints: clinicalPearls,
      bedsideApplication: [
        `Ask the learner to choose one pearl and apply it to this patient’s discharge plan.`,
        `Discuss which pearl is most likely to prevent return care.`,
        `Use rounds to connect the pearl to medications, follow-up, or escalation planning.`,
        `Have the team identify one misconception that could create an unsafe transition.`
      ],
      commonPitfalls: [
        `Listing pearls without applying them to the patient’s current risk.`,
        `Overlooking how nursing reinforcement affects discharge readiness.`,
        `Assuming all staff interpret the same warning signs consistently.`,
        `Missing the chance to turn routine care into focused teaching.`
      ]
    }),

    "Evidence Review": buildStandardSections(patient, "Evidence Review", {
      why:
        `The evidence question is how clinical education and discharge preparation can reduce risk during transition home for a patient with ${patient.diagnosis}.`,
      teachingPoints: evidenceSummary,
      bedsideApplication: [
        `Translate evidence into one or two actions the team can reinforce today.`,
        `Identify what the bedside nurse, APP, resident, or physician should clarify.`,
        `Use evidence to support consistent discharge messaging.`,
        `Confirm whether local policy or guideline recommendations should be reviewed.`
      ],
      commonPitfalls: [
        `Treating suggested article topics as verified citations.`,
        `Using adult evidence when pediatric-specific evidence is available.`,
        `Focusing only on diagnosis management while missing transition-of-care risks.`,
        `Failing to check whether institutional guidance differs from published recommendations.`
      ]
    }),

    "Teaching Points": buildStandardSections(patient, "Teaching Points", {
      why:
        `This patient context can be used to teach how diagnosis, hospital course, discharge planning, and follow-up fit together in real clinical workflow.`,
      teachingPoints: [
        `Why ${patient.diagnosis} matters for this admission.`,
        `How the hospital course informs current readiness and risk.`,
        `Which education gaps could affect safety after discharge.`,
        `How medications support the current care plan.`,
        `What follow-up plan is needed and why.`
      ],
      bedsideApplication: [
        `Use the case to ask learners what must be true before discharge.`,
        `Have the team identify the highest-value teaching point for today.`,
        `Ask what information should be reinforced by nursing versus the provider team.`,
        `Connect the follow-up plan to the patient’s specific risk factors.`
      ],
      commonPitfalls: [
        `Teaching the disease without teaching the transition.`,
        `Overloading the team with too many learning topics.`,
        `Missing the practical bedside behaviors that support understanding.`,
        `Failing to prioritize the one or two highest-risk issues.`
      ]
    }),

    "Discharge Readiness": buildStandardSections(patient, "Discharge Readiness", {
      why:
        `The discharge plan is not just a disposition decision; it depends on whether the clinical trajectory, education needs, family concerns, and follow-up plan are aligned.`,
      teachingPoints: [
        `Current discharge plan: ${patient.dischargePlan}`,
        `Family or caregiver concern: ${patient.caregiverConcern}`,
        `Follow-up plan: ${patient.followUp}`,
        `Readiness should include clinical stability and understanding of next steps.`,
        `Education gaps can become safety risks after discharge.`
      ],
      bedsideApplication: [
        `Ask the team what would make this patient unsafe for discharge today.`,
        `Confirm whether the family can explain the plan in their own words.`,
        `Clarify who is responsible for final education reinforcement.`,
        `Make sure follow-up and escalation instructions are specific.`
      ],
      commonPitfalls: [
        `Equating clinical improvement with discharge readiness.`,
        `Leaving caregiver concerns unresolved.`,
        `Assuming follow-up is clear because it is written in the plan.`,
        `Not identifying what education still needs reinforcement.`
      ]
    }),

    "Medication Education": buildStandardSections(patient, "Medication Education", {
      why:
        `Medication education should connect each medication to the active clinical problem and the patient’s specific learning need, not simply list medication names.`,
      teachingPoints: [
        ...medications.map(med => `Medication to review: ${med}`),
        `Explain purpose, timing, route, and expected duration when applicable.`,
        `Identify common misunderstandings or adherence barriers.`,
        `Clarify which symptoms should prompt escalation.`,
        `Connect the medication plan back to ${patient.diagnosis}.`
      ],
      bedsideApplication: [
        `Ask the learner to explain each medication in plain clinical language.`,
        `Confirm whether the family or patient can describe when and how each medication is used.`,
        `Identify whether nursing or pharmacy teaching is needed.`,
        `Reinforce the medication most likely to be misunderstood.`
      ],
      commonPitfalls: [
        `Assuming prior medication use means current understanding.`,
        `Explaining how to take a medication without explaining why it matters.`,
        `Missing barriers such as access, timing, device technique, or side effects.`,
        `Not checking whether instructions match the discharge plan.`
      ]
    }),

    "Resident Teaching": buildStandardSections(patient, "Resident Teaching", {
      why:
        `This case is useful for teaching residents how to move from diagnosis and treatment to discharge readiness, anticipatory guidance, and risk reduction.`,
      teachingPoints: [
        `Frame the admission around ${patient.admissionReason}.`,
        `Ask what clinical markers indicate improvement.`,
        `Discuss what could delay discharge.`,
        `Identify what anticipatory guidance matters most.`,
        `Explain why the follow-up plan is appropriate.`
      ],
      bedsideApplication: [
        `Ask the resident to summarize the case in one sentence.`,
        `Have the resident identify the top discharge risk.`,
        `Ask what education must be completed before discharge.`,
        `Have the resident propose follow-up and escalation guidance.`
      ],
      commonPitfalls: [
        `Stopping the teaching discussion once the diagnosis is made.`,
        `Missing the difference between treatment response and transition readiness.`,
        `Giving generic anticipatory guidance.`,
        `Not connecting the family concern to the discharge plan.`
      ]
    }),

    "Nursing Education": buildStandardSections(patient, "Nursing Education", {
      why:
        `Nursing education is central because bedside reinforcement often determines whether the care plan is understood, repeated consistently, and ready for transition home.`,
      teachingPoints: [
        `Bedside education focus: ${patient.learningNeed}`,
        `Assess understanding during routine care.`,
        `Reinforce medication purpose and timing.`,
        `Identify barriers to discharge readiness.`,
        `Document teach-back or remaining education needs.`
      ],
      bedsideApplication: [
        `Ask the patient or family to describe the plan in their own words.`,
        `Watch for inconsistent explanations between team members.`,
        `Escalate unclear readiness concerns to the provider team.`,
        `Use routine medication administration or care tasks as teaching moments.`
      ],
      commonPitfalls: [
        `Assuming provider education has been understood.`,
        `Documenting education completed without assessing comprehension.`,
        `Missing family anxiety as a signal that teaching needs reinforcement.`,
        `Waiting until discharge paperwork to start education.`
      ]
    })
  }

  return briefs[focus] || briefs.Overview
}
</script>

<template>
  <div class="education-generator">
    <div class="generator-controls">
      <label for="learningFocus">Learning Focus</label>

      <select id="learningFocus" v-model="learningFocus">
        <option>Overview</option>
        <option>Clinical Pearls</option>
        <option>Evidence Review</option>
        <option>Teaching Points</option>
        <option>Discharge Readiness</option>
        <option>Medication Education</option>
        <option>Resident Teaching</option>
        <option>Nursing Education</option>
      </select>

      <button @click="generateEducation" :disabled="loading">
        {{ loading ? "Generating..." : "Generate Clinical Learning Brief" }}
      </button>
    </div>

    <div v-if="learningBrief" class="education-output">
      <h2>{{ learningFocus }} Brief</h2>
      <pre>{{ learningBrief }}</pre>
    </div>
  </div>
</template>