import { useState, useEffect, useRef } from "react";
import { Upload, ArrowLeft, Download, Trash2 } from "lucide-react";

interface FileType {
  id: number;
  name: string;
  type: "image" | "video" | "document";
  size: number;
  mimeType: string;
  data: string;
  userId: number;
}

interface CleanSimpleFileManagerProps {
  userId: number;
  userPin?: string;
  onBackToCalculator: () => void;
}

export function CleanSimpleFileManager({ userId, userPin, onBackToCalculator }: CleanSimpleFileManagerProps) {
  const [files, setFiles] = useState<FileType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxStorage = 50; // 50MB for free version

  useEffect(() => {
    loadFiles();
  }, [userId]);

  const loadFiles = () => {
    const savedFiles = localStorage.getItem(`calcpro_files_${userId}`);
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      setFiles(parsedFiles);
      
      const totalSize = parsedFiles.reduce((sum: number, file: FileType) => sum + file.size, 0);
      setStorageUsed(totalSize / (1024 * 1024)); // Convert to MB
    }
  };

  const saveFiles = (newFiles: FileType[]) => {
    localStorage.setItem(`calcpro_files_${userId}`, JSON.stringify(newFiles));
    setFiles(newFiles);
    
    const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
    setStorageUsed(totalSize / (1024 * 1024));
  };

  const compressImage = async (file: File): Promise<{ data: string; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for compressed images
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress with reduced quality
          const compressedData = canvas.toDataURL('image/jpeg', 0.6);
          
          // Calculate compressed size (roughly)
          const compressedSize = Math.round((compressedData.length * 3) / 4);
          
          resolve({
            data: compressedData,
            size: compressedSize
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (uploading) return;
    setUploading(true);
    
    const newFiles: FileType[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    
    for (const file of Array.from(fileList)) {
      try {
        // Check individual file size
        if (file.size > maxFileSize) {
          alert(`File ${file.name} exceeds the 10MB limit`);
          continue;
        }

        // Check total storage limit
        const fileSizeMB = file.size / (1024 * 1024);
        if (storageUsed + fileSizeMB > maxStorage) {
          alert(`Storage limit reached. You have ${(maxStorage - storageUsed).toFixed(1)}MB remaining.`);
          break;
        }

        let fileData: string;
        let fileSize: number;

        if (file.type.startsWith('image/')) {
          // Compress images
          const compressed = await compressImage(file);
          fileData = compressed.data;
          fileSize = compressed.size;
        } else {
          // For non-image files, use regular FileReader
          fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          fileSize = file.size;
        }

        const newFile: FileType = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: getFileType(file.type),
          size: fileSize,
          mimeType: file.type,
          data: fileData,
          userId: userId,
        };
        
        newFiles.push(newFile);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        alert(`Error processing file: ${file.name}`);
      }
    }
    
    if (newFiles.length > 0) {
      saveFiles([...files, ...newFiles]);
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const remainingFiles = files.filter(file => !selectedFiles.includes(file.id));
    saveFiles(remainingFiles);
    setSelectedFiles([]);
  };

  const storagePercentage = (storageUsed / maxStorage) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToCalculator}
            className="flex items-center space-x-2 text-blue-600 hover:underline"
          >
            <ArrowLeft size={20} />
            <span>Back to Calculator</span>
          </button>

          <div className="text-sm text-gray-600">
            Free Version • PIN: {userPin}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">File Manager</h1>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Storage Used</span>
              <span>{storageUsed.toFixed(1)} MB / {maxStorage} MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex space-x-3 mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || storageUsed >= maxStorage}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={20} />
              <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
            </button>

            {selectedFiles.length > 0 && (
              <button
                onClick={deleteSelectedFiles}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={20} />
                <span>Delete Selected ({selectedFiles.length})</span>
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No files uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Maximum file size: 10MB</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`relative bg-gray-50 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
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
                  <p className="text-sm text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
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
    </div>
  );
}