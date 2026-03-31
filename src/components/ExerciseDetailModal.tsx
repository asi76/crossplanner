import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Clock, Zap, Target, Trash2, Upload, Image, Loader2, Save, Edit3 } from 'lucide-react';
import { Exercise } from '../data/types';
import { pb } from '../pbService';
import { getGifUrl, setGifUrl } from '../data/gifMapping';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  gifUrl?: string | null;
  onClose: () => void;
  onSave?: (exerciseData: Partial<Exercise>) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  mode?: 'view' | 'edit' | 'create';
}

export function ExerciseDetailModal({ exercise, onClose, onSave, onPrev, onNext, hasPrev, hasNext, mode = 'view' }: ExerciseDetailModalProps) {
  const [localExercise, setLocalExercise] = useState(exercise);
  const [localGifUrl, setLocalGifUrl] = useState<string | null>(null);
  const [gifUrlInput, setGifUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    setLocalExercise(exercise);
    loadGifUrl();
  }, [exercise.id]);

  const loadGifUrl = async () => {
    try {
      const url = await getGifUrl(exercise.id);
      setLocalGifUrl(url);
      setGifUrlInput(url || '');
    } catch {}
  };

  const handleSaveGifUrl = async () => {
    if (!gifUrlInput.trim()) {
      await setGifUrl(exercise.id, '');
      setLocalGifUrl('');
      return;
    }
    const url = gifUrlInput.trim();
    await setGifUrl(exercise.id, url);
    setLocalGifUrl(url);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localExercise);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-dark-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasPrev && onPrev && (
              <button onClick={onPrev} className="text-gray-400 hover:text-white p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {hasNext && onNext && (
              <button onClick={onNext} className="text-gray-400 hover:text-white p-1">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* GIF Display */}
          {localGifUrl && (
            <div className="relative">
              <img
                src={localGifUrl}
                alt={localExercise.name}
                className="w-full h-48 object-contain rounded-lg bg-dark-bg"
                onError={() => setLocalGifUrl(null)}
              />
            </div>
          )}

          {/* GIF URL Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL GIF</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={gifUrlInput}
                onChange={e => setGifUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
              />
              <button
                onClick={handleSaveGifUrl}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exercise Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            {mode === 'edit' || mode === 'create' ? (
              <input
                type="text"
                value={localExercise.name}
                onChange={e => setLocalExercise(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
              />
            ) : (
              <p className="text-white font-medium">{localExercise.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            {mode === 'edit' || mode === 'create' ? (
              <textarea
                value={localExercise.description || ''}
                onChange={e => setLocalExercise(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white resize-none h-24"
              />
            ) : (
              <p className="text-gray-300 text-sm">{localExercise.description || 'Nessuna descrizione'}</p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Difficoltà</label>
            {mode === 'edit' || mode === 'create' ? (
              <select
                value={localExercise.difficulty}
                onChange={e => setLocalExercise(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            ) : (
              <p className="text-white capitalize">{localExercise.difficulty}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo</label>
            {mode === 'edit' || mode === 'create' ? (
              <select
                value={localExercise.tipo || ''}
                onChange={e => setLocalExercise(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white"
              >
                <option value="">Non specificato</option>
                <option value="aerobico">Aerobico</option>
                <option value="anaerobico">Anaerobico</option>
              </select>
            ) : (
              <p className="text-white">{localExercise.tipo || 'Non specificato'}</p>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(mode === 'edit' || mode === 'create') && (
          <div className="sticky bottom-0 bg-dark-card border-t border-dark-border p-4 flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-gray-400 hover:text-white">
              Annulla
            </button>
            <button onClick={handleSave} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Salva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
