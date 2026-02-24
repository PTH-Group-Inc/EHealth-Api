import dotenv from 'dotenv';
dotenv.config(); 

import app from './app';
import { connectDB, pool } from './config/postgresdb';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });

});