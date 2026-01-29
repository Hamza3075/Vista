
import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { GoogleGenAI } from '@google/genai';
import { PageHeader, StatusBadge } from './Common';

export const AIInsightsView: React.FC = () => {
  const { ingredients, packaging, products } = useStore();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    // String verification for API Key presence
    const apiKey = process.env.API_KEY;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      setError("Authorization Error: AI configuration missing. Ensure API_KEY is defined in environment.");
      return;
    }

    // Defensive check for data availability
    if (products.length === 0 && ingredients.length === 0) {
      setError("Data Conflict: No manufacturing or inventory records available for analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    setInsight('');

    try {
      // Initialize AI with verified key
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const context = {
        ingredients: ingredients.map(i => ({ 
          name: i.name, 
          stock: (Number(i.stock) || 0) / 1000, 
          unit: i.unit, 
          costPerUnit: (Number(i.costPerBaseUnit) || 0) * 1000 
        })),
        packaging: packaging.map(p => ({ 
          name: p.name, 
          stock: Number(p.stock) || 0, 
          capacity: Number(p.capacity) || 0 
        })),
        products: products.map(p => ({ 
          name: p.name, 
          stock: Number(p.stock) || 0, 
          price: Number(p.salePrice) || 0,
          formulaCount: p.formula?.length || 0
        }))
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
          parts: [{
            text: `You are a world-class strategic consultant for Vista, a high-end manufacturing firm. 
            Analyze the following business snapshot:
            ${JSON.stringify(context, null, 2)}
            
            Provide a high-level strategic analysis focused on:
            1. Production Prioritization (based on current stock levels and market value).
            2. Supply Chain Risks (identifying critical material shortages).
            3. Pricing & Margin Optimization (suggesting adjustments based on resource costs).
            
            Maintain a professional, minimalist, and direct tone. Use Markdown formatting with clear headers. Keep it high-density and concise.
            If the data appears inconsistent or incomplete, acknowledge this but proceed with the best available interpretation.`
          }]
        }],
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
        }
      });

      if (!response || !response.text) {
        throw new Error("Invalid response received from Intelligence Service. Response was empty or malformed.");
      }

      setInsight(response.text);
    } catch (err: any) {
      console.error('Gemini Analysis Error:', err);
      // Detailed error breakdown for status codes
      let msg = "An unexpected error occurred during analysis.";
      if (err.message?.includes("405")) {
        msg = "Network Error: 405 Method Not Allowed. Verify endpoint routing and HTTP method compatibility.";
      } else if (err.message?.includes("401") || err.message?.includes("403")) {
        msg = "Authorization Error: Invalid credentials or insufficient permissions for the AI service.";
      } else {
        msg = err.message || msg;
      }
      setError(`Strategic Advisor Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-neutral-900 dark:bg-neutral-900/50 rounded-sm p-12 border border-neutral-800 flex flex-col items-center text-center space-y-8">
        <div className="w-14 h-14 rounded-full border border-vista-accent/30 flex items-center justify-center">
           <div className="w-2.5 h-2.5 bg-vista-accent rounded-full animate-pulse shadow-[0_0_15px_rgba(235,205,84,0.5)]" />
        </div>
        <div className="space-y-3 max-w-xl">
          <h2 className="text-3xl font-light text-white tracking-tight">AI Strategic Advisor</h2>
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            Execute a deep-reasoning cycle across your manufacturing catalog to identify supply chain vulnerabilities and commercial opportunities.
          </p>
        </div>
        <button 
          onClick={generateAnalysis}
          disabled={loading}
          className="px-12 py-4 bg-vista-accent text-neutral-900 text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-2xl"
        >
          {loading ? 'Processing Context...' : 'Initialize Analysis'}
        </button>
      </div>

      {error && (
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-sm text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
          {error}
        </div>
      )}

      {insight && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-12 rounded-sm shadow-sm animate-fade-in max-w-none">
          <div className="flex justify-between items-center mb-10 border-b border-neutral-50 dark:border-neutral-800 pb-6">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Vista Intelligence Report</span>
               <span className="text-[9px] text-neutral-300 dark:text-neutral-600 uppercase font-bold mt-1 tracking-widest">{new Date().toLocaleDateString()}</span>
             </div>
             <StatusBadge value="Analysis Complete" type="positive" />
          </div>
          <div className="text-neutral-700 dark:text-neutral-300 font-light leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
            {insight}
          </div>
        </div>
      )}
    </div>
  );
};
