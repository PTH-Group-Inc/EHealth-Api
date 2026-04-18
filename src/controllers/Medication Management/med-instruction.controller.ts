import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedInstructionService } from '../../services/Medication Management/med-instruction.service';
import { MED_INSTRUCTION_SUCCESS } from '../../constants/med-instruction.constant';


const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class MedInstructionController {

    /** GET /api/medication-instructions/templates */
    static getTemplates = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const type = req.query.type as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await MedInstructionService.getTemplates(type, search);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATES_FETCHED, data: result });
    });

    /** POST /api/medication-instructions/templates */
    static createTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await MedInstructionService.createTemplate(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_CREATED, data: result });
    });

    /** PATCH /api/medication-instructions/templates/:id */
    static updateTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await MedInstructionService.updateTemplate(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_UPDATED, data: result });
    });

    /** DELETE /api/medication-instructions/templates/:id */
    static deleteTemplate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await MedInstructionService.deleteTemplate(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_DELETED });
    });

    /** GET /api/medication-instructions/drugs — DS thuốc có HĐ mặc định */
    static getAllDefaults = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string | undefined;
            const result = await MedInstructionService.getAllDefaults(search);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULTS_LIST_FETCHED, data: result });
    });

    /** GET /api/medication-instructions/drugs/:drugId */
    static getDrugDefault = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await MedInstructionService.getDrugDefault(req.params.drugId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_FETCHED, data: result });
    });

    /** PUT /api/medication-instructions/drugs/:drugId */
    static upsertDrugDefault = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await MedInstructionService.upsertDrugDefault(req.params.drugId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_UPSERTED, data: result });
    });

    /** DELETE /api/medication-instructions/drugs/:drugId */
    static deleteDrugDefault = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await MedInstructionService.deleteDrugDefault(req.params.drugId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_DELETED });
    });
}
