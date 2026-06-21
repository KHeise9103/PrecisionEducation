<script setup>
import { ref } from "vue"

import { mockPatients } from "./data/mockPatients"
import EducationGenerator from "./components/EducationGenerator.vue"

const selectedPatient = ref(mockPatients[0])

function selectPatient(patient) {
  selectedPatient.value = patient
}
</script>

<template>
  <div class="epic-shell">
    <aside class="patient-banner">
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
        Allergies / Contraindications: Review
      </div>

      <div class="banner-section">
        Level of Care: Pediatric Inpatient
      </div>

      <div class="banner-section">
        Active Problem: {{ selectedPatient.diagnosis }}
      </div>

      <div class="banner-section">
        Follow Up: {{ selectedPatient.followUp }}
      </div>
    </aside>

    <main class="main-area">
      <div class="top-bar">
        <button>Chart Review</button>
        <button>Summary</button>
        <button>Results</button>
        <button>Notes</button>
        <button>Orders</button>
        <button class="active">PrecisionEducation</button>
      </div>

      <header class="module-header">
        <div>
          <h1>PrecisionEducation</h1>
          <span class="module-label">Clinical Learning Assistant</span>
        </div>

        <select
          @change="
            selectPatient(
              mockPatients[$event.target.value]
            )
          "
        >
          <option
            v-for="(patient, index) in mockPatients"
            :key="patient.id"
            :value="index"
          >
            {{ patient.name }} - {{ patient.diagnosis }}
          </option>
        </select>
      </header>

      <div class="alert-strip">
        Clinical learning content is generated from available patient context and should be reviewed before use.
      </div>

      <section class="grid">
        <div class="card wide action-card">
          <div class="card-title green">
            Generate Clinical Learning Brief
          </div>

          <EducationGenerator :patient="selectedPatient" />
        </div>

        <div class="card wide">
          <div class="card-title teal">
            Clinical Snapshot
          </div>

          <p>
            <strong>{{ selectedPatient.name }}</strong>
            is a {{ selectedPatient.age }}-year-old
            {{ selectedPatient.gender.toLowerCase() }}
            admitted for
            <strong>{{ selectedPatient.admissionReason }}</strong>.
          </p>

          <p>
            <strong>Hospital Course:</strong>
            {{ selectedPatient.hospitalCourse }}
          </p>

          <p>
            <strong>Learning Need:</strong>
            {{ selectedPatient.learningNeed }}
          </p>

          <p>
            <strong>Discharge Plan:</strong>
            {{ selectedPatient.dischargePlan }}
          </p>

          <p>
            <strong>Caregiver / Family Concern:</strong>
            {{ selectedPatient.caregiverConcern }}
          </p>
        </div>

        <div class="card">
          <div class="card-title blue">
            Clinical Pearls
          </div>

          <ul>
            <li
              v-for="item in selectedPatient.clinicalPearls"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title pink">
            Evidence Summary
          </div>

          <ul>
            <li
              v-for="item in selectedPatient.evidenceSummary"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title orange">
            Suggested Learning Topics
          </div>

          <ul>
            <li
              v-for="topic in selectedPatient.learningTopics"
              :key="topic"
            >
              {{ topic }}
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title purple">
            Current Medications
          </div>

          <ul>
            <li
              v-for="med in selectedPatient.medications"
              :key="med"
            >
              {{ med }}
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #eef2f6;
  color: #1d2733;
  font-size: 14px;
}

.epic-shell {
  display: flex;
  min-height: 100vh;
}

.patient-banner {
  width: 235px;
  background: #063b57;
  color: white;
  padding: 12px;
  box-sizing: border-box;
}

.avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: #f3d4aa;
  color: #b35a00;
  border: 4px solid white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  margin: 8px auto 12px;
  font-weight: bold;
}

.patient-banner h2 {
  margin: 8px 0;
  font-size: 18px;
  text-align: center;
}

.patient-banner p {
  margin: 5px 0;
  font-size: 13px;
  text-align: center;
}

.banner-section {
  border-top: 1px solid rgba(255,255,255,.25);
  padding-top: 9px;
  margin-top: 9px;
  font-size: 13px;
  line-height: 1.3;
}

.alert {
  background: #ffd733;
  color: black;
  padding: 8px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
}

.main-area {
  flex: 1;
  background: #eef2f6;
  overflow-y: auto;
}

.top-bar {
  background: #006aa6;
  padding: 7px 8px 0;
  display: flex;
  gap: 4px;
}

.top-bar button {
  background: #0b78b8;
  border: 1px solid #00639a;
  border-bottom: none;
  color: white;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 3px 3px 0 0;
}

.top-bar button.active {
  background: white;
  color: #222;
  border-color: #bfc8d4;
}

.module-header {
  height: 58px;
  background: white;
  padding: 8px 18px;
  border-bottom: 1px solid #c8d0d8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.module-header h1 {
  font-size: 30px;
  line-height: 1;
  margin: 0;
  color: #005b91;
}

.module-label {
  font-size: 12px;
  color: #5f6c7b;
  font-weight: 600;
}

select {
  padding: 5px 8px;
  border: 1px solid #9aa8b5;
  background: white;
  font-size: 13px;
  min-width: 260px;
}

.alert-strip {
  background: #d40000;
  color: white;
  padding: 8px 16px;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}

.grid {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.card {
  background: white;
  border: 1px solid #cfd8e2;
  box-shadow: 0 1px 2px rgba(0,0,0,.12);
  padding: 10px;
  min-height: 120px;
  box-sizing: border-box;
}

.card p {
  margin: 6px 0;
  line-height: 1.35;
}

.wide {
  grid-column: span 4;
}

.card-title {
  display: inline-block;
  padding: 6px 12px;
  margin: -10px 0 10px -10px;
  border-radius: 0 18px 18px 0;
  font-size: 13px;
  font-weight: 600;
}

.action-card {
  border-left: 6px solid #2e7a28;
  min-height: auto;
  background: #fbfffa;
}

.action-card .card-title {
  font-size: 15px;
}

.action-card .education-generator {
  margin-top: 4px;
}

.action-card .education-generator button {
  font-size: 15px;
  padding: 12px 18px;
  background: #2e7a28;
}

.generator-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.generator-controls label {
  font-weight: 600;
}

.teal {
  background: #d7f1ec;
  color: #00726f;
}

.blue {
  background: #dcecff;
  color: #0057c7;
}

.pink {
  background: #f6dce7;
  color: #b7005d;
}

.green {
  background: #dff1d8;
  color: #2e7a28;
}

.orange {
  background: #ffe7c2;
  color: #c26b00;
}

.purple {
  background: #ece0ff;
  color: #6c2bd9;
}

ul {
  margin: 6px 0 0 18px;
  padding: 0;
}

li {
  margin-bottom: 4px;
  line-height: 1.3;
}

button {
  cursor: pointer;
}

.education-generator {
  margin-top: 10px;
}

.education-generator button {
  background: #315f9e;
  color: white;
  border: none;
  padding: 9px 14px;
  border-radius: 4px;
  font-weight: 600;
}

.education-generator button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.education-output {
  margin-top: 12px;
  border-top: 1px solid #d5dbe2;
  padding-top: 10px;
}

.education-output h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.education-output pre {
  white-space: pre-wrap;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.4;
  font-size: 13px;
  margin: 0;
}
</style>