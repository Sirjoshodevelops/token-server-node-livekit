import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

type TokenRequest = {
  roomName: string;
  participantName: string;
};

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// This route handler creates a token for a given room and participant
async function createToken({ roomName, participantName }: TokenRequest) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantName,
    // Token to expire after 10 minutes
    ttl: '10m',
  });
  // Token permissions can be added here based on the
  // desired capabilities of the participant
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canUpdateOwnMetadata: true,
  });
  return at.toJwt();
}

const app = express();
const port = 3000;

// Enable CORS for ALL origins - simplified configuration
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Enable JSON body parsing
app.use(express.json());

// Handle OPTIONS requests for all routes
app.options('*', cors());

app.post('/createToken', async (req, res) => {
  try {
    const { roomName = 'demo-room', participantName = 'demo-user' } = req.body ?? {};
    const token = await createToken({ roomName, participantName });
    
    // Get LiveKit server URL from environment or use default
    const serverUrl = process.env.LIVEKIT_SERVER_URL || 'wss://your-livekit-server.livekit.cloud';
    
    // Return JSON object with connection details
    res.json({
      serverUrl: serverUrl,
      roomName: roomName,
      participantName: participantName,
      participantToken: token
    });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
