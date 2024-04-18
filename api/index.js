import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});


// requireAuth middleware will validate the access token sent by the client and will return the user information within req.auth
app.post("/candidates", requireAuth, async (req, res) => {
  const { name, typeId, newType } = req.body;

  if (!name) {
    return res.status(400).send("Candidate name is required.");
  }

  try {
    // If a typeId is provided, link to the existing type
    if (typeId) {
      const candidate = await prisma.candidate.create({
        data: {
          name,
          type: { connect: { id: typeId } },
        },
      });
      return res.status(201).json(candidate);
    }

    // If a newType description is provided, create a new type then link it
    if (newType) {
      const candidate = await prisma.candidate.create({
        data: {
          name,
          type: {
            create: { type: newType },
          },
        },
      });
      return res.status(201).json(candidate);
    }

    // If neither typeId nor newType is provided, return an error
    return res.status(400).send("Either an existing type ID or a new type description is required.");
  } catch (error) {
    console.error("Failed to create candidate or type:", error);
    res.status(500).send("Failed to create candidate or type.");
  }
});

app.get("/candidates", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        type: {
          select: {
            type: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      }
    });

    const formattedCandidates = candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      candidateType: candidate.type.type,
      votesCount: candidate._count.votes
    }));

    res.json(formattedCandidates);
  } catch (error) {
    console.error("Failed to retrieve candidates:", error);
    res.status(500).send("Internal server error.");
  }
});

app.get("/candidates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const candidate = await prisma.candidate.findUnique({
    where: { id },
  });

  if (!candidate) {
    return res.status(404).send("Candidate not found.");
  }

  res.json(candidate);
});

app.put("/candidates/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;

  const updatedCandidate = await prisma.candidate.update({
    where: { id },
    data: { name },
  });

  res.json(updatedCandidate);
});

app.delete("/candidates/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedCandidate = await prisma.candidate.delete({
    where: { id },
  });

  res.json(deletedCandidate);
});

app.post("/votes", requireAuth, async (req, res) => {
  const { candidateId } = req.body;
  const auth0Id = req.auth.payload.sub;

  if (!candidateId) {
    return res.status(400).send("Candidate ID is required to cast a vote.");
  }

  try {
    const candidateExists = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidateExists) {
      return res.status(404).send("Candidate not found.");
    }

    const newVote = await prisma.vote.create({
      data: {
        user: { connect: { auth0Id } },
        candidate: { connect: { id: candidateId } },
      }
    });

    res.status(201).json(newVote);
  } catch (error) {
    console.error("Failed to cast vote:", error);
    res.status(500).send("Failed to cast vote.");
  }
});


// get all votes casted by the authenticated user
app.get("/my-votes", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const votes = await prisma.vote.findMany({
    where: {
      user: { auth0Id },
    },
    include: {
      candidate: true,
    },
  });

  res.json(votes);
});

// get all votes casted by all users
app.get("/votes", async (req, res) => {
  const votes = await prisma.vote.findMany({
    select: {
      candidateId: true,
      candidate: {
        select: {
          id: true,
          name: true,
        },
      },
    }
  });

  res.json(votes);
});


app.delete("/votes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedVote = await prisma.vote.delete({
    where: { id },
  });

  res.json(deletedVote);
});

// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  console.log("Received request to verify user.");
  const auth0Id = req.auth.payload.sub;
  console.log("Auth0 ID:", auth0Id);


  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];
  console.log("Email and Name from token:", email, name);


  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });


  console.log("User found in database:", user);
  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });
    console.log("New user created:", newUser);
    res.json(newUser);
  }
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});
