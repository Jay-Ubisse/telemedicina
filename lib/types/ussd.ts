export type UssdStep =
  | "MENU"
  | "STATUS_PHONE"
  | "STATUS_RESULT"
  | "PATIENT_NAME"
  | "PATIENT_PHONE"
  | "PATIENT_AGE"
  | "PATIENT_SEX"
  | "PATIENT_PROVINCE"
  | "PATIENT_DISTRICT"
  | "PATIENT_SYMPTOM"
  | "PATIENT_OTHER_SYMPTOM"
  | "PATIENT_NOTES"
  | "CONFIRMATION"
  | "SUCCESS";

export type UssdFormData = {
  patientName: string;
  phone: string;
  age: string;
  sex: "M" | "F" | "";
  province: string;
  district: string;
  symptoms: string[];
  otherSymptoms: string;
  notes: string;
};
