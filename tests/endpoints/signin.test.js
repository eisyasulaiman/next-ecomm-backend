import { PrismaClient, Prisma } from '@prisma/client'
import request from "supertest"
import app from "../../app.js"

async function cleanupDatabase() {
    const prisma = new PrismaClient();
    const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

    return Promise.all(
        modelNames.map((modelName) => prisma[modelName.toLowerCase()].deleteMany())
    );
}

describe("POST /sign-in", () => {
    const user = {
        name: 'John',
        email: 'john9@example.com',
        password: 'insecure',
    }

    beforeAll(async () => {
        await cleanupDatabase()

        // Create a user using the sign-up endpoint
        await request(app)
            .post("/users")
            .send(user)
            .set('Accept', 'application/json')
    })

    afterAll(async () => {
        await cleanupDatabase()
    })

    it("with valid data should return 200 and access token", async () => {
        const validData = { email: user.email, password: user.password };

        const response = await request(app)
            .post("/sign-in")
            .send(validData)
            .set('Accept', 'application/json')

        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeTruthy;
    });

    it("with wrong email should return 401 and not return access token", async () => {
        const wrongEmailData = { email: 'wrong' + user.email, password: user.password };

        const response = await request(app)
            .post("/sign-in")
            .send(wrongEmailData)
            .set('Accept', 'application/json')

        expect(response.statusCode).toBe(401);
        expect(response.body.accessToken).toBeFalsy();
    });

    it("with wrong password should return 401 and not return access token", async () => {
        const wrongPasswordData = { email: user.email, password: 'wrong' + user.password };

        const response = await request(app)
            .post("/sign-in")
            .send(wrongPasswordData)
            .set('Accept', 'application/json')

        expect(response.statusCode).toBe(401);
        expect(response.body.accessToken).toBeFalsy();
    });
});