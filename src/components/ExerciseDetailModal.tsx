import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Clock, Zap, Target, Trash2, Upload, Image, Loader2, Search, Save, Edit3 } from 'lucide-react';
import { Exercise } from '../data/types';
import { supabase } from '../supabase';
import { setGifUrl, removeGifUrl } from '../data/gifMapping';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  mode?: 'view' | 'edit' | 'create';
  gifUrl?: string | null;
  onClose: () => void;
  onSave?: (exerciseData: Partial<Exercise>) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onGifUpdated?: (exerciseId: string, newUrl: string | null) => void;
  showUpload?: boolean;
}

export function ExerciseDetailModal({
  exercise,
  mode: propMode = 'view',
  gifUrl = null,
  onClose,
  onSave,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onGifUpdated,
  showUpload = true,
}: ExerciseDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(propMode === 'create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for edit/create mode
  const [editName, setEditName] = useState(exercise.name);
  const [editMuscles, setEditMuscles] = useState(exercise.muscles?.join(', ') || '');
  const [editReps, setEditReps] = useState(exercise.reps?.toString() || '');
  const [editDuration, setEditDuration] = useState(exercise.duration?.toString() || '');
  const [editDifficulty, setEditDifficulty] = useState(exercise.difficulty || 'intermediate');
  const [editDescription, setEditDescription] = useState(exercise.description || '');

  useEffect(() => {
    setImageError(false);
    setEditName(exercise.name);
    setEditMuscles(exercise.muscles?.join(', ') || '');
    setEditReps(exercise.reps?.toString() || '');
    setEditDuration(exercise.duration?.toString() || '');
    setEditDifficulty(exercise.difficulty || 'intermediate');
    setEditDescription(exercise.description || '');
    setIsEditing(propMode === 'create');
  }, [exercise, propMode]);

  const isCreateMode = propMode === 'create';

  const difficultyColor = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[exercise.difficulty] || 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  const difficultyLabel = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzato',
  }[exercise.difficulty] || 'Intermedio';

  const getDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      'Push-Ups': 'Distenditi in posizione planck con le mani alla larghezza delle spalle. Abbassa il petto verso il pavimento mantenendo il corpo allineato, poi spingi verso l\'alto. Esercizio fondamentale per petto, spalle e tricipiti.',
      'Diamond Push-Ups': 'Posiziona le mani formando un rombo sotto il petto. Abbassa il corpo mantenendo i gomiti vicini al corpo. Intensifica il lavoro sui tricipiti e sulla parte interna del petto.',
      'Pike Push-Ups': 'Forma una V rovesciata con il corpo, anca alta. Abbassa la testa verso il pavimento tra le mani. Ottimo per le spalle e la mobilità della colonna.',
      'Dumbbell Bench Press': 'Sdraiato su una panca, stringi i manubri sopra il petto. Abbassa i pesi ai lati del petto e poi spingi verso l\'alto. Esercizio classico per petto, spalle e tricipiti.',
      'Overhead Press': 'In piedi con manubri alle spalle, spingi verso il soffitto fino a stendere le braccia. Lavoro completo per le spalle e il core.',
      'Dips': 'Tra le parallele o su una sedia, abbassa il corpo piegando i gomiti a 90 gradi, poi spingi verso l\'alto. Esercizio eccellente per petto, spalle e tricipiti.',
      'Decline Push-Ups': 'Con i piedi su un rialzo, esegui un push-up. Maggiore attivazione della parte superiore del petto e delle spalle anteriori.',
      'Close-Grip Bench Press': 'Sdraiato, mani strette sulla barra. Abbassa alla cassa toracica e spingi verso l\'alto. Enfatizza i tricipiti.',
      'Arnold Press': 'Partendo con i palmi verso di te, ruota e spingi i manubri verso l\'alto. Esercizio completo per le spalle inventato da Arnold Schwarzenegger.',
      'Cable Chest Fly': 'In piedi tra i cavi, porta le braccia avanti al petto aprendo i gomiti. Esercizio di isolamento per il petto.',
      'Wall Handstand Push-Ups': 'In verticale contro il muro, abbassa la testa verso il pavimento e spingi verso l\'alto. Esercizio avanzato per spalle e tricipiti.',
      'Pull-Ups': 'Afferra la sbarra con presa prona, più larga delle spalle. Tirati fino al petto verso la sbarra mantenendo il corpo rigido. Esercizio top per dorsali e bicipiti.',
      'Chin-Ups': 'Afferra la sbarra con i palmi verso di te. Tirati fino al mento. Maggiore attivazione dei bicipiti rispetto ai pull-up.',
      'Bent Over Rows': 'Busto avanti, schiena dritta, tira i manubri verso l\'addome. Esercizio base per la schiena.',
      'Lat Pulldown': 'Seduto alla macchina, abbassa la barra dietro la nuca verso il petto. Simula il movimento dei pull-up.',
      'Face Pulls': 'Al cavo all\'altezza del viso, tira verso il viso separando le mani. Esercizio per i deltoidi posteriori e la salute della cuffia dei rotatori.',
      'Dumbbell Curls': 'In piedi, manubri lungo i fianchi. Piega i gomiti portando i pesi alle spalle. Esercizio di isolamento per i bicipiti.',
      'Hammer Curls': 'Manubri con i palmi rivolti uno verso l\'altro. Piega i gomiti. Lavora bicipiti e avambracci.',
      'Deadlifts': 'Con la barra a terra, piega anche le ginocchia, afferra e solleva mantenendo la schiena dritta. Esercizio completo per schiena, glutei e hamstrings.',
      'Seated Cable Row': 'Seduto alla macchina, tira il cavo verso l\'addome. Esercizio per la schiena e i bicipiti.',
      'Inverted Rows': 'Sotto una sbarra, tira il petto verso di essa mantenendo il corpo dritto. Esercizio eccellente per i dorsali.',
      'Preacher Curls': 'Seduto al banco Scott, piega i gomiti portando i manubri alle spalle. Isolation for biceps.',
      'Squats': 'In piedi, piedi larghi quanto le spalle. Siede indietro come su una sedia, ginocchia sopra le punte. Esercizio base per gambe e glutei.',
      'Lunges': 'Un passo avanti, abbassa il ginocchio posteriore quasi a terra. Alterna le gambe. Lavoro eccellente per quads e glutei.',
      'Romanian Deadlifts': 'In piedi, busto avanti tenendo la barra. Mantieni le gambe quasi dritte e senti lo stretch negli hamstrings. Per glutei e hamstrings.',
      'Leg Press': 'Alla macchina, spinge la piattaforma via dalle spalle. Esercizio sicuro per quads e glutei.',
      'Bulgarian Split Squats': 'Un piede avanti su una panca, l\'altro dietro. Abbassa il ginocchio posteriore a terra. Squat unilaterale per quads e glutei.',
      'Hip Thrusts': 'Schiena a terra su una panca, anca in alto. Spinge le anche verso il soffitto. Esercizio migliore per i glutei.',
      'Calf Raises': 'In piedi, sale sulle punte dei piedi. Esercizio semplice ed efficace per i polpacci.',
      'Goblet Squats': 'Con un manubrio al petto, esegui uno squat profondo. Ottimo per imparare la tecnica.',
      'Step-Ups': 'Sale su una panca con una gamba, poi l\'altra. Esercizio unilaterale per quads e glutei.',
      'Wall Sit': 'Con la schiena contro il muro, scendi come se dovessi sederti. Mantieni la posizione. Isometric workout per le gambe.',
      'Glute Bridges': 'Sdraiato, spinge le anche verso il soffitto. Esercizio semplice ma efficace per i glutei.',
      'Plank': 'In appoggio sui gomiti e sulle punte dei piedi, corpo rigido. Mantieni la posizione. Esercizio isometric per il core.',
      'Crunches': 'Sdraiato, mani dietro la testa, solleva le spalle verso le ginocchia. Esercizio classico per gli addominali.',
      'Bicycle Crunches': 'Sdraiato, porta il gomito controlaterale al ginocchio opposto in movimento pedalando. Lavora addominali e obliqui.',
      'Leg Raises': 'Sdraiato, gambe dritte, solleva le gambe perpendicolari al pavimento. Esercizio per il basso addome.',
      'Russian Twists': 'Seduto, busto inclinato, ruota il busto a destra e sinistra. Esercizio per gli obliqui.',
      'Mountain Climbers': 'In posizione planck, porta le ginocchia al petto alternandole rapidamente. Cardio e core.',
      'Dead Bug': 'Sdraiato, braccia in alto e gambe a 90 gradi. Stendi un braccio e la gamba opposta mantenendo la schiena a terra. Controlla la core stability.',
      'Side Plank': 'In appoggio su un gomito, corpo di lato. Mantieni la linea retta. Per gli obliqui.',
      'Ab Rollout': 'In ginocchio con il rullo, rotola avanti e torna indietro. Esercizio avanzato per il core.',
      'V-Ups': 'Sdraiato, solleva gambe e busto contemporaneamente formando una V. Esercizio completo per gli addominali.',
      'Flutter Kicks': 'Sdraiato, gambe alternate su e giù aeree. Lavoro per il basso addome.',
      'Jump Squats': 'Esegui uno squat esplosivo saltando alla fine. Aggiunge plyometrics al classico squat.',
      'Burpees': 'Da in piedi, salta giù in planck, fai un push-up, salta i piedi avanti e salta su con le braccia sopra la testa.',
      'Box Jumps': 'Salta su un box mantenendo l\'atterraggio morbido. Esercizio plyometrico per le gambe.',
      'Lateral Jumps': 'Salta di lato da un punto all\'altro. Lavoro per i glutei e l\'equilibrio.',
      'Jump Lunges': 'Esegui un lunge esplosivo saltando e alternando le gambe in aria.',
      'Tuck Jumps': 'Salta in alto portando le ginocchia al petto. Alta intensità per il plyometrics.',
      'Squat Thrusts': 'Come un burpee ma senza il push-up e il salto finale. Base per i plyometrics.',
      'Skater Jumps': 'Salta lateralmente atterrando su una gamba, l\'altra dietro. Imita il movimento del pattinaggio.',
      'Clap Push-Ups': 'Push-up esplosivo con stacco delle mani per un applauso in aria.',
      'Plyo Push-Ups': 'Push-up esplosivo senza applauso. Stacco leggero delle mani da terra.',
      'Explosive Mountain Climbers': 'Mountain climbers eseguiti alla massima velocità. Alta intensita cardio.',
      'Jumping Jacks': 'In piedi, salta aprendo gambe e braccia contemporaneamente. Cardio classico.',
      'High Knees': 'Corri sul posto portando le ginocchia alte. Cardio e lavoro per hip flexors.',
      'Butt Kicks': 'Corri sul posto cercando di toccare i glutei con i talloni. Cardio per hamstrings.',
      'Sprint in Place': 'Corri sul posto alla massima intensità. Interval training.',
      'Burpees (Cardio)': 'Versione cardio dei burpees senza push-up. Alta intensità full body.',
      'Mountain Climbers (Fast)': 'Mountain climbers eseguiti velocemente. Cardio e core.',
      'Jump Rope': 'Salto con la corda. Eccellente per cardio e polpacci.',
      'Squat Jumps (Cardio)': 'Squat con salto esplosivo. Cardio e lower body.',
      'Shadow Boxing': 'Boxe simulata senza avversario. Cardio e coordinazione.',
      'Fast Feet': 'Movimento rapido dei piedi sul posto. Cardio e agilità.',
      'Plank Jacks': 'Jumping jacks eseguiti in posizione planck. Cardio e core.',
    };
    return descriptions[name] || 'Esercizio versatile per allenamento funzionale.';
  };

  const handleSave = () => {
    if (!onSave) return;
    
    const musclesArray = editMuscles.split(',').map(m => m.trim()).filter(m => m);
    
    onSave({
      name: editName,
      muscles: musclesArray,
      reps: editReps ? parseInt(editReps) : null,
      duration: editDuration ? parseInt(editDuration) : null,
      difficulty: editDifficulty,
      description: editDescription
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadFile(file);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!exercise?.id) return;
    
    setIsUploading(true);
    setUploadProgress('Caricamento...');
    
    try {
      // Delete old GIF first if exists
      if (gifUrl) {
        await removeGifUrl(exercise.id);
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${exercise.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gifs')
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadProgress('Errore: ' + uploadError.message);
        setTimeout(() => setUploadProgress(null), 3000);
        setIsUploading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from('gifs')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      await setGifUrl(exercise.id, publicUrl);
      
      if (onGifUpdated) {
        onGifUpdated(exercise.id, publicUrl + '?t=' + Date.now());
      }
      
      setUploadProgress('Caricata!');
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress('Errore: ' + error.message);
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 3000);
    }
  };

  const handleDeleteGif = async () => {
    if (!exercise?.id || !confirm('Eliminare questa GIF?')) return;
    
    setIsDeleting(true);
    try {
      if (gifUrl) {
        // Extract filename from URL
        const urlParts = gifUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        
        await supabase.storage
          .from('gifs')
          .remove([fileName]);
      }
      
      await removeGifUrl(exercise.id);
      
      if (onGifUpdated) {
        onGifUpdated(exercise.id, null);
      }

      setUploadProgress('GIF eliminata!');
      setTimeout(() => {
        setUploadProgress(null);
        setIsDeleting(false);
      }, 1500);
    } catch (error: any) {
      console.error('Delete error:', error);
      setUploadProgress(`Errore: ${error.message}`);
      setTimeout(() => {
        setUploadProgress(null);
        setIsDeleting(false);
      }, 3000);
    }
  };

  // Open Google Images search for this exercise
  const searchGif = () => {
    const query = encodeURIComponent(`${exercise.name} exercise gif`);
    const searchUrl = `https://www.google.com/search?tbs=itp:animated&tbm=isch&q=${query}`;
    const width = 680;
    const height = 500;
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2) - 40;
    window.open(searchUrl, 'gifsearch', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Edit/Create form content
  const renderEditForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="Nome esercizio"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Muscoli (separati da virgola)</label>
        <input
          type="text"
          value={editMuscles}
          onChange={(e) => setEditMuscles(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          placeholder="Chest, Shoulders, Triceps"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Reps</label>
          <input
            type="number"
            value={editReps}
            onChange={(e) => setEditReps(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            placeholder="12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Durata (secondi)</label>
          <input
            type="number"
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            placeholder="30"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Difficolta</label>
        <select
          value={editDifficulty}
          onChange={(e) => setEditDifficulty(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzato</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">Descrizione</label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
          placeholder="Descrizione dell'esercizio..."
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div 
        className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              {isCreateMode ? 'Nuovo Esercizio' : isEditing ? 'Modifica Esercizio' : exercise.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="flex flex-col md:flex-row h-[calc(85vh-80px)]">
            {/* Left - GIF + Upload Area (only in create if has image) */}
            {showUpload && (
              <div className="md:w-1/2 bg-zinc-950 flex flex-col p-4">
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                  {gifUrl && !imageError ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={gifUrl}
                        alt={`${exercise.name} animation`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={() => setImageError(true)}
                      />
                      <button
                        onClick={handleDeleteGif}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                        title="Elimina GIF"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={openFilePicker}
                    >
                      <Image className="w-10 h-10 text-zinc-500 mb-2" />
                      <p className="text-zinc-400 text-sm text-center">
                        Trascina un'immagine qui<br />oppure clicca per selezionare
                      </p>
                      <p className="text-zinc-500 text-xs mt-2">PNG, JPG, GIF, WebP</p>
                    </div>
                  )}
                </div>

                {/* Upload progress */}
                {uploadProgress && (
                  <div className="mt-2 text-center text-sm text-emerald-400">
                    {uploadProgress}
                  </div>
                )}

                {/* Upload/Download buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={openFilePicker}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Carica
                  </button>
                  <button
                    onClick={searchGif}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Cerca su Google
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Right - Edit Form */}
            <div className="md:w-1/2 p-6 overflow-y-auto">
              {renderEditForm()}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salva
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-[calc(85vh-80px)]">
            {/* Left - GIF + Upload Area */}
            {showUpload && (
              <div className="md:w-1/2 bg-zinc-950 flex flex-col p-4">
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                  {gifUrl && !imageError ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={gifUrl}
                        alt={`${exercise.name} animation`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={() => setImageError(true)}
                      />
                      <button
                        onClick={handleDeleteGif}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                        title="Elimina GIF"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-center">
                      <Image className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nessuna immagine</p>
                    </div>
                  )}
                </div>

                {/* Upload/Download buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={openFilePicker}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Carica
                  </button>
                  <button
                    onClick={searchGif}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Cerca su Google
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Right - Exercise Info */}
            <div className="md:w-1/2 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Difficulty badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-sm font-medium border ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                </div>

                {/* Muscles */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Muscoli</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscles?.map((muscle, idx) => (
                      <span key={idx} className="px-3 py-1 bg-zinc-800 rounded-lg text-white text-sm">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reps or Duration */}
                <div className="flex gap-4">
                  {exercise.reps && (
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-medium">{exercise.reps} reps</span>
                    </div>
                  )}
                  {exercise.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-medium">{exercise.duration} secondi</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Descrizione</h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {editDescription || getDescription(exercise.name)}
                  </p>
                </div>
              </div>

              {/* Navigation and Edit buttons */}
              <div className="mt-6 flex justify-between items-center">
                <div className="flex gap-2">
                  {hasPrev && (
                    <button
                      onClick={onPrev}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                  )}
                  {hasNext && (
                    <button
                      onClick={onNext}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
                
                {!isCreateMode && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifica
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
