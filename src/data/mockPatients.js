export const mockPatients = [
  {
    id: 1,
    name: "Emily Johnson",
    age: 8,
    gender: "Female",
    mrn: "102938",
    language: "English",
    allergies: ["No known drug allergies"],
    encounter: {
      location: "Pediatric Inpatient",
      reasonForAdmission: "Shortness of breath and wheezing after viral symptoms",
      primaryDiagnosis: "Asthma exacerbation",
      codeStatus: "Full code",
      hospitalDay: 2
    },
    problemList: [
      "Asthma exacerbation",
      "Viral upper respiratory symptoms",
      "Intermittent tachycardia after albuterol",
      "Caregiver education need before discharge"
    ],
    vitals: [
      { time: "0600", temp: "37.1 C", hr: 118, rr: 28, bp: "102/64", spo2: "95% RA" },
      { time: "1000", temp: "37.0 C", hr: 108, rr: 24, bp: "100/62", spo2: "97% RA" },
      { time: "1400", temp: "36.9 C", hr: 98, rr: 20, bp: "104/66", spo2: "98% RA" }
    ],
    labs: [
      { name: "WBC", value: "10.8", unit: "K/uL", flag: "Normal", reference: "5.0–14.5" },
      { name: "Hgb", value: "12.7", unit: "g/dL", flag: "Normal", reference: "11.5–15.5" },
      { name: "CO2", value: "22", unit: "mmol/L", flag: "Normal", reference: "20–28" }
    ],
    medications: [
      { name: "Albuterol inhaler", dose: "4 puffs", route: "Inhaled", frequency: "q4h while awake" },
      { name: "Fluticasone inhaler", dose: "44 mcg", route: "Inhaled", frequency: "BID" },
      { name: "Prednisolone", dose: "1 mg/kg", route: "PO", frequency: "daily" }
    ],
    orders: [
      "Albuterol inhaler q4h while awake",
      "Fluticasone inhaler BID",
      "Prednisolone daily",
      "Respiratory therapy spacer teaching",
      "Asthma action plan prior to discharge",
      "Discharge teaching with caregiver teach-back"
    ],
    notes: [
      {
        type: "Progress Note",
        author: "Pediatric Hospitalist",
        text: "Work of breathing improved compared with admission. Mild end-expiratory wheeze persists. No oxygen requirement overnight. Plan to continue spaced albuterol and complete asthma action plan teaching."
      },
      {
        type: "Respiratory Therapy Note",
        author: "RT",
        text: "Spacer technique reviewed. Parent initially actuated inhaler too early and did not wait between puffs. Improved after coaching."
      },
      {
        type: "Nursing Note",
        author: "RN",
        text: "Parent verbalizes concern about recognizing when breathing is worsening. Return precautions need reinforcement before discharge."
      }
    ],
    dischargePlanning: {
      expectedDisposition: "Home",
      barriers: [
        "Caregiver teach-back not fully complete",
        "Spacer technique needs reinforcement",
        "Return precautions need clarification"
      ],
      followUp: "Primary care follow-up within 2–3 days after discharge",
      familyConcern: "Parent is worried about knowing when symptoms are serious enough to return for care."
    }
  },

  {
    id: 2,
    name: "Michael Smith",
    age: 14,
    gender: "Male",
    mrn: "284611",
    language: "English",
    allergies: ["No known drug allergies"],
    encounter: {
      location: "Pediatric Inpatient",
      reasonForAdmission: "Hyperglycemia with nausea and dehydration",
      primaryDiagnosis: "Type 1 diabetes with hyperglycemia",
      codeStatus: "Full code",
      hospitalDay: 1
    },
    problemList: [
      "Type 1 diabetes",
      "Hyperglycemia",
      "Recent nausea and poor oral intake",
      "Trace urine ketones",
      "Sick day management education need"
    ],
    vitals: [
      { time: "0600", temp: "36.8 C", hr: 96, rr: 18, bp: "112/70", spo2: "99% RA" },
      { time: "1000", temp: "36.9 C", hr: 88, rr: 16, bp: "110/68", spo2: "99% RA" },
      { time: "1400", temp: "37.0 C", hr: 84, rr: 16, bp: "114/72", spo2: "100% RA" }
    ],
    labs: [
      { name: "Glucose", value: "246", unit: "mg/dL", flag: "High", reference: "70–140" },
      { name: "Anion Gap", value: "12", unit: "mmol/L", flag: "Normal", reference: "7–15" },
      { name: "CO2", value: "21", unit: "mmol/L", flag: "Normal", reference: "20–28" },
      { name: "Ketones", value: "Trace", unit: "", flag: "Abnormal", reference: "Negative" }
    ],
    medications: [
      { name: "Insulin glargine", dose: "18 units", route: "SubQ", frequency: "nightly" },
      { name: "Insulin lispro", dose: "carb/correction scale", route: "SubQ", frequency: "with meals" },
      { name: "Ondansetron", dose: "4 mg", route: "PO", frequency: "q8h PRN nausea" }
    ],
    orders: [
      "Blood glucose before meals and bedtime",
      "Insulin glargine nightly",
      "Insulin lispro carb/correction dosing",
      "Urine ketones PRN if glucose >250 or vomiting",
      "Diabetes education consult",
      "Review sick day plan prior to discharge"
    ],
    notes: [
      {
        type: "Endocrinology Progress Note",
        author: "Pediatric Endocrinology",
        text: "Glucose improving with hydration and insulin adjustment. No ongoing acidosis. Focus today on sick day rules, ketone monitoring, correction dosing, and when to call endocrinology."
      },
      {
        type: "Diabetes Educator Note",
        author: "CDCES",
        text: "Patient understands basic glucose checks. Family remains unsure when to check ketones and whether insulin should be held when oral intake is poor."
      },
      {
        type: "Nursing Note",
        author: "RN",
        text: "Patient quiet during teaching. Mother asks most questions. Reinforcement needed to assess adolescent self-management readiness."
      }
    ],
    dischargePlanning: {
      expectedDisposition: "Home",
      barriers: [
        "Sick day plan needs reinforcement",
        "Ketone monitoring unclear",
        "Adolescent self-management confidence uncertain"
      ],
      followUp: "Endocrinology follow-up within 1 week",
      familyConcern: "Family is unsure how to adjust insulin during illness or poor oral intake."
    }
  },

  {
    id: 3,
    name: "Robert Thompson",
    age: 67,
    gender: "Male",
    mrn: "775204",
    language: "English",
    allergies: ["Lisinopril - cough"],
    encounter: {
      location: "Adult Medical Unit",
      reasonForAdmission: "Dyspnea, lower extremity edema, and weight gain",
      primaryDiagnosis: "Heart failure exacerbation",
      codeStatus: "Full code",
      hospitalDay: 3
    },
    problemList: [
      "Heart failure with reduced ejection fraction",
      "Volume overload",
      "Hypertension",
      "Chronic kidney disease stage 3",
      "Medication adherence concern",
      "Low sodium diet knowledge gap"
    ],
    vitals: [
      { time: "0600", temp: "36.7 C", hr: 86, rr: 20, bp: "142/86", spo2: "94% RA" },
      { time: "1000", temp: "36.8 C", hr: 82, rr: 18, bp: "136/82", spo2: "95% RA" },
      { time: "1400", temp: "36.8 C", hr: 78, rr: 18, bp: "130/78", spo2: "96% RA" }
    ],
    labs: [
      { name: "BNP", value: "1280", unit: "pg/mL", flag: "High", reference: "<100" },
      { name: "Creatinine", value: "1.7", unit: "mg/dL", flag: "High", reference: "0.7–1.3" },
      { name: "Potassium", value: "3.7", unit: "mmol/L", flag: "Normal", reference: "3.5–5.0" },
      { name: "Sodium", value: "134", unit: "mmol/L", flag: "Low", reference: "135–145" }
    ],
    medications: [
      { name: "Furosemide", dose: "40 mg", route: "IV", frequency: "BID" },
      { name: "Metoprolol succinate", dose: "50 mg", route: "PO", frequency: "daily" },
      { name: "Losartan", dose: "25 mg", route: "PO", frequency: "daily" },
      { name: "Spironolactone", dose: "25 mg", route: "PO", frequency: "daily" }
    ],
    orders: [
      "Daily weights",
      "Strict intake and output",
      "Low sodium diet",
      "IV furosemide BID",
      "BMP daily",
      "Heart failure education prior to discharge",
      "Case management review for medication access"
    ],
    notes: [
      {
        type: "Hospital Medicine Progress Note",
        author: "Hospital Medicine",
        text: "Improving dyspnea after diuresis. Net negative 1.8 L yesterday. Continue IV diuresis and monitor renal function."
      },
      {
        type: "Nursing Note",
        author: "RN",
        text: "Patient states he does not weigh himself daily at home and is unsure which foods are high in sodium. Reports occasionally skipping diuretic when leaving the house."
      },
      {
        type: "Case Management Note",
        author: "Case Manager",
        text: "Patient lives alone. Has transportation for follow-up but reports difficulty affording some medications at the end of the month."
      }
    ],
    dischargePlanning: {
      expectedDisposition: "Home",
      barriers: [
        "Volume status still improving",
        "Daily weight plan unclear",
        "Low sodium diet education needed",
        "Medication access concern"
      ],
      followUp: "Cardiology follow-up within 7 days after discharge",
      familyConcern: "Patient worries about returning to the hospital again and does not understand how to recognize early fluid retention."
    }
  },
  {
    id: 4,
    name: "Denise Carter",
    age: 58,
    gender: "Female",
    mrn: "663918",
    language: "English",
    allergies: ["Sulfa antibiotics - rash"],
    encounter: {
      location: "Hematology Oncology Unit",
      reasonForAdmission:
        "Weakness, nausea, decreased oral intake, and abnormal labs after starting induction therapy",
      primaryDiagnosis: "Tumor lysis syndrome",
      codeStatus: "Full code",
      hospitalDay: 2
    },
    problemList: [
      "Acute myeloid leukemia receiving induction therapy",
      "Tumor lysis syndrome",
      "Hyperuricemia",
      "Hyperphosphatemia",
      "Hypocalcemia",
      "Acute kidney injury",
      "Nausea and poor oral intake"
    ],
    vitals: [
      { time: "0200", temp: "37.8 C", hr: 108, rr: 20, bp: "104/66", spo2: "96% RA" },
      { time: "0600", temp: "37.6 C", hr: 102, rr: 18, bp: "108/68", spo2: "97% RA" },
      { time: "1000", temp: "37.4 C", hr: 98, rr: 18, bp: "112/70", spo2: "97% RA" },
      { time: "1400", temp: "37.3 C", hr: 94, rr: 16, bp: "116/72", spo2: "98% RA" }
    ],
    labs: [
      { name: "Uric Acid", value: "10.8", unit: "mg/dL", flag: "High", reference: "2.4–6.0" },
      { name: "Phosphorus", value: "6.2", unit: "mg/dL", flag: "High", reference: "2.5–4.5" },
      { name: "Calcium", value: "7.4", unit: "mg/dL", flag: "Low", reference: "8.6–10.2" },
      { name: "Potassium", value: "5.3", unit: "mmol/L", flag: "High", reference: "3.5–5.0" },
      { name: "Creatinine", value: "1.9", unit: "mg/dL", flag: "High", reference: "0.7–1.3" },
      { name: "LDH", value: "1450", unit: "U/L", flag: "High", reference: "140–280" },
      { name: "WBC", value: "42.0", unit: "K/uL", flag: "High", reference: "4.0–11.0" }
    ],
    medications: [
      { name: "Rasburicase", dose: "single dose", route: "IV", frequency: "once" },
      { name: "Allopurinol", dose: "300 mg", route: "PO", frequency: "daily" },
      { name: "Normal saline", dose: "150 mL/hr", route: "IV", frequency: "continuous" },
      { name: "Ondansetron", dose: "4 mg", route: "IV", frequency: "q8h PRN nausea" }
    ],
    orders: [
      "Tumor lysis labs q6h",
      "Strict intake and output",
      "Telemetry monitoring",
      "Continuous IV fluids",
      "Rasburicase administered",
      "Avoid nephrotoxic medications",
      "Notify provider for potassium >5.5, symptomatic hypocalcemia, or decreased urine output",
      "Nephrology consult if creatinine continues to rise"
    ],
    notes: [
      {
        type: "Hematology Progress Note",
        author: "Hematology",
        text:
          "Patient developed laboratory tumor lysis after initiation of induction therapy. Uric acid and phosphorus elevated with rising creatinine. Continue aggressive IV hydration, rasburicase given, trend TLS labs q6h."
      },
      {
        type: "Nursing Note",
        author: "RN",
        text:
          "Patient reports nausea and fatigue. Urine output decreased overnight but improved after fluid rate increased. Patient asks why frequent blood draws are needed."
      },
      {
        type: "Pharmacy Note",
        author: "Pharmacist",
        text:
          "Reviewed TLS medication plan. Recommend avoidance of nephrotoxins and close monitoring of potassium, phosphorus, calcium, uric acid, and renal function."
      }
    ],
    dischargePlanning: {
      expectedDisposition: "Remain inpatient",
      barriers: [
        "TLS labs remain abnormal",
        "Creatinine elevated from baseline",
        "Requires q6h lab monitoring",
        "Needs education on purpose of frequent monitoring"
      ],
      followUp: "Hematology follow-up after stabilization and completion of induction phase planning",
      familyConcern:
        "Patient is overwhelmed by new leukemia diagnosis and does not understand why kidney function and electrolytes are being monitored so closely."
    }
  },

  {
    id: 5,
    name: "Carlos Martinez",
    age: 72,
    gender: "Male",
    mrn: "918447",
    language: "Spanish",
    allergies: ["Penicillin - hives"],
    encounter: {
      location: "Adult Medical Unit",
      reasonForAdmission:
        "Fever, cough, confusion, and hypotension concerning for pneumonia with sepsis",
      primaryDiagnosis: "Sepsis due to community-acquired pneumonia",
      codeStatus: "Full code",
      hospitalDay: 1
    },
    problemList: [
      "Community-acquired pneumonia",
      "Sepsis",
      "Acute kidney injury",
      "Hypotension responsive to fluids",
      "Delirium risk",
      "Spanish language preference",
      "Antibiotic allergy history"
    ],
    vitals: [
      { time: "0100", temp: "39.1 C", hr: 118, rr: 28, bp: "88/54", spo2: "90% RA" },
      { time: "0300", temp: "38.7 C", hr: 112, rr: 26, bp: "96/60", spo2: "94% 2L NC" },
      { time: "0700", temp: "38.2 C", hr: 104, rr: 24, bp: "104/64", spo2: "95% 2L NC" },
      { time: "1200", temp: "37.9 C", hr: 98, rr: 22, bp: "110/68", spo2: "95% 2L NC" }
    ],
    labs: [
      { name: "WBC", value: "18.6", unit: "K/uL", flag: "High", reference: "4.0–11.0" },
      { name: "Lactate", value: "3.1", unit: "mmol/L", flag: "High", reference: "0.5–2.0" },
      { name: "Creatinine", value: "2.1", unit: "mg/dL", flag: "High", reference: "0.7–1.3" },
      { name: "BUN", value: "42", unit: "mg/dL", flag: "High", reference: "7–20" },
      { name: "Sodium", value: "132", unit: "mmol/L", flag: "Low", reference: "135–145" },
      { name: "Procalcitonin", value: "4.8", unit: "ng/mL", flag: "High", reference: "<0.1" }
    ],
    medications: [
      { name: "Ceftriaxone", dose: "2 g", route: "IV", frequency: "daily" },
      { name: "Azithromycin", dose: "500 mg", route: "IV", frequency: "daily" },
      { name: "Acetaminophen", dose: "650 mg", route: "PO", frequency: "q6h PRN fever" },
      { name: "Lactated Ringer's", dose: "bolus then maintenance", route: "IV", frequency: "per sepsis protocol" }
    ],
    orders: [
      "Blood cultures x2",
      "Chest x-ray",
      "Lactate repeat in 4 hours",
      "IV antibiotics per pneumonia pathway",
      "Oxygen to maintain SpO2 >92%",
      "Delirium precautions",
      "Interpreter required for education and consent discussions",
      "Renal dose medication review"
    ],
    notes: [
      {
        type: "Emergency Department Note",
        author: "Emergency Medicine",
        text:
          "Presented with fever, productive cough, confusion, hypotension, and hypoxia. Initial lactate elevated. Received IV fluids and antibiotics. Blood pressure improved after fluids."
      },
      {
        type: "Hospital Medicine Admission Note",
        author: "Hospital Medicine",
        text:
          "Admitted for sepsis due to suspected community-acquired pneumonia with AKI. Continue antibiotics, repeat lactate, monitor respiratory status and renal function."
      },
      {
        type: "Nursing Note",
        author: "RN",
        text:
          "Patient intermittently confused and pulls at nasal cannula. Daughter at bedside states Spanish is preferred for medical information. Interpreter used for medication explanation."
      }
    ],
    dischargePlanning: {
      expectedDisposition: "Home with family support once clinically stable",
      barriers: [
        "Still requiring supplemental oxygen",
        "AKI not yet resolved",
        "Intermittent confusion",
        "Needs antibiotic plan and interpreter-supported education"
      ],
      followUp: "Primary care follow-up within 1 week after discharge",
      familyConcern:
        "Daughter is worried about confusion and wants to know what signs should prompt urgent reassessment after discharge."
    }
  }
]