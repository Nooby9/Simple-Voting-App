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
          type: { connect: { id: parseInt(typeId) } },
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

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Check if the candidate exists and fetch its type
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
      include: {
        type: true 
      }
    });

    if (!candidate) {
      return res.status(404).send("Candidate not found.");
    }

    // Check if the user has already voted for this candidate
    const existingVoteForCandidate = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        candidateId: candidateId,
      },
    });

    if (existingVoteForCandidate) {
      return res.status(409).send("You have already voted for this candidate.");
    }

    // Check if the user has already voted for any candidate of the same type
    const existingVoteForType = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        candidate: {
          typeId: candidate.typeId  
        }
      },
      include: {
        candidate: true  
      }
    });

    if (existingVoteForType) {
      return res.status(409).send(`You have already voted for a candidate of this type: ${candidate.type.type}.`);
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

  // Retrieve the votes cast by the current user
  const votes = await prisma.vote.findMany({
    where: {
      user: { auth0Id },
    },
    include: {
      user: {
        select: {
          name: true
        }
      },
      candidate: {
        select: {
          name: true,
          votes: {
            select: {
              id: true
            }
          },
          type: {
            select: {
              type: true
            }
          }
        }
        
      }
    },
  });

  // Transform the data to include candidate names and the number of votes
  const results = votes.map(vote => ({
    id: vote.id,
    userName: vote.user.name,
    candidateName: vote.candidate.name,
    candidateType: vote.candidate.type.type,
    votesCount: vote.candidate.votes.length
  }));

  res.json(results);
});

app.get("/my-votes/count", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const votesCount = await prisma.vote.count({
      where: { userId: user.id }
    });

    res.json({ totalVotes: votesCount });
  } catch (error) {
    console.error("Failed to retrieve vote count:", error);
    res.status(500).send("Internal server error.");
  }
});

// Get the top 3 most-voted candidates that the current user has voted for
app.get("/top-voted-candidates", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  try {
    const results = await getTopVotedCandidates(auth0Id);
    res.json(results);
  } catch (error) {
    console.error("Failed to retrieve top voted candidates:", error);
    res.status(500).send("Internal server error.");
  }
});


// Helper function to get the top 3 most-voted candidates that the current user has voted for
async function getTopVotedCandidates(auth0Id) {
  const user = await prisma.user.findUnique({
    where: { auth0Id },
    include: {
      votes: {
        include: {
          candidate: true 
        }
      }
    }
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const candidateIds = user.votes.map(vote => vote.candidateId);

  const topCandidates = await prisma.candidate.findMany({
    where: {
      id: {
        in: candidateIds 
      }
    },
    include: {
      _count: {
        select: {
          votes: true 
        }
      }
    },
    orderBy: {
      votes: {
        _count: 'desc'
      }
    },
    take: 3 
  });

  return topCandidates.map(candidate => ({
    id: candidate.id,
    name: candidate.name,
    votesCount: candidate._count.votes
  }));
}


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

app.get("/votes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const auth0Id = req.auth.payload.sub;

  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const vote = await prisma.vote.findUnique({
      where: { id },
      include: {
        user: true,
        candidate: {
          include: {
            type: true
          }
        }
      }
    });

    if (!vote) {
      return res.status(404).send("Vote not found.");
    }

    if (vote.userId !== user.id) {
      return res.status(403).send("You are not authorized to view this vote.");
    }

    const voteDetails = {
      voteId: vote.id,
      userName: vote.user.name,
      candidateName: vote.candidate.name,
      candidateType: vote.candidate.type.type,
      createdAt: vote.createdAt
    };

    res.json(voteDetails);
  } catch (error) {
    console.error("Failed to retrieve vote details:", error);
    res.status(500).send("Internal server error.");
  }
});



app.delete("/votes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedVote = await prisma.vote.delete({
    where: { id },
  });

  res.json(deletedVote);
});

app.get("/candidate-types", async (req, res) => {
  try {
    const types = await prisma.candidateType.findMany();
    res.json(types);
  } catch (error) {
    console.error("Failed to fetch candidate types:", error);
    res.status(500).send("Failed to fetch candidate types.");
  }
});

app.post("/candidate-types", requireAuth, async (req, res) => {
  const { type } = req.body;
  if (!type) {
    return res.status(400).send("Type name is required.");
  }

  try {
    const newType = await prisma.candidateType.create({
      data: { type }
    });
    res.status(201).json(newType);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes('type')) {
      // This is the specific error code for unique constraint violation in Prisma
      return res.status(409).send(`A candidate type with the name "${type}" already exists.`);
    }
    console.error("Failed to create candidate type:", error);
    res.status(500).send("Failed to create candidate type.");
  }
});



app.put("/update-user", requireAuth, async (req, res) => {
  const { name } = req.body; 
  if (!name) {
    return res.status(400).send("Name is required.");
  }

  const auth0Id = req.auth.payload.sub;  

  try {
    const updatedUser = await prisma.user.update({
      where: {
        auth0Id: auth0Id  
      },
      data: {
        name: name  
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    if (error.code === 'P2025') {
      res.status(404).send("User not found.");  
    } else {
      res.status(500).send("Unable to update user.");
    }
  }
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

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
 console.log(`Server running on http://localhost:${PORT} 🎉 🚀`);
});
