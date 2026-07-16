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
        // await client.connect();

        console.log("✅ MongoDB Connected");

        const db = client.db("skill-Hub");
        const usersCollection = db.collection("users");
        const coursesCollection = db.collection("courses");
        const enrollmentsCollection = db.collection("enrollments");

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
        app.get("/courses", async (req: Request, res: Response) => {
            try {
                const limit = Number(req.query.limit) || 0;

                let query = coursesCollection.find({});

                if (limit > 0) {
                    query = query.limit(limit);
                }

                const courses = await query.toArray();

                res.json(courses);
            } catch (error) {
                res.status(500).json({
                    message: "Failed to fetch courses",
                });
            }
        });

        // Get individual courses api 
        app.get("/courses/:id", async (req: Request, res: Response) => {
            try {
                const { id } = req.params as {
                    id: string
                };

                const course = await coursesCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!course) {
                    return res.status(404).json({
                        message: "Course not found",
                    });
                }

                res.json(course);
            } catch (error) {
                res.status(500).json({
                    message: "Something went wrong",
                });
            }
        });

        // Delete api of individual courses
        app.delete("/courses/:id", async (req: Request, res: Response) => {
            try {
                const { id } = req.params as {
                    id: string,
                };

                const result = await coursesCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    message: "Failed to delete course",
                });
            }
        });


        // Create Enrollment API
        app.post("/enrollments", async (req: Request, res: Response) => {
            try {
                const enrollment = req.body;

                const alreadyEnrolled = await enrollmentsCollection.findOne({
                    courseId: enrollment.courseId,
                    userId: enrollment.userId,
                });

                if (alreadyEnrolled) {
                    return res.status(400).json({
                        message: "Already enrolled",
                    });
                }

                enrollment.enrolledAt = new Date();

                const result = await enrollmentsCollection.insertOne(enrollment);

                res.status(201).json(result);

            } catch (error) {
                res.status(500).json({
                    message: "Enrollment failed",
                });
            }
        });

        // Get Course by email API
        app.get("/my-courses/:email", async (req: Request, res: Response) => {
            try {
                const email = req.params.email;

                const enrollments = await enrollmentsCollection
                    .find({
                        userEmail: email,
                    })
                    .toArray();

                const courseIds = enrollments.map(
                    (enrollment) => new ObjectId(enrollment.courseId)
                );

                const courses = await coursesCollection
                    .find({
                        _id: {
                            $in: courseIds,
                        },
                    })
                    .toArray();

                res.json(courses);
            } catch (error) {
                res.status(500).json({
                    message: "Failed to fetch courses",
                });
            }
        });

        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error(error);
    }
}

startServer();