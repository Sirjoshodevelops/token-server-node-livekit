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

// Configure CORS with explicit options
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://bolt.new',
      'https://*.bolt.new',
      'https://*.webcontainer-api.io',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    // Check if the origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard subdomains
        const regex = new RegExp('^' + allowed.replace('*', '.*') + '$');
        return regex.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // For now, allow all origins in development
      // You can change this to callback(new Error('Not allowed by CORS')) in production
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Enable CORS for all origins
app.use(cors(corsOptions));

// Enable JSON body parsing
app.use(express.json());

// Handle preflight requests explicitly
app.options('/createToken', cors(corsOptions));

app.post('/createToken', async (req, res) => {
  const { roomName = 'demo-room', participantName = 'demo-user' } = req.body ?? {};
  res.send(await createToken({ roomName, participantName }));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
