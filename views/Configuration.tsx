
import React, { useState, useEffect } from 'react';
import { User, UserRole, SystemSettings } from '../types';
import { getStore, saveStore } from '../store';
import { GraduationCap, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

const Configuration: React.FC<{ user: User }> = ({ user }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [newDegree, setNewDegree] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const { settings: currentSettings } = getStore();
    setSettings(currentSettings);
  }, []);

  if (user.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">Access Restricted.</div>;
  }

  if (!settings) return null;

  const handleSave = () => {
    setIsSaving(true);
    saveStore({ settings });
    setTimeout(() => setIsSaving(false), 800);
  };

  const addDegree = () => {
    if (newDegree && !settings.degreeLevels.includes(newDegree)) {
      setSettings({ ...settings, degreeLevels: [...settings.degreeLevels, newDegree] });
      setNewDegree('');
    }
  };

  const removeDegree = (deg: string) => {
    setSettings({ ...settings, degreeLevels: settings.degreeLevels.filter(d => d !== deg) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-sm font-medium text-gray-500">Managing Institutional Academic Standards</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#00A3DD] text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          Update Global Parameters
        </button>
      </div>

      <div className="grid grid-cols-1 max-w-2xl gap-8">
        {/* Degree Level Management */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <h2 className="text-lg font-black text-gray-900">Academic Degrees</h2>
          </div>
          
          <div className="space-y-3">
            {settings.degreeLevels.map((deg) => (
              <div key={deg} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-sm font-bold text-gray-700">{deg}</span>
                <button onClick={() => removeDegree(deg)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Higher Diploma"
              className="flex-grow px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={newDegree} 
              onChange={(e) => setNewDegree(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDegree()}
            />
            <button 
              onClick={addDegree} 
              className="bg-blue-50 text-blue-600 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
            >
              Add
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuration;
