<script setup>
defineProps({
  patients: Array,
  selectedPatient: Object
})

const emit = defineEmits(["selectPatient"])
</script>

<template>
  <div>
    <h2>Patients</h2>

    <div
      v-for="patient in patients"
      :key="patient.id"
      class="patient-card"
      @click="emit('selectPatient', patient)"
    >
      <strong>{{ patient.name }}</strong>
      <div>{{ patient.diagnosis }}</div>
    </div>
  </div>
</template>