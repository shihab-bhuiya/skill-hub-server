import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";


dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = process.env.MONGO_URI!;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function startServer() {
    try {
        await client.connect();

        console.log("✅ MongoDB Connected");

        const db = client.db("skill-Hub");
        const usersCollection = db.collection("users");
        const coursesCollection = db.collection("courses");

        app.get("/", (req: Request, res: Response) => {
            res.send("Server is running");
        });

        app.get("/users", async (req: Request, res: Response) => {
            const users = await usersCollection.find({}).toArray();
            res.json(users);
        });

        // Delete user Api

        app.delete("/users/:id", async (req: Request, res: Response) => {
            const { id } = req.params as { id: string };

            const result = await usersCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.json(result);
        });

        // Indivitual user api
        app.get("/users/:id", async (req: Request, res: Response) => {
            const { id } = req.params as {
                id: string;
            };

            const user = await usersCollection.findOne({
                _id: new ObjectId(id),
            });

            res.json(user);
        });

        // Courses post API
        app.post("/courses", async (req: Request, res: Response) => {
            try {
                const course = req.body;

                const result = await coursesCollection.insertOne(course);

                res.status(201).json({
                    success: true,
                    message: "Course added successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to add course",
                });
            }
        });

        // Get All Coureses

        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error(error);
    }
}

startServer();