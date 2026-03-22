const router = require('express').Router();
const axios = require('axios');

/**
 * POST /api/proxy/openclaw
 * Proxy vers OpenClaw (appelle directement le endpoint interne)
 */
router.post('/openclaw', async (req, res) => {
  const { message, model = 'minimax-m2.5' } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameter: message required'
    });
  }

  try {
    // Appeler OpenClaw via l'API interne (admin)
    // Utilise le token depuis les variables d'environnement
    const openclawToken = process.env.OPENCLAW_TOKEN;
    if (!openclawToken) {
      console.error('[proxy/openclaw] OPENCLAW_TOKEN not set');
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Server misconfiguration: OPENCLAW_TOKEN not set'
      });
    }
    
    const response = await axios.post(
      'http://127.0.0.1:18789/api/sessions/default/message',
      {
        content: message,
        model: model
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openclawToken}`
        },
        timeout: 60000
      }
    );

    // Extraire la réponse
    const reply = response.data?.message?.content || response.data?.content || JSON.stringify(response.data);

    return res.json({
      success: true,
      data: {
        message: reply,
        model: model
      },
      error: null
    });

  } catch (err) {
    console.error('[proxy/openclaw]', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

module.exports = router;
