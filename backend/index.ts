import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Receipt Manager API is running');
});

// A sample protected route that verifies the Supabase token
app.get('/protected', requireAuth, (req: Request, res: Response) => {
  res.json({
    message: 'You have accessed a protected route!',
    user: (req as any).user,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
