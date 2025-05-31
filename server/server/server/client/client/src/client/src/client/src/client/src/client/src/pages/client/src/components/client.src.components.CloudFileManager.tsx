import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, ArrowLeft, Image, FileText, Video, Download, Trash2, Plus } from "lucide-react";

interface FileType {
  id: number;
  name: string;
  type: "image" | "video" | "document";
  size: number;
  mimeType: string;
  data: string;
  userId: number;
  folder: string;
  storageType: "cloud";
  createdAt: string;
}

interface CloudFileManagerProps {
  userId: number;
  onBackToCalculator: () => void;
  language: 'ar' | 'en';
  onLanguageChange: () => void;
  onThemeChange: () => void;
}

type FolderType = 'images' | 'documents' | 'videos';

export function CloudFileManager({ userId, onBackToCalculator, language, onLanguageChange, onThemeChange }: CloudFileManagerProps) {
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['/api/files', userId, currentFolder],
    queryFn: async () => {
      if (!currentFolder) return [];
      const response = await fetch(`/api/files/${userId}/${currentFolder}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    enabled: !!currentFolder,
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileData: any) => {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files', userId, currentFolder] });
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await fetch(`/api/files/${fileId}/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files', userId, currentFolder] });
      setSelectedFiles([]);
    },
  });

  const handleFileUpload = async (fileList: FileList) => {
    if (!currentFolder) return;
    
    setUploading(true);
    
    for (const file of Array.from(fileList)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const fileType = getFileType(file.type);
        
        uploadMutation.mutate({
          userId,
          name: file.name,
          type: fileType,
          size: file.size,
          mimeType: file.type,
          data: base64,
          folder: currentFolder,
          storageType: 'cloud',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileType = (mimeType: string): "image" | "video" | "document" => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  };

  const downloadFile = (file: FileType) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteSelectedFiles = () => {
    selectedFiles.forEach(fileId => {
      deleteMutation.mutate(fileId);
    });
  };

  const text = {
    ar: {
      title: 'إدارة الملفات السحابية',
      images: 'الصور',
      videos: 'الفيديوهات', 
      documents: 'المستندات',
      back: 'العودة',
      upload: 'رفع ملف',
      delete: 'حذف المحدد',
      noFiles: 'لا توجد ملفات',
      premium: 'النسخة المميزة',
      unlimited: 'تخزين غير محدود'
    },
    en: {
      title: 'Cloud File Manager',
      images: 'Images',
      videos: 'Videos',
      documents: 'Documents', 
      back: 'Back',
      upload: 'Upload File',
      delete: 'Delete Selected',
      noFiles: 'No files found',
      premium: 'Premium Version',
      unlimited: 'Unlimited Storage'
    }
  };

  const t = text[language];

  if (!currentFolder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBackToCalculator}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft size={20} />
              <span>{t.back}</span>
            </button>
            
            <div className="flex space-x-2">
              <button onClick={onLanguageChange} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                {language === 'ar' ? 'EN' : 'عر'}
              </button>
              <button onClick={onThemeChange} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                🌙
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {t.title}
            </h1>
            <p className="text-green-600 dark:text-green-400 font-semibold">
              ✨ {t.premium} - {t.unlimited}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setCurrentFolder('images')}
              className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t.images}
              </h3>
            </button>

            <button
              onClick={() => setCurrentFolder('videos')}
              className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t.videos}
              </h3>
            </button>

            <button
              onClick={() => setCurrentFolder('documents')}
              className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t.documents}
              </h3>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentFolder(null)}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft size={20} />
            <span>{t.back}</span>
          </button>

          <div className="flex space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              accept={currentFolder === 'images' ? 'image/*' : currentFolder === 'videos' ? 'video/*' : '*'}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload size={20} />
              <span>{uploading ? 'Uploading...' : t.upload}</span>
            </button>

            {selectedFiles.length > 0 && (
              <button
                onClick={deleteSelectedFiles}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={20} />
                <span>{t.delete} ({selectedFiles.length})</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t.noFiles}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file: FileType) => (
              <div
                key={file.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg cursor-pointer transition-all hover:scale-105 ${
                  selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedFiles(prev => 
                    prev.includes(file.id) 
                      ? prev.filter(id => id !== file.id)
                      : [...prev, file.id]
                  );
                }}
              >
                <div className="aspect-square mb-2">
                  {file.type === 'image' ? (
                    <img src={file.data} alt={file.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {file.type === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(file);
                  }}
                  className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
