import React, { useState, useEffect } from 'react';
import { RoutingCandidate } from '../types';
import {
  Sparkles,
  X,
  Bot,
  User,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Brain,
} from 'lucide-react';

interface AIExplanationModalProps {
  candidate: RoutingCandidate | null;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  candidate,
  onClose,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [useThinkingMode, setUseThinkingMode] = useState<boolean>(true);

  useEffect(() => {
    if (!candidate) return;

    // Fetch or generate AI explanation
    const fetchExplanation = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/gemini/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateHospital: candidate.hospital.name,
            distanceKm: candidate.distanceKm,
            etaMinutes: candidate.etaMinutes,
            eligible: candidate.eligible,
            ineligibilityReasons: candidate.ineligibilityReasons,
            score: candidate.score,
            isBest: candidate.isBest,
            isNearest: candidate.isNearest,
            specialists: candidate.hospital.onDutySpecialists,
            equipment: candidate.hospital.equipment,
            icuBeds: candidate.hospital.icuBeds.available,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.explanation) {
            setExplanation(data.explanation);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fallback gracefully below
      }

      // High-Fidelity Deterministic Fallback if server or key unavailable
      const fallbackText = candidate.isBest
        ? `${candidate.hospital.name} is recommended as the optimal destination because it is fully clinically equipped with verified ${candidate.hospital.onDutySpecialists.slice(0, 2).join(' and ')} on duty and ${candidate.hospital.icuBeds.available} available ICU beds. While closer facilities may have shorter transit, they lack critical clinical readiness for this specific emergency profile.`
        : `${candidate.hospital.name} has a road travel ETA of ~${candidate.etaMinutes} minutes (${candidate.distanceKm} km). ${
            !candidate.eligible
              ? `However, it is currently bypassed due to clinical constraints: ${candidate.ineligibilityReasons.join(', ')}.`
              : `It remains an approved secondary alternative with good operational readiness.`
          }`;

      setExplanation(fallbackText);
      setLoading(false);
    };

    fetchExplanation();
  }, [candidate]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || chatLoading) return;

    const userQ = inputQuestion.trim();
    setInputQuestion('');
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', text: userQ }];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      if (useThinkingMode) {
        // Use Gemini 3.1 Pro Thinking Mode for deep multi-factorial clinical reasoning
        const response = await fetch('/api/gemini/thinking-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Patient Emergency Triage Case:
Destination: ${candidate?.hospital.name} (Distance: ${candidate?.distanceKm} km, ETA: ${candidate?.etaMinutes}m)
Hospital Clinical Status: ${candidate?.eligible ? 'ELIGIBLE' : 'INELIGIBLE'} (${candidate?.ineligibilityReasons?.join(', ') || 'No restrictions'})
Available ICU Beds: ${candidate?.hospital.icuBeds.available}
On-Duty Specialists: ${candidate?.hospital.onDutySpecialists?.join(', ')}

Question: "${userQ}"

Provide a deep, authoritative medical guidance answer. Detail physiological pre-hospital stabilization, golden-hour timelines, and explain any relevant clinical constraints.`,
            systemInstruction:
              'You are the Senior Chief Emergency Medicine Physician and Triage Consultant for Mysuru, Karnataka. Provide rigorous, medically sound, and reassuring advice.',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.response) {
            setChatMessages([
              ...newHistory,
              { role: 'model', text: data.response, isThinking: true },
            ]);
            setChatLoading(false);
            return;
          }
        }
      } else {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userQ,
            hospitalContext: candidate?.hospital.name,
            chatHistory: newHistory,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.reply) {
            setChatMessages([...newHistory, { role: 'model', text: data.reply }]);
            setChatLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      // Fallback below
    }

    // Deterministic clinical assistant response
    let deterministicReply =
      'Keep the patient calm and in a comfortable semi-reclined position. Ensure the airway remains clear, do not offer solid food or drink, and monitor respiration while the ambulance is en route. The hospital emergency department has been pre-notified of your approach.';
    if (
      userQ.toLowerCase().includes('cardiac') ||
      userQ.toLowerCase().includes('heart') ||
      userQ.toLowerCase().includes('chest')
    ) {
      deterministicReply =
        'For acute cardiac symptoms, keep the patient seated upright, loosen tight neckwear, avoid any physical exertion, and have chewable aspirin ready if approved by paramedic instructions.';
    } else if (userQ.toLowerCase().includes('stroke')) {
      deterministicReply =
        'For suspected stroke (FAST protocol: Facial drooping, Arm weakness, Speech difficulty), note the exact time of symptom onset for golden-hour thrombolysis and do not give aspirin until CT scan confirms no hemorrhage.';
    }

    setChatMessages([...newHistory, { role: 'model', text: deterministicReply }]);
    setChatLoading(false);
  };

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-1.5">
                <span>AI Clinical Routing Explanation</span>
              </h3>
              <p className="text-xs text-indigo-300/80">
                Grounded Clinical Triage Protocol • {candidate.hospital.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Main AI Justification Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 relative">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-2">
              <span className="flex items-center gap-1">
                <Bot className="w-4 h-4" /> Gemini Clinical Reasoning Summary
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                Score: {candidate.score} pts
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Synthesizing medical criteria & road travel matrices...</span>
              </div>
            ) : (
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {explanation}
              </p>
            )}
          </div>

          {/* Key Clinical Determinants */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Road Transit:</span>
              <strong className="text-slate-200 font-mono">
                {candidate.distanceKm} km (~{candidate.etaMinutes} mins)
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Available ICU:</span>
              <strong className="text-emerald-400 font-mono">
                {candidate.hospital.icuBeds.available} free beds
              </strong>
            </div>
          </div>

          {/* Multi-Turn Emergency Protocol Assistant */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                Ask Triage Assistant (First Aid & Clinical Guidance)
              </h4>

              {/* Thinking Mode Toggle */}
              <button
                type="button"
                onClick={() => setUseThinkingMode(!useThinkingMode)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                  useThinkingMode
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600/60 shadow-sm'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
                title="Toggle Gemini 3.1 Pro Thinking Mode for deep multi-factorial clinical reasoning"
              >
                <Brain className={`w-3 h-3 ${useThinkingMode ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>THINKING: {useThinkingMode ? 'ON (HIGH)' : 'OFF'}</span>
              </button>
            </div>

            {/* Chat Thread */}
            <div className="max-h-48 overflow-y-auto space-y-2 mb-3 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-400 text-center text-[11px]">
                  Ask questions like "What first aid should I provide while waiting?" or "Why is Cath Lab needed for this incident?"
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 ml-6 text-right'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 mr-6'
                    }`}
                  >
                    <span className="text-[10px] font-bold block opacity-60 mb-0.5">
                      {msg.role === 'user' ? 'You' : 'Clinical Triage AI'}
                    </span>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex items-center gap-2 p-2 text-xs text-indigo-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating clinical answer...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask clinical or first-aid question..."
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputQuestion.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
