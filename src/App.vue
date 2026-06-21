<script setup>
import { ref } from "vue"

import { mockPatients } from "./data/mockPatients"
import EducationGenerator from "./components/EducationGenerator.vue"

const selectedPatient = ref(mockPatients[0])
const showPatientBanner = ref(false)
const activeTab = ref("PrecisionEducation")

function selectPatient(patient) {
  selectedPatient.value = patient
  showPatientBanner.value = false
}

function setTab(tab) {
  activeTab.value = tab
}
</script>

<template>
  <div class="epic-shell">
    <button
      class="patient-toggle"
      @click="showPatientBanner = !showPatientBanner"
    >
      Patient
    </button>

    <div
      v-if="showPatientBanner"
      class="drawer-backdrop"
      @click="showPatientBanner = false"
    ></div>

    <aside class="patient-banner" :class="{ open: showPatientBanner }">
      <button class="drawer-close" @click="showPatientBanner = false">
        ×
      </button>

      <div class="avatar">
        {{
          selectedPatient.name
            .split(" ")
            .map(n => n[0])
            .join("")
        }}
      </div>

      <h2>{{ selectedPatient.name }}</h2>
      <p>{{ selectedPatient.gender }}, {{ selectedPatient.age }} y.o.</p>
      <p>MRN: {{ selectedPatient.mrn }}</p>
      <p>Language: {{ selectedPatient.language }}</p>

      <div class="banner-section alert">
        Allergies: {{ selectedPatient.allergies.join(", ") }}
      </div>

      <div class="banner-section">
        Level of Care: {{ selectedPatient.encounter.location }}
      </div>

      <div class="banner-section">
        Active Problem: {{ selectedPatient.encounter.primaryDiagnosis }}
      </div>

      <div class="banner-section">
        Follow Up: {{ selectedPatient.dischargePlanning.followUp }}
      </div>
    </aside>

    <main class="main-area">
      <div class="top-bar">
        <button
          v-for="tab in ['Chart Review', 'Summary', 'Results', 'Notes', 'Orders', 'PrecisionEducation']"
          :key="tab"
          :class="{ active: activeTab === tab }"
          @click="setTab(tab)"
        >
          {{ tab }}
        </button>
      </div>

      <header class="module-header">
        <div>
          <h1>{{ activeTab }}</h1>
          <span class="module-label">PrecisionEducation Clinical Learning Assistant</span>
        </div>

        <select
          @change="selectPatient(mockPatients[$event.target.value])"
        >
          <option
            v-for="(patient, index) in mockPatients"
            :key="patient.id"
            :value="index"
          >
            {{ patient.name }}, {{ patient.age }} y.o. — {{ patient.encounter.primaryDiagnosis }}
          </option>
        </select>
      </header>

      <div class="alert-strip">
        Clinical learning content is generated from available chart context and should be reviewed before use.
      </div>

      <section class="grid">
        <template v-if="activeTab === 'PrecisionEducation'">
          <div class="card wide action-card">
            <div class="card-title green">
              Generate Clinical Learning Brief
            </div>

            <EducationGenerator :patient="selectedPatient" />
          </div>
        </template>

        <template v-if="activeTab === 'Summary' || activeTab === 'PrecisionEducation'">
          <div class="card wide">
            <div class="card-title teal">
              Clinical Snapshot
            </div>

            <p>
              <strong>{{ selectedPatient.name }}</strong>
              is a {{ selectedPatient.age }}-year-old
              {{ selectedPatient.gender.toLowerCase() }}
              admitted for
              <strong>{{ selectedPatient.encounter.reasonForAdmission }}</strong>.
            </p>

            <p>
              <strong>Primary Diagnosis:</strong>
              {{ selectedPatient.encounter.primaryDiagnosis }}
            </p>

            <p>
              <strong>Disposition Plan:</strong>
              {{ selectedPatient.dischargePlanning.expectedDisposition }}
            </p>

            <p>
              <strong>Current Barriers:</strong>
              {{ selectedPatient.dischargePlanning.barriers.join(", ") }}
            </p>

            <p>
              <strong>Patient / Family Concern:</strong>
              {{ selectedPatient.dischargePlanning.familyConcern }}
            </p>
          </div>
        </template>

        <template v-if="activeTab === 'Chart Review' || activeTab === 'Summary'">
          <div class="card">
            <div class="card-title blue">
              Problem List
            </div>

            <ul>
              <li v-for="problem in selectedPatient.problemList" :key="problem">
                {{ problem }}
              </li>
            </ul>
          </div>

          <div class="card">
            <div class="card-title purple">
              Encounter
            </div>

            <p><strong>Location:</strong> {{ selectedPatient.encounter.location }}</p>
            <p><strong>Code Status:</strong> {{ selectedPatient.encounter.codeStatus }}</p>
            <p><strong>Reason:</strong> {{ selectedPatient.encounter.reasonForAdmission }}</p>
          </div>

          <div class="card">
            <div class="card-title orange">
              Discharge Planning
            </div>

            <p><strong>Expected:</strong> {{ selectedPatient.dischargePlanning.expectedDisposition }}</p>
            <p><strong>Follow-up:</strong> {{ selectedPatient.dischargePlanning.followUp }}</p>

            <ul>
              <li v-for="barrier in selectedPatient.dischargePlanning.barriers" :key="barrier">
                {{ barrier }}
              </li>
            </ul>
          </div>

          <div class="card">
            <div class="card-title pink">
              Allergies
            </div>

            <ul>
              <li v-for="allergy in selectedPatient.allergies" :key="allergy">
                {{ allergy }}
              </li>
            </ul>
          </div>
        </template>

        <template v-if="activeTab === 'Results'">
          <div class="card wide">
            <div class="card-title teal">
              Recent Vitals
            </div>

            <table class="epic-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Temp</th>
                  <th>HR</th>
                  <th>RR</th>
                  <th>BP</th>
                  <th>SpO2</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vital in selectedPatient.vitals" :key="vital.time">
                  <td>{{ vital.time }}</td>
                  <td>{{ vital.temp }}</td>
                  <td>{{ vital.hr }}</td>
                  <td>{{ vital.rr }}</td>
                  <td>{{ vital.bp }}</td>
                  <td>{{ vital.spo2 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card wide">
            <div class="card-title blue">
              Recent Labs
            </div>

            <table class="epic-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Flag</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lab in selectedPatient.labs" :key="lab.name">
                  <td>{{ lab.name }}</td>
                  <td>{{ lab.value }}</td>
                  <td>{{ lab.unit }}</td>
                  <td>{{ lab.flag }}</td>
                  <td>{{ lab.reference }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-if="activeTab === 'Notes'">
          <div
            class="card wide"
            v-for="note in selectedPatient.notes"
            :key="note.type + note.author"
          >
            <div class="card-title teal">
              {{ note.type }}
            </div>

            <p><strong>Author:</strong> {{ note.author }}</p>
            <p>{{ note.text }}</p>
          </div>
        </template>

        <template v-if="activeTab === 'Orders'">
          <div class="card wide">
            <div class="card-title orange">
              Active Orders
            </div>

            <ul>
              <li v-for="order in selectedPatient.orders" :key="order">
                {{ order }}
              </li>
            </ul>
          </div>

          <div class="card wide">
            <div class="card-title purple">
              Active Medications
            </div>

            <table class="epic-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dose</th>
                  <th>Route</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="med in selectedPatient.medications" :key="med.name">
                  <td>{{ med.name }}</td>
                  <td>{{ med.dose }}</td>
                  <td>{{ med.route }}</td>
                  <td>{{ med.frequency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </section>
    </main>
  </div>
</template>