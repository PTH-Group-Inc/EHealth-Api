import { Router } from 'express';
import { drugCategoryRoutes } from './drug-category.routes';
import { drugRoutes } from './drug.routes';
import { dispensingRoutes } from './dispensing.routes';
import { inventoryRoutes } from './inventory.routes';
import { warehouseRoutes } from './warehouse.routes';
import { supplierRoutes } from './supplier.routes';
import { stockInRoutes } from './stock-in.routes';
import { stockOutRoutes } from './stock-out.routes';
import { medInstructionRoutes } from './med-instruction.routes';

const router = Router();

router.use('/pharmacy/categories', drugCategoryRoutes);
router.use('/pharmacy/drugs', drugRoutes);
router.use('/dispensing', dispensingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/stock-in', stockInRoutes);
router.use('/stock-out', stockOutRoutes);
router.use('/medication-instructions', medInstructionRoutes);

export default router;
