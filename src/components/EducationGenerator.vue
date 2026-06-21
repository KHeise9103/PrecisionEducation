<script setup>
import { ref, watch, computed } from "vue"
import { supabase } from "../lib/supabase"

const props = defineProps({
  patient: Object
})

const loading = ref(false)
const brief = ref(null)
const errorMessage = ref("")

watch(
  () => props.patient.id,
  () => {
    brief.value = null
    errorMessage.value = ""
    loading.value = false
  }
)

function safeList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === "string") return [value]
  return []
}

function pubmedUrl(query) {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`
}

const clinicalInsights = computed(() => brief.value?.clinicalInsights || {})
const clinicalPearls = computed(() => brief.value?.clinicalPearls || {})
const evidenceReview = computed(() => brief.value?.evidenceReview || {})

async function generateEducation() {
  loading.value = true
  brief.value = null
  errorMessage.value = ""

  try {
    const { data, error } = await supabase.functions.invoke(
      "generate-learning-brief",
      {
        body: {
          patient: props.patient
        }
      }
    )

    if (error) {
      console.error("Supabase function error:", error)
      errorMessage.value = "Error generating clinical learning brief."
      return
    }

    console.log("Function data:", data)
console.log("Brief object:", data?.brief)
console.log(
  "What Matters Most:",
  data?.brief?.clinicalInsights?.whatMattersMost
)

    brief.value = data?.brief?.brief || data?.brief || null

    if (!brief.value) {
      errorMessage.value = "No structured brief returned."
    }
  } catch (err) {
    console.error("Unexpected error:", err)
    errorMessage.value = "Unexpected error generating clinical learning brief."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="education-generator">
    <button @click="generateEducation" :disabled="loading">
      {{ loading ? "Generating..." : "Generate Clinical Learning Brief" }}
    </button>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <div v-if="brief" class="learning-output">
      <section class="insight-card">
        <h2>Clinical Insights</h2>

        <h3>What Matters Most</h3>
        <ul>
          <li v-for="item in safeList(clinicalInsights.whatMattersMost)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>Key Risks</h3>
        <ul>
          <li v-for="item in safeList(clinicalInsights.keyRisks)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>Reinforce Today</h3>
        <ul>
          <li v-for="item in safeList(clinicalInsights.reinforceToday)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>Anticipate Next</h3>
        <ul>
          <li v-for="item in safeList(clinicalInsights.anticipateNext)" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>

      <section class="insight-card">
        <h2>Clinical Pearls</h2>

        <h3>Frequently Missed</h3>
        <ul>
          <li v-for="item in safeList(clinicalPearls.frequentlyMissed)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>High Consequence Concepts</h3>
        <ul>
          <li v-for="item in safeList(clinicalPearls.highConsequenceConcepts)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>Attending Pearls</h3>
        <ul>
          <li v-for="item in safeList(clinicalPearls.attendingPearls)" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>

      <section class="insight-card">
        <h2>Evidence Review</h2>

        <h3>Patient-Relevant Summary</h3>
        <ul>
          <li v-for="item in safeList(evidenceReview.patientRelevantSummary)" :key="item">
            {{ item }}
          </li>
        </ul>

        <h3>PubMed Searches</h3>
        <ul>
          <li v-for="search in safeList(evidenceReview.pubmedSearches)" :key="search.query || search">
            <a
              :href="pubmedUrl(search.query || search)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ search.label || search.query || search }}
            </a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>