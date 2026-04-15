import { EncounterService } from './encounter.service';
import { EncounterRepository } from '../../repository/EMR/encounter.repository';
import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';
import { CreateEncounterInput } from '../../models/EMR/encounter.model';

// Mock Dependencies
jest.mock('../../repository/EMR/encounter.repository', () => ({
  EncounterRepository: {
    findPatientById: jest.fn(),
    findActiveByPatientId: jest.fn(),
    findDoctorById: jest.fn(),
    findRoomById: jest.fn(),
    hasExistingEncounters: jest.fn(),
    getVisitNumber: jest.fn(),
    create: jest.fn(),
    updateRoomStatus: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../../config/postgresdb', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

describe('EncounterService', () => {
    let mockClient: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    describe('createEncounter', () => {
        const mockInput: CreateEncounterInput = {
            patient_id: 'patient-123',
            doctor_id: 'doctor-123',
            room_id: 'room-123',
            notes: 'Test encounter',
        };
        const mockUserId = 'admin-user';

        it('should throw NOT_FOUND if patient does not exist', async () => {
            (EncounterRepository.findPatientById as jest.Mock).mockResolvedValue(null);

            await expect(EncounterService.createEncounter(mockInput, mockUserId))
                .rejects.toThrow(AppError);
            
            expect(EncounterRepository.findPatientById).toHaveBeenCalledWith('patient-123');
        });

        it('should throw CONFLICT if patient already has active encounter', async () => {
            (EncounterRepository.findPatientById as jest.Mock).mockResolvedValue({ id: 'patient-123' });
            (EncounterRepository.findActiveByPatientId as jest.Mock).mockResolvedValue({ id: 'active-enc' });

            await expect(EncounterService.createEncounter(mockInput, mockUserId))
                .rejects.toThrow(AppError);
        });

        it('should successfully create an encounter with transaction commit', async () => {
            // Setup Mocks
            (EncounterRepository.findPatientById as jest.Mock).mockResolvedValue({ id: 'patient-123' });
            (EncounterRepository.findActiveByPatientId as jest.Mock).mockResolvedValue(null);
            (EncounterRepository.findDoctorById as jest.Mock).mockResolvedValue({ id: 'doctor-123', is_active: true });
            (EncounterRepository.findRoomById as jest.Mock).mockResolvedValue({ id: 'room-123', room_status: 'AVAILABLE' });
            (EncounterRepository.hasExistingEncounters as jest.Mock).mockResolvedValue(false);
            (EncounterRepository.getVisitNumber as jest.Mock).mockResolvedValue(1);
            
            const mockCreatedEncounter = { encounters_id: 'new-enc-123' };
            (EncounterRepository.create as jest.Mock).mockResolvedValue(mockCreatedEncounter);
            (EncounterRepository.findById as jest.Mock).mockResolvedValue({ ...mockCreatedEncounter, status: 'IN_PROGRESS' });

            // Execute
            const result = await EncounterService.createEncounter(mockInput, mockUserId);

            // Verify
            expect(pool.connect).toHaveBeenCalled();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(EncounterRepository.create).toHaveBeenCalled();
            expect(EncounterRepository.updateRoomStatus).toHaveBeenCalledWith('room-123', 'OCCUPIED', null, mockClient);
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            
            expect(result).toHaveProperty('encounters_id', 'new-enc-123');
        });

        it('should throw error and rollback transaction if creation fails', async () => {
            (EncounterRepository.findPatientById as jest.Mock).mockResolvedValue({ id: 'patient-123' });
            (EncounterRepository.findActiveByPatientId as jest.Mock).mockResolvedValue(null);
            (EncounterRepository.findDoctorById as jest.Mock).mockResolvedValue({ id: 'doctor-123', is_active: true });
            (EncounterRepository.findRoomById as jest.Mock).mockResolvedValue({ id: 'room-123', room_status: 'AVAILABLE' });
            (EncounterRepository.hasExistingEncounters as jest.Mock).mockResolvedValue(false);
            (EncounterRepository.getVisitNumber as jest.Mock).mockResolvedValue(1);
            
            const error = new Error('Database connection failed');
            (EncounterRepository.create as jest.Mock).mockRejectedValue(error);

            await expect(EncounterService.createEncounter(mockInput, mockUserId))
                .rejects.toThrow('Database connection failed');

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});
