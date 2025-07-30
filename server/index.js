import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import connectDB from './config/mongoDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());
connectDB();
// Routes
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

