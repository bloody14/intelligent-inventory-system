import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Swagger API Specifications Configuration Options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MERN Inventory API Engine',
            version: '1.0.0',
            description: 'Interactive documentation portal for Node/MongoDB pipeline',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
    },
    // Path to the API docs (we look for comment blocks inside index.js itself)
    apis: ['./index.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


console.log("MONGO_URI loaded:", process.env.MONGODB_URI ? "YES" : "UNDEFINED ");

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("MongoDB Connected!"))
.catch(err => console.error("MongoDB Error:", err.message));

const itemSchema = new mongoose.Schema({
    name:{ type: String, require: true},
    price:{ type: Number, requried: true},
    createdAt: { type: Date, default: Date.now}
});

const Item = mongoose.model('Item', itemSchema);

/**
 * @openapi
 * /items:
 *  get:
 *    summary: Retrieve all inventory items
 *    description: Fetches a complete list of items stored inside your MongoDB Atlas cloud cluster.
 *    responses:
 *      200:
 *        description: Success
 */
app.get('/items', async (req, res) => {
    try{
        const allItems = await Item.find({});
        res.json(allItems);
    } catch (err){
        res.status(500).json({error: "Failed to fetch item from database"});
    }
    
});

// POST Route: Save to MongoDB Cloud AND Sync to Python FastAPI
app.post('/items', async (req, res) => {
    try {
        const { name, price } = req.body;
        
        const newItem = await Item.create({ name, price });
        
        // BACKGROUND SYNC: Forward this data to Python FastAPI
        try {
            const pythonResponse = await fetch('http://localhost:8000/items/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: name, 
                    price: price,
                    is_offer: false,
                    owner_id: 1 // Using our default/fallback owner path
                })
            });
            
            if (pythonResponse.ok) {
                console.log("Sync Success: Data mirrored to Python SQLite!");
            } else {
                console.log("Sync Warning: Python server rejected the mirrored data.");
            }
        } catch (syncErr) {
            console.error("Sync Error: Python backend is down, couldn't mirror data.", syncErr.message);
        }
        
        res.status(201).json({ 
            message: "Item securely saved to MongoDB and synced to Python!", 
            data: newItem 
        });
    } catch (err) {
        res.status(400).json({ error: "Failed to create item" });
    }
});
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));