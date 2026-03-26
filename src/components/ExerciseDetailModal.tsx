import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Clock, Zap, Target, Trash2, Upload, Image, Loader2, Search, Save, Edit3 } from 'lucide-react';
import { Exercise } from '../data/types';
import { supabase } from '../supabase';
import { getGifUrl, setGifUrl, removeGifUrl } from '../data/gifMapping';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  gifUrl?: string | null;
  onClose: () => void;
  onSave?: (exerciseData: Partial<Exercise>) => void;
  onEdit?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onGifUpdated?: (exerciseId: string, newUrl: string | null) => void;
  showUpload?: boolean;
  mode?: 'view' | 'edit' | 'create';
}

export function ExerciseDetailModal({
  exercise,
  gifUrl = null,
  onClose,
  onSave,
  onEdit,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onGifUpdated,
  showUpload = true,
  mode: propMode = 'view',
}: ExerciseDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(propMode === 'edit' || propMode === 'create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for edit mode
  const [editName, setEditName] = useState(exercise.name || '');
  const [editMuscles, setEditMuscles] = useState(exercise.muscles?.join(', ') || '');
  const [editReps, setEditReps] = useState(exercise.reps?.toString() || '');
  const [editDuration, setEditDuration] = useState(exercise.duration?.toString() || '');
  const [editDifficulty, setEditDifficulty] = useState(exercise.difficulty || 'intermediate');
  const [editTipo, setEditTipo] = useState(exercise.tipo || 'anaerobico');
  const [editDescription, setEditDescription] = useState(exercise.description || '');

  useEffect(() => {
    setImageError(false);
    setEditName(exercise.name || '');
    setEditMuscles(exercise.muscles?.join(', ') || '');
    setEditReps(exercise.reps?.toString() || '');
    setEditDuration(exercise.duration?.toString() || '');
    setEditDifficulty(exercise.difficulty || 'intermediate');
    setEditTipo(exercise.tipo || 'anaerobico');
    setEditDescription(exercise.description || '');
    setIsEditing(propMode === 'edit' || propMode === 'create');
  }, [exercise, propMode]);

  // Load GIF if not provided by parent
  useEffect(() => {
    if (!gifUrl && onGifUpdated && exercise?.id) {
      getGifUrl(exercise.id).then(url => {
        if (url && onGifUpdated) {
          onGifUpdated(exercise.id, url);
        }
      }).catch(() => {});
    }
  }, [exercise, gifUrl]);

  const difficultyColor = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[exercise.difficulty];

  const difficultyLabel = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzato',
  }[exercise.difficulty];

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
      'Plyo Push-Ups': 'Push-up esplosivo con stacco delle mani dal suolo. Livello intermedio tra push-up e clap push-up.',
      'Explosive Mountain Climbers': 'Mountain climbers eseguiti alla massima velocità. Cardio ad alta intensità.',
      'Jumping Jacks': 'Da fermo, salta aprendo gambe e braccia, poi torna alla posizione. Cardio classico.',
      'High Knees': 'Corri sul posto portando le ginocchia alte. Cardio e warm-up.',
      'Butt Kicks': 'Corri sul posto toccando i glutei con i talloni. Cardio e attivazione hamstrings.',
      'Sprint in Place': 'Sprinta sul posto: massima intensità per breve durata.',
      'Burpees (Cardio)': 'Come i burpees normali ma contati come esercizio cardio ad alta intensità.',
      'Mountain Climbers (Fast)': 'Mountain climbers eseguiti velocemente per il cardio.',
      'Jump Rope': 'Salta la corda. Esercizio cardio eccellente per coordinazione e polpacci.',
      'Squat Jumps (Cardio)': 'Come jump squats ma contati nel contesto cardio. Stesso movimento.',
      'Shadow Boxing': 'Boxe simulata senza avversario. Ottimo per cardio e coordinazione.',
      'Fast Feet': 'Movimento rapido dei piedi sul posto. Agilità e cardio.',
      'Plank Jacks': 'In plank, salta aprendo e chiudendo le gambe come un jumping jack. Cardio e core.',
    };
    return descriptions[exercise.name] || `Esercizio per ${exercise.muscles.join(', ')}. Mantieni una forma corretta durante l'esecuzione.`;
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

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await uploadFile(files[0]);
    }
  }, [exercise.id]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      await uploadFile(files[0]);
    }
  }, [exercise.id]);

  // Upload file to Supabase storage
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress('Caricamento in corso...');

    try {
      // Use timestamp in filename to avoid conflicts
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'gif';
      const filename = `${exercise.id}_${timestamp}.${ext}`;
      
      // First delete any existing file for this exercise
      const { data: existingFiles } = await supabase.storage
        .from('gifs')
        .list('', { search: exercise.id });
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => f.name);
        await supabase.storage.from('gifs').remove(filesToDelete);
      }
      
      // Then upload new file with timestamp name
      const { data, error } = await supabase.storage
        .from('gifs')
        .upload(filename, file, {
          cacheControl: '0',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gifs')
        .getPublicUrl(filename);

      // Add timestamp to bust browser cache
      const cachedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      setUploadProgress('Caricamento completato!');
      
      // Save to database with timestamp filename
      await setGifUrl(exercise.id, cachedUrl);
      
      // Notify parent with cache-busted URL
      if (onGifUpdated) {
        onGifUpdated(exercise.id, cachedUrl);
      }

      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress(`Errore: ${error.message}`);
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 3000);
    }
  };

  const handleDeleteGif = async () => {
    if (!gifUrl) return;

    setIsDeleting(true);
    setUploadProgress('Eliminazione in corso...');

    try {
      const filename = `${exercise.id}.gif`;
      
      const { error } = await supabase.storage
        .from('gifs')
        .remove([filename]);

      if (error) {
        throw new Error(error.message);
      }

      // Remove from database
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

  const handleSave = () => {
    if (!onSave) return;
    
    const musclesArray = editMuscles.split(',').map(m => m.trim()).filter(m => m);
    
    onSave({
      name: editName,
      muscles: musclesArray,
      reps: editReps ? parseInt(editReps) : null,
      duration: editDuration ? parseInt(editDuration) : null,
      difficulty: editDifficulty,
      tipo: editTipo,
      description: editDescription
    });
  };

  // Open Google Images search for this exercise
  const searchGif = () => {
    const query = encodeURIComponent(`${exercise.name} exercise gif`);
    const searchUrl = `https://www.google.com/search?tbs=itp:animated&tbm=isch&q=${query}`;
    const width = 600;
    const height = 400;
    // Centered relative to viewport, 60px higher than center
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2) - 60;
    window.open(searchUrl, 'gifsearch', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div 
        className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-white">
              {isEditing ? (propMode === 'create' ? 'Nuovo Esercizio' : 'Modifica Esercizio') : exercise.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Salva
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content - Two columns */}
        <div className="flex flex-col md:flex-row h-[calc(85vh-80px)]">
          {/* Left - GIF + Upload Area */}
          <div className="md:w-1/2 bg-zinc-950 flex flex-col p-4">
            {/* GIF Display */}
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              {gifUrl && !imageError ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={gifUrl}
                    alt={`${exercise.name} animation`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={() => setImageError(true)}
                  />
                  {/* Delete Button */}
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
                <div className="flex flex-col items-center justify-center text-zinc-500">
                  <Play className="w-16 h-16 mb-4 opacity-50" />
                  <p>GIF non disponibile</p>
                </div>
              )}
            </div>

            {/* Upload Status */}
            {uploadProgress && (
              <div className="text-center py-2 text-sm text-blue-500">
                {uploadProgress}
              </div>
            )}

            {/* Search & Upload Area */}
            <div className="mt-4 space-y-3">
              {/* Search GIF Button */}
              <button
                onClick={searchGif}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Cerca GIF su Google Immagini
              </button>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <p className="text-sm text-zinc-400">Caricamento...</p>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-zinc-500'}`} />
                    <p className="text-sm text-zinc-400 mb-1">
                      Trascina qui la GIF scaricata
                    </p>
                    <p className="text-xs text-zinc-600 mb-3">
                      oppure
                    </p>
                    <button
                      onClick={openFilePicker}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Image className="w-4 h-4" />
                      Sfoglia
                    </button>
                    <p className="text-xs text-zinc-600 mt-2">Formato: immagini (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right - Description / Edit Form */}
          <div className="md:w-1/2 p-6 overflow-y-auto modal-scroll">
            {isEditing ? (
              /* Edit/Create Form - compact version */
              <div className="modal-edit-form space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Nome esercizio"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Muscoli</label>
                  <input
                    type="text"
                    value={editMuscles}
                    onChange={(e) => setEditMuscles(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Chest, Shoulders"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Reps</label>
                    <input
                      type="number"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Durata (s)</label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Difficolta</label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
                    <select
                      value={editTipo}
                      onChange={(e) => setEditTipo(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                    >
                      <option value="anaerobico">Anaerobico</option>
                      <option value="aerobico">Aerobico</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Descrizione</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none text-sm"
                    placeholder="Descrizione..."
                  />
                </div>
              </div>
            ) : (
              /* View Mode - larger 20% */
              <div className="space-y-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-base font-medium border ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-base font-medium border ${
                    exercise.tipo === 'aerobico' 
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' 
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  }`}>
                    {exercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                  </span>
                  {exercise.reps && (
                    <span className="px-3 py-1.5 rounded-full text-base font-medium bg-zinc-800 text-zinc-300 flex items-center gap-1.5">
                      <Zap className="w-5 h-5" />
                      {exercise.reps} reps
                    </span>
                  )}
                  {exercise.duration && (
                    <span className="px-3 py-1.5 rounded-full text-base font-medium bg-zinc-800 text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-5 h-5" />
                      {exercise.duration}s
                    </span>
                  )}
                </div>

                {/* Muscles */}
                <div>
                  <h3 className="text-base font-medium text-zinc-400 mb-2">Muscoli</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.muscles?.map((muscle) => (
                      <span
                        key={muscle}
                        className="px-3 py-1 rounded-full text-base bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-base font-medium text-zinc-400 mb-2">Descrizione</h3>
                  <p className="text-zinc-200 text-base leading-relaxed">{editDescription || getDescription(exercise.name)}</p>
                </div>

                {/* Navigation and Edit */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base transition-colors ${
                      hasPrev
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Precedente
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        if (onEdit) onEdit();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-base transition-colors"
                    >
                      <Edit3 className="w-5 h-5" />
                      Modifica
                    </button>
                    <button
                      onClick={onNext}
                      disabled={!hasNext}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base transition-colors ${
                        hasNext
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                          : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      Successivo
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
