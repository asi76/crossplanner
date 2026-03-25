import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Clock, Zap, Target, Trash2, Upload, Image, Loader2, Search } from 'lucide-react';
import { Exercise } from '../data/types';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  gifUrl: string | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onGifUpdated?: (exerciseId: string, newUrl: string | null) => void;
}

export function ExerciseDetailModal({
  exercise,
  gifUrl,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onGifUpdated,
}: ExerciseDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [gifUrl]);

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
      'Pull-Ups': 'Afferra la sbarra con presa prona, più larga delle spalle. Tira il petto verso la sbarra mantenendo il corpo rigido. Esercizio top per dorsali e bicipiti.',
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
      'Squat Thrusts': 'Come un burpee ma senza il push-up e il salto finale. base per i plyometrics.',
      'Skater Jumps': 'Salta lateralmente atterrando su una gamba, l\'altra dietro. Imita il movimento del pattinaggio.',
      'Clap Push-Ups': 'Push-up esplosivo con ilpalmo stacco delle mani per un applauso in aria.',
      'Plyo Push-Ups': 'Push-up esplosivo con stacco delle mani dal suolo. Livello intermedio tra push-up e clap push-up.',
      'Explosive Mountain Climbers': 'Mountain climbers eseguiti alla massima velocità. Cardio ad alta intensità.',
      'Jumping Jacks': 'Da fermo, salta aprendo gambe e braccia, poi torna alla posizione. Cardio classico.',
      'High Knees': 'Corri sul posto portando le ginocchia alte. Cardio e warm-up.',
      'Butt Kicks': 'Corri sul posto toccando i glutei con i talloni. Cardio e attivazione hamstrings.',
      'Sprint in Place': 'Sprinta sul posto::massima intensità per breve durata.',
      'Burpees (Cardio)': 'Come i burpees normali ma contati come esercizio cardio ad alta intensità.',
      'Mountain Climbers (Fast)': 'Mountain climbers eseguiti velocemente per il cardio.',
      'Jump Rope': 'Salta la corda. Esercizio cardio eccellente per coordination and calves.',
      'Squat Jumps (Cardio)': 'Come jump squats ma contati nel contesto cardio. Stesso movimento.',
      'Shadow Boxing': 'Boxi simulato senza avversario. Ottimo per cardio e coordinazione.',
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
    if (files.length > 0 && files[0].type === 'image/gif') {
      await uploadFile(files[0]);
    }
  }, [exercise.id]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === 'image/gif') {
      await uploadFile(files[0]);
    }
  }, [exercise.id]);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress('Caricamento in corso...');

    try {
      const formData = new FormData();
      formData.append('gif', file);
      formData.append('exerciseId', exercise.id);

      // Use API URL from environment or fallback to relative URL
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const uploadUrl = apiUrl ? `${apiUrl}/api/upload-gif` : '/api/upload-gif';

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadProgress('Caricamento completato!');
      
      if (onGifUpdated) {
        onGifUpdated(exercise.id, result.url);
      }

      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Errore nel caricamento');
      setTimeout(() => setUploadProgress(null), 2000);
      setIsUploading(false);
    }
  };

  const handleDeleteGif = async () => {
    if (!gifUrl) return;

    setIsDeleting(true);
    setUploadProgress('Eliminazione in corso...');

    try {
      // Extract file ID from Google Drive URL (format: uc?export=view&id=XXX)
      let fileId = null;
      const match = gifUrl.match(/[?&]id=([^&]+)/);
      if (match) {
        fileId = match[1];
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const deleteUrl = apiUrl ? `${apiUrl}/api/delete-gif` : '/api/delete-gif';

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: exercise.id, fileId }),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      if (onGifUpdated) {
        onGifUpdated(exercise.id, null);
      }

      setUploadProgress('GIF eliminata!');
      setTimeout(() => {
        setUploadProgress(null);
        setIsDeleting(false);
      }, 1500);
    } catch (error) {
      console.error('Delete error:', error);
      setUploadProgress('Errore nell\'eliminazione');
      setTimeout(() => setUploadProgress(null), 2000);
      setIsDeleting(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Open Google Images search for this exercise
  const searchGif = () => {
    const query = encodeURIComponent(`${exercise.name} exercise gif`);
    const searchUrl = `https://www.google.com/search?tbs=itp:animated&tbm=isch&q=${query}`;
    window.open(searchUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
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
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
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
              <div className="text-center py-2 text-sm text-emerald-400">
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
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                    <p className="text-sm text-zinc-400">Caricamento...</p>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <p className="text-sm text-zinc-400 mb-1">
                      Trascina qui la GIF scaricata
                    </p>
                    <p className="text-xs text-zinc-600 mb-3">
                      oppure
                    </p>
                    <button
                      onClick={openFilePicker}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Image className="w-4 h-4" />
                      Sfoglia
                    </button>
                    <p className="text-xs text-zinc-600 mt-2">Formato: GIF (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right - Description */}
          <div className="md:w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${difficultyColor}`}>
                  {difficultyLabel}
                </span>
                {exercise.reps && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-800 text-zinc-300 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {exercise.reps} reps
                  </span>
                )}
                {exercise.duration && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-800 text-zinc-300 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exercise.duration}s
                  </span>
                )}
              </div>

              {/* Muscles */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Muscoli coinvolti</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-3 py-1 rounded-full text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrizione</h3>
                <p className="text-zinc-200 leading-relaxed">{getDescription(exercise.name)}</p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    hasPrev
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Precedente
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    hasNext
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  Successivo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
