"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

export default function CyberdeckConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableVoices, setAvailableVoices] = useState([]);

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      assistantName: 'Cyberdeck',
      wakeWord: 'cyberdeck',
      ttsVoice: 'Default',
      llmProvider: 'gemini',
      apiKey: '',
      customCommands: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customCommands'
  });

  // Fetch speech synthesis voices from browser APIs
  useEffect(() => {
    const fetchVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices.map(v => v.name));
        }
      }
    };
    
    fetchVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  // Load config.json from local HTTP Server on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to fetch config');
        const data = await res.json();
        
        if (!data.customCommands) {
          data.customCommands = [];
        }
        reset(data);
      } catch (err) {
        console.error('Error loading config:', err);
        setSnackbar({
          open: true,
          message: 'Error loading configuration file. Using defaults.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save config');
      }

      const updatedData = await res.json();
      reset(updatedData);
      setSnackbar({
        open: true,
        message: 'Configuration applied and hot-reloaded successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error saving config:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Error saving configuration.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper to add a new custom command macro row
  const handleAddMacro = () => {
    append({ trigger: '', actionType: 'open_url', payload: '' });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-primary">
        <div className="w-16 h-16 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin"></div>
        <h2 className="font-headline-sm text-headline-sm mt-6 uppercase tracking-wider text-secondary-fixed">
          Synchronizing Cyberdeck Cores...
        </h2>
      </div>
    );
  }

  // Live filter custom command macros by trigger phrase
  const filteredFields = fields.map((field, index) => ({ field, index })).filter(({ field }) => 
    field.trigger.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-screen overflow-hidden flex flex-col bg-background text-on-surface font-body-md antialiased select-none">
      
      {/* 🔔 Glassmorphic Floating Notification Tray */}
      {snackbar.open && (
        <div className={`fixed top-20 right-gutter z-50 flex items-center gap-unit px-gutter py-3 rounded-DEFAULT border ${
          snackbar.severity === 'success'
            ? 'bg-secondary-container/20 border-secondary-fixed text-secondary-fixed'
            : 'bg-error-container/20 border-error text-error'
        } shadow-lg backdrop-blur-md transition-all duration-300 animate-pulse`}>
          <span className="material-symbols-outlined">
            {snackbar.severity === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-body-md text-body-md font-semibold">{snackbar.message}</span>
          <button type="button" onClick={handleSnackbarClose} className="ml-gutter hover:opacity-80">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* TopNavBar */}
      <nav className="bg-surface-container border-b border-outline-variant flex justify-between items-center w-full px-gutter h-16 z-40 shrink-0">
        <div className="flex items-center gap-gutter">
          <span className="font-headline-md text-headline-md font-bold text-secondary-fixed tracking-tight">AEX-CONTROL</span>
        </div>
        <div className="flex items-center gap-unit">
          <div className="relative w-64 hidden md:block">
            <span className="material-symbols-outlined absolute left-unit top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full bg-surface-variant/30 border border-outline-variant rounded-DEFAULT text-on-surface pl-10 pr-unit py-1 focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed font-body-md text-body-md transition-colors h-8" 
              placeholder="Search macros..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-gutter">
          <button type="button" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors duration-200 p-unit rounded-DEFAULT scale-95 active:scale-90 transition-transform duration-150 hidden md:flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button type="button" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors duration-200 p-unit rounded-DEFAULT scale-95 active:scale-90 transition-transform duration-150 hidden md:flex items-center justify-center">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-gutter py-2 rounded-DEFAULT hover:opacity-90 transition-opacity scale-95 active:scale-90 transition-transform duration-150 font-bold uppercase disabled:opacity-50"
          >
            {saving ? 'Applying...' : 'Apply Changes'}
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
            <div className="w-full h-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-xs uppercase">
              JV
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SideNavBar */}
        <aside className="bg-surface-container-low/80 backdrop-blur-md border-r border-outline-variant fixed md:static left-0 top-0 bottom-0 flex flex-col justify-between py-unit w-64 z-30 transform -translate-x-full md:translate-x-0 transition-transform duration-300 h-full shrink-0">
          <div className="flex flex-col gap-margin-desktop">
            <div className="px-gutter flex items-center gap-unit mt-3">
              <div className="w-10 h-10 rounded-DEFAULT bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary-fixed">hub</span>
              </div>
              <div>
                <h2 class="font-label-md text-label-md text-on-surface font-bold uppercase">Core Engine</h2>
                <span className="font-data-num text-[10px] text-on-surface-variant">v2.4.0-stable</span>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              <a className="bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 opacity-90" href="#">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                <span className="font-body-md text-body-md">Dashboard</span>
              </a>
              <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="#">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">psychology</span>
                <span className="font-body-md text-body-md">Cognitive</span>
              </a>
              <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="#">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">settings_input_component</span>
                <span className="font-body-md text-body-md">Macros</span>
              </a>
              <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="#">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">settings_voice</span>
                <span className="font-body-md text-body-md">Audio</span>
              </a>
              <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="#">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">security</span>
                <span className="font-body-md text-body-md">Security</span>
              </a>
            </nav>
          </div>
          <nav className="flex flex-col gap-1 mb-3">
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="https://github.com/mgarcia333/cyberdeck" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">description</span>
              <span className="font-label-md text-label-md uppercase">Docs</span>
            </a>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="#">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
              <span className="font-label-md text-label-md uppercase">Logout</span>
            </a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-gutter md:p-margin-desktop flex justify-center">
          <div className="max-w-container-max w-full flex flex-col gap-margin-desktop">
            <header className="mb-gutter">
              <h1 className="font-headline-lg text-headline-lg hidden md:block text-primary">System Dashboard</h1>
              <h1 className="font-headline-md text-headline-md md:hidden text-primary">System Dashboard</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Configure core operational parameters and custom action logic.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              
              {/* General Assistant Parameters (Left Column) */}
              <div className="lg:col-span-5 flex flex-col gap-gutter">
                
                {/* General Settings */}
                <section className="bg-primary-container/10 border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                  <div className="flex items-center gap-unit mb-unit">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">tune</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">General Parameters</h3>
                  </div>
                  
                  <div className="flex flex-col gap-unit mt-gutter">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">Assistant Name</label>
                      <input 
                        className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors placeholder-on-surface-variant/50" 
                        placeholder="e.g. Cyberdeck" 
                        type="text" 
                        {...register('assistantName')}
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">Voice Wake Word</label>
                      <input 
                        className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors placeholder-on-surface-variant/50" 
                        placeholder="e.g. cyberdeck" 
                        type="text" 
                        {...register('wakeWord')}
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">TTS System Voice</label>
                      <select 
                        className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                        {...register('ttsVoice')}
                      >
                        <option className="bg-surface-container" value="Default">System Default Voice</option>
                        {availableVoices.map((voice) => (
                          <option key={voice} className="bg-surface-container" value={voice}>
                            {voice}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Cognitive Engine (LLM) */}
                <section className="bg-primary-container/10 border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                  <div className="flex items-center gap-unit mb-unit">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">memory</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Cognitive Engine (LLM)</h3>
                  </div>

                  <div className="flex flex-col gap-unit mt-gutter">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">AI Engine Provider</label>
                      <select 
                        className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                        {...register('llmProvider')}
                      >
                        <option className="bg-surface-container" value="gemini">Google Gemini Pro</option>
                        <option className="bg-surface-container" value="groq">Groq Llama-3</option>
                      </select>
                    </div>
                    <div className="mt-4 relative">
                      <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">API Key</label>
                      <input 
                        className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 pr-8 focus:outline-none font-data-num text-data-num transition-colors placeholder-on-surface-variant/50" 
                        type={showApiKey ? "text" : "password"} 
                        placeholder="Enter LLM provider API Key..."
                        {...register('apiKey')}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-1 top-[28px] text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showApiKey ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Custom Action Macros (Right Column) */}
              <div className="lg:col-span-7 flex flex-col">
                <section className="bg-primary-container/10 border border-outline-variant rounded-lg flex flex-col h-full overflow-hidden">
                  <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                    <div className="flex items-center gap-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">code_blocks</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Custom Action Macros</h3>
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddMacro}
                      className="border border-outline-variant text-on-surface hover:text-secondary-fixed hover:border-secondary-fixed font-label-md text-label-md px-3 py-1 rounded-DEFAULT transition-colors flex items-center gap-1 uppercase"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add Macro
                    </button>
                  </div>
                  
                  <div className="p-gutter overflow-x-auto flex-1 max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant">
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold w-1/3">Trigger Phrase</th>
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold w-1/4">Action Type</th>
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold">Execution Payload</th>
                          <th className="pb-2 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="font-data-num text-data-num text-on-surface divide-y divide-outline-variant/50">
                        {filteredFields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-on-surface-variant font-body-md">
                              {searchQuery ? 'No macros matched your search.' : 'No custom macros defined. Click Add Macro to start!'}
                            </td>
                          </tr>
                        ) : (
                          filteredFields.map(({ field, index }) => (
                            <tr key={field.id} className="hover:bg-surface-variant/20 transition-colors group">
                              <td className="py-3 px-2">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-on-surface py-1 focus:outline-none"
                                  placeholder="Trigger e.g. open google"
                                  {...register(`customCommands.${index}.trigger`)}
                                />
                              </td>
                              <td className="py-3 px-2">
                                <select 
                                  className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-on-surface py-1 focus:outline-none cursor-pointer"
                                  {...register(`customCommands.${index}.actionType`)}
                                >
                                  <option className="bg-surface-container" value="open_url">Open URL</option>
                                  <option className="bg-surface-container" value="cli_command">CLI Command</option>
                                  <option className="bg-surface-container" value="keystroke">Keystroke</option>
                                </select>
                              </td>
                              <td className="py-3 px-2">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-secondary-fixed/90 py-1 focus:outline-none"
                                  placeholder="Payload e.g. https://google.com"
                                  {...register(`customCommands.${index}.payload`)}
                                />
                              </td>
                              <td className="py-3 px-2 text-right">
                                <button 
                                  type="button" 
                                  onClick={() => remove(index)}
                                  className="text-on-surface-variant hover:text-tertiary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-unit border-t border-outline-variant bg-surface-container-lowest flex justify-end">
                    <span className="font-data-num text-[10px] text-on-surface-variant px-3 py-1">
                      {fields.length} Active Macros
                    </span>
                  </div>
                </section>
              </div>

            </div>
          </div>
        </main>
      </div>
    </form>
  );
}
