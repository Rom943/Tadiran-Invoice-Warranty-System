import { Router } from 'express';
import installerRoutes from './installer.routes';
import adminRoutes from './admin.routes';
import warrantyRoutes from './warranty.routes';
import keyRoutes from './key.routes';

const router = Router();

// Install all routes
router.use('/api/installer', installerRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/warranties', warrantyRoutes);
router.use('/api/keys', keyRoutes);

export default router;
