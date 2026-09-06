const express = require('express');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Webhook receiver — called when an analysis job finishes
app.post('/webhook/analysis-complete', (req, res, next) => {
  try {
    const { userId, resumeId, matchScore, fileName, timestamp } = req.body;

    if (!userId || !resumeId) {
      return res.status(400).json({ error: 'userId and resumeId are required' });
    }

    console.log(
      `[${new Date().toISOString()}] Analysis complete — user=${userId} resume=${resumeId} score=${matchScore} file=${fileName}`
    );

    // Notification stub — replace with real email/SMS/slack integration
    console.log(`  → Notification: User ${userId}'s resume "${fileName}" scored ${matchScore}/100`);

    res.status(202).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Webhook service listening on http://localhost:${PORT}`);
});
