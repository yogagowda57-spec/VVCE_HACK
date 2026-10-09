import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function geminiServerPlugin(): Plugin {
  return {
    name: 'gemini-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/gemini/explain') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ explanation: null, offline: true }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const prompt = `You are the Lead Emergency Medicine Physician & Triage Architect for Mysuru, Karnataka.
A patient has triggered an emergency triage routing evaluation.
Candidate Hospital: ${data.candidateHospital}
Distance: ${data.distanceKm} km
Estimated road travel time: ~${data.etaMinutes} minutes
Clinical Eligibility: ${data.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
Missing criteria if any: ${data.ineligibilityReasons?.join(', ') || 'None'}
Score: ${data.score}
Is Recommended Best Destination: ${data.isBest ? 'YES' : 'NO'}
Is Nearest Hospital: ${data.isNearest ? 'YES' : 'NO'}
On-Duty Specialists: ${data.specialists?.join(', ') || 'General Residents'}
Equipment: ${data.equipment?.join(', ') || 'Standard ED'}
Available ICU Beds: ${data.icuBeds}

Explain in exactly 2 concise, clinical, and authoritative sentences why this hospital was evaluated as ${
                data.isBest ? 'the recommended optimal destination' : 'a secondary alternative or clinically bypassed'
              }. Reference specific medical criteria like Cath Lab, ICU beds, on-duty specialists, and road transit.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ explanation: response.text }));
            } catch (err: any) {
              console.error('Gemini API Error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ explanation: null, error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/gemini/chat') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: null, offline: true }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const prompt = `You are the Mysuru Emergency Response Triage Consultant.
A citizen or paramedic has asked: "${data.question}".
Facility context: Destination is ${data.hospitalContext || 'Mysuru Tertiary Center'}.
Give an immediate, actionable, reassuring, medical first-aid protocol answer in 2-3 short sentences. Prioritize patient airway, breathing, positioning, and waiting for the 108 ambulance.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: response.text }));
            } catch (err: any) {
              console.error('Gemini Chat API Error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: null, error: err.message }));
            }
          });
          return;
        }

        // Thinking Mode endpoint for complex queries and multi-factorial infrastructure risk reasoning
        if (req.method === 'POST' && req.url === '/api/gemini/thinking-query') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: null, offline: true }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const prompt = data.prompt || data.question;
              const systemInstruction =
                data.systemInstruction ||
                'You are the Senior Chief Biomedical and Infrastructure Forensics Engineer & Emergency Systems Architect for Mysuru Emergency Hospitals. Conduct comprehensive multi-factorial root-cause risk diagnosis across structural integrity, cryogenic medical oxygen, electrical grid/backup ATS, fire life-safety, and clinical emergency capacity.';

              try {
                // Must use gemini-3.1-pro-preview with thinkingLevel HIGH and do not set maxOutputTokens
                const response = await ai.models.generateContent({
                  model: 'gemini-3.1-pro-preview',
                  contents: prompt,
                  config: {
                    systemInstruction,
                    thinkingConfig: {
                      thinkingLevel: ThinkingLevel.HIGH,
                    },
                  },
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    model: 'gemini-3.1-pro-preview',
                    thinkingLevel: 'HIGH',
                    response: response.text,
                  })
                );
              } catch (modelErr: any) {
                console.warn(
                  'gemini-3.1-pro-preview thinking call failed, attempting fallback to gemini-3.8-flash:',
                  modelErr.message
                );
                const fallbackResponse = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                  config: {
                    systemInstruction,
                  },
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    model: 'gemini-3.8-flash',
                    response: fallbackResponse.text,
                  })
                );
              }
            } catch (err: any) {
              console.error('Gemini Thinking Query Error:', err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ response: null, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
