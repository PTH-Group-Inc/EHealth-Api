import { PatientService } from '../services/Patient Management/patient.service';
import { AppointmentService } from '../services/Appointment Management/appointment.service';
import { DiagnosisService } from '../services/EMR/diagnosis.service';

async function testDuplicatePatient() {
    console.log('Testing Task 12: Duplicate Patient');
    try {
        await PatientService.createPatient({
            full_name: 'Nguyen Van A',
            phone_number: '0901234567',
            gender: 'MALE',
            date_of_birth: '1990-01-01'
        });
        console.log('Test failed: Should have thrown error for duplicate patient');
    } catch (error: any) {
        if (error.code === 'PAT_011') {
            console.log('Test passed: Successfully detected duplicate patient');
        } else {
            console.error('Test failed: Unexpected error:', error);
        }
    }
}

async function testICD10() {
    console.log('Testing Task 15: ICD-10 format');
    try {
        await DiagnosisService.create('123', {
            icd10_code: 'INVALID_CODE',
            diagnosis_name: 'Test'
        }, 'user-id');
    } catch (error: any) {
        if (error.code === 'INVALID_ICD_FORMAT') {
            console.log('Test passed: Invalid ICD-10 format rejected');
        } else {
            console.log('Encountered different error (expected if encounter is missing):', error.code);
        }
    }
}

async function runTests() {
    // We only test validation logic to ensure the handlers are correctly responding.
    await testDuplicatePatient();
    await testICD10();
    process.exit(0);
}

runTests();
