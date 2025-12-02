'use client';

import { useState, useEffect, useCallback } from 'react';

const WPC_VERSION = '1.0.0';
const TELEMETRY_VERSION = '1.0.0';
const DASHBOARD_ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT || 
  'https://tc-s-network-solar-dashboard.vercel.app/api/telemetry';

interface WPCResult {
  flops: number;
  joules: number;
  kWh: number;
  wpc: number;
  solar: number;
  rays: number;
  grade: string;
}

interface WPCParams {
  model?: 'llm' | 'vision' | 'diffusion';
  tokens?: number;
  resolution?: number;
  powerWatts?: number;
  seconds?: number;
}

interface WPCPanelProps {
  appName?: string;
  enableTelemetry?: boolean;
}

function estimateFlops({ model = 'llm', tokens = 50, resolution = 512 }: WPCParams): number {
  switch (model) {
    case 'llm':
      return tokens * 50e9;
    case 'vision':
      return resolution * resolution * 1e6;
    case 'diffusion':
      return resolution * resolution * 30e9;
    default:
      return 1e9;
  }
}

function estimateEnergy(watts = 60, seconds = 0.07): number {
  return watts * seconds;
}

function computeWPC(joules: number, flops: number): number {
  return joules / flops;
}

function joulesToKWh(joules: number): number {
  return joules / 3_600_000;
}

function kWhToSolar(kWh: number): number {
  return kWh / 4913;
}

function efficiencyGrade(wpc: number): string {
  if (wpc < 1e-12) return 'A+';
  if (wpc < 5e-12) return 'A';
  if (wpc < 1e-11) return 'B';
  if (wpc < 5e-11) return 'C';
  return 'D';
}

function computeAll(params: WPCParams): WPCResult {
  const flops = estimateFlops(params);
  const joules = estimateEnergy(params.powerWatts, params.seconds);
  const wpc = computeWPC(joules, flops);
  const kWh = joulesToKWh(joules);
  const solar = kWhToSolar(kWh);
  const rays = solar * 1000;

  return {
    flops,
    joules,
    kWh,
    wpc,
    solar,
    rays,
    grade: efficiencyGrade(wpc),
  };
}

async function sendTelemetry(payload: {
  app: string;
  kWh: number;
  solar: number;
  rays: number;
  flops: number;
  wpc: number;
  grade: string;
}): Promise<boolean> {
  try {
    const response = await fetch(DASHBOARD_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-TCS-Telemetry': TELEMETRY_VERSION
      },
      body: JSON.stringify({
        ...payload,
        ts: Date.now(),
        version: TELEMETRY_VERSION
      })
    });
    return response.ok;
  } catch (err) {
    console.error('[TC-S Telemetry] Send failed:', err);
    return false;
  }
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-green-500',
  'A': 'bg-green-400',
  'B': 'bg-yellow-400',
  'C': 'bg-orange-400',
  'D': 'bg-red-500',
};

export default function WPCPanel({ appName = 'Unknown', enableTelemetry = true }: WPCPanelProps) {
  const [model, setModel] = useState<'llm' | 'vision' | 'diffusion'>('llm');
  const [tokens, setTokens] = useState(50);
  const [resolution, setResolution] = useState(512);
  const [powerWatts, setPowerWatts] = useState(60);
  const [seconds, setSeconds] = useState(0.07);
  const [result, setResult] = useState<WPCResult | null>(null);
  const [telemetrySent, setTelemetrySent] = useState(false);

  useEffect(() => {
    const computed = computeAll({
      model,
      tokens,
      resolution,
      powerWatts,
      seconds,
    });
    setResult(computed);
    setTelemetrySent(false);
  }, [model, tokens, resolution, powerWatts, seconds]);

  const handleSendTelemetry = useCallback(async () => {
    if (!result || !enableTelemetry) return;
    
    const success = await sendTelemetry({
      app: appName,
      kWh: result.kWh,
      solar: result.solar,
      rays: result.rays,
      flops: result.flops,
      wpc: result.wpc,
      grade: result.grade
    });
    
    if (success) {
      setTelemetrySent(true);
    }
  }, [result, appName, enableTelemetry]);

  useEffect(() => {
    if (result && enableTelemetry && !telemetrySent) {
      const timer = setTimeout(() => {
        handleSendTelemetry();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, enableTelemetry, telemetrySent, handleSendTelemetry]);

  const formatNumber = (num: number, decimals = 2): string => {
    if (num < 0.001) return num.toExponential(decimals);
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + ' B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + ' M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + ' K';
    return num.toFixed(decimals);
  };

  return (
    <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 max-w-md mx-auto shadow-lg shadow-cyan-500/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 text-lg font-bold tracking-wide">
          WPC Compute Intelligence
        </h3>
        <div className="flex items-center gap-2">
          {enableTelemetry && (
            <span className={`w-2 h-2 rounded-full ${telemetrySent ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} 
                  title={telemetrySent ? 'Telemetry sent' : 'Sending telemetry...'} />
          )}
          {result && (
            <span className={`${gradeColors[result.grade]} text-black font-bold px-3 py-1 rounded-full text-sm`}>
              {result.grade}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Model Type</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as 'llm' | 'vision' | 'diffusion')}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            data-testid="select-model"
          >
            <option value="llm">LLM (GPT-4, Claude)</option>
            <option value="vision">Vision (Image Recognition)</option>
            <option value="diffusion">Diffusion (Sora, DALL-E)</option>
          </select>
        </div>

        {model === 'llm' && (
          <div>
            <label className="text-gray-400 text-sm block mb-1">Tokens: {tokens}</label>
            <input
              type="range"
              min="10"
              max="500"
              value={tokens}
              onChange={(e) => setTokens(Number(e.target.value))}
              className="w-full accent-cyan-500"
              data-testid="input-tokens"
            />
          </div>
        )}

        {(model === 'vision' || model === 'diffusion') && (
          <div>
            <label className="text-gray-400 text-sm block mb-1">Resolution: {resolution}px</label>
            <input
              type="range"
              min="256"
              max="2048"
              step="256"
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="w-full accent-cyan-500"
              data-testid="input-resolution"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Power (W)</label>
            <input
              type="number"
              value={powerWatts}
              onChange={(e) => setPowerWatts(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              data-testid="input-power"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Time (s)</label>
            <input
              type="number"
              step="0.01"
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              data-testid="input-seconds"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">FLOPs</span>
            <span className="text-white font-mono">{formatNumber(result.flops)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Energy</span>
            <span className="text-white font-mono">{formatNumber(result.joules)} J</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">WPC</span>
            <span className="text-cyan-400 font-mono">{result.wpc.toExponential(2)} J/FLOP</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
            <span className="text-yellow-400">Solar Cost</span>
            <span className="text-yellow-300 font-mono font-bold">{formatNumber(result.solar, 8)} SOLAR</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-400">Rays</span>
            <span className="text-green-300 font-mono">{formatNumber(result.rays, 5)} RAYS</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>1 SOLAR = 4913 kWh</span>
        <span className="text-cyan-600">{appName} | v{WPC_VERSION}</span>
      </div>
    </div>
  );
}

export { WPC_VERSION, TELEMETRY_VERSION, sendTelemetry };
