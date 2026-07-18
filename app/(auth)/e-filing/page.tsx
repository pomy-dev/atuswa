'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUploadThing } from '@/utils/uploathing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth-context'
import { UserRole, EFileFolder, EFile } from '@/lib/types'
import { Plus, Folder, File, Trash2, FolderPlus, Download, AlertCircle } from 'lucide-react'

export default function EFilingPage() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<EFileFolder[]>(() =>
    JSON.parse(localStorage.getItem('efilesFolders') || '[]').filter((f: EFileFolder) =>
      user?.role === UserRole.SECRETARY_GENERAL || f.branchId === user?.branchId
    )
  )
  const [files, setFiles] = useState<EFile[]>(() =>
    JSON.parse(localStorage.getItem('efiles') || '[]').filter((f: EFile) =>
      user?.role === UserRole.SECRETARY_GENERAL || f.branchId === user?.branchId
    )
  )

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderNotes, setFolderNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { startUpload } = useUploadThing("efilingUploader");
  const inputRef = useRef<HTMLInputElement>(null);

  // Can only access if authorized
  if (![UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.PROJECT_COORDINATOR].includes(user?.role!)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don&apos;t have permission to access e-filing.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddFolder = () => {
    if (!folderName.trim()) return

    const newFolder: EFileFolder = {
      id: `folder_${Date.now()}`,
      branchId: user!.branchId,
      name: folderName,
      notes: folderNotes,
      createdAt: new Date()
    }

    const allFolders = JSON.parse(localStorage.getItem('efilesFolders') || '[]')
    const updated = [...allFolders, newFolder]
    localStorage.setItem('efilesFolders', JSON.stringify(updated))
    setFolders([...folders, newFolder])
    setFolderName('')
    setFolderNotes('')
    setShowNewFolder(false)
  }

  const handleDeleteFolder = (id: string) => {
    const allFolders = JSON.parse(localStorage.getItem('efilesFolders') || '[]')
    const updated = allFolders.filter((f: EFileFolder) => f.id !== id)
    localStorage.setItem('efilesFolders', JSON.stringify(updated))
    setFolders(folders.filter(f => f.id !== id))

    // Also remove files in this folder
    const allFiles = JSON.parse(localStorage.getItem('efiles') || '[]')
    const filesUpdated = allFiles.filter((f: EFile) => f.folderId !== id)
    localStorage.setItem('efiles', JSON.stringify(filesUpdated))
    setFiles(files.filter(f => f.folderId !== id))

    if (selectedFolder === id) setSelectedFolder(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder) {
      setUploadError('Please select a folder first');
      return;
    }

    const fileList = e.currentTarget.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const filesArray = Array.from(fileList);

      const uploadedFiles = await startUpload(filesArray);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        setUploadError("Upload failed - no response from server");
        return;
      }

      uploadedFiles.forEach((uploadedFile, i) => {
        const originalFile = filesArray[i];

        const newFile: EFile = {
          id: `file_${Date.now()}_${i}`,
          branchId: user!.branchId,
          name: uploadedFile.name,
          folderId: selectedFolder,
          url: uploadedFile.url,
          type: originalFile.type || 'application/octet-stream',
          size: uploadedFile.size,
          uploadedBy: user!.name,
          uploadedAt: new Date()
        };

        const allFiles = JSON.parse(localStorage.getItem("efiles") || "[]");
        localStorage.setItem("efiles", JSON.stringify([...allFiles, newFile]));
        setFiles(prev => [...prev, newFile]);
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = (id: string) => {
    const allFiles = JSON.parse(localStorage.getItem('efiles') || '[]')
    const updated = allFiles.filter((f: EFile) => f.id !== id)
    localStorage.setItem('efiles', JSON.stringify(updated))
    setFiles(files.filter(f => f.id !== id))
  }

  const selectedFolderData = selectedFolder ? folders.find(f => f.id === selectedFolder) : null
  const folderFiles = selectedFolder ? files.filter(f => f.folderId === selectedFolder) : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">E-Filing</h1>
        <p className="text-muted-foreground mt-1">Manage documents and files with secure storage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Folders</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewFolder(true)}
                disabled={isUploading}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {showNewFolder && (
              <div className="mb-4 p-3 bg-secondary/10 rounded-lg space-y-2">
                <div>
                  <Label htmlFor="folder-name" className="text-xs">Folder Name</Label>
                  <Input
                    id="folder-name"
                    placeholder="e.g. Board Minutes"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-notes" className="text-xs">Folder Notes (Optional)</Label>
                  <Textarea
                    id="folder-notes"
                    placeholder="Add instructions or notes..."
                    value={folderNotes}
                    onChange={(e) => setFolderNotes(e.target.value)}
                    disabled={isUploading}
                    className="min-h-16 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddFolder} disabled={isUploading} className="flex-1 gap-1">
                    {isUploading && <Spinner className="w-3 h-3" />}
                    Create
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowNewFolder(false)
                    setFolderName('')
                    setFolderNotes('')
                  }} disabled={isUploading} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No folders</p>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${selectedFolder === folder.id
                    ? 'bg-accent/20 border border-accent'
                    : 'hover:bg-secondary/50 border border-transparent'
                    }`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{folder.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive flex-shrink-0"
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Files Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>
                  {selectedFolder
                    ? folders.find(f => f.id === selectedFolder)?.name || 'Files'
                    : 'Select a Folder'}
                </CardTitle>
                {selectedFolder && (
                  <CardDescription>{folderFiles.length} files</CardDescription>
                )}
              </div>
              {selectedFolder && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => document.getElementById('file-input')?.click()}
                    disabled={isUploading}
                    className="gap-1"
                  >
                    {isUploading && <Spinner className="w-3 h-3" />}
                    <Plus className="w-4 h-4" />
                    Upload
                  </Button>
                  <input
                    ref={inputRef}
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Folder Notes */}
            {selectedFolderData?.notes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {selectedFolderData.notes}
                </AlertDescription>
              </Alert>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            {!selectedFolder ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a folder to view files</p>
              </div>
            ) : folderFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files in this folder</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline truncate block"
                        >
                          {file.name}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'} • Uploaded by {file.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <a
                        href={file.url}
                        download
                        className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-destructive"
                        disabled={isUploading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
