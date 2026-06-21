<script setup>
defineProps({
  patient: Object
})
</script>

<template>
  <div>
    <h2>Patient Context</h2>

    <p><strong>Name:</strong> {{ patient.name }}</p>
    <p><strong>Age:</strong> {{ patient.age }}</p>
    <p><strong>Gender:</strong> {{ patient.gender }}</p>
    <p><strong>Diagnosis:</strong> {{ patient.diagnosis }}</p>
    <p><strong>Medications:</strong> {{ patient.medications.join(", ") }}</p>
    <p><strong>Learning Need:</strong> {{ patient.learningNeed }}</p>
  </div>
</template>