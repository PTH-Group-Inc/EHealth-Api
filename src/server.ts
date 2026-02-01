import dotenv from 'dotenv'
dotenv.config() 

import app from './app'
import { connectDB } from './config/postgresdb';

const PORT = process.env.PORT

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});