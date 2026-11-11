'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { Role, EFileFolder, EFile, Permission, AppUser } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { canSee, recordActivityLog } from '@/lib/constants'
import { useUserIP } from '@/lib/userUserIp'
import { getAllPermissions, getAllRoles, getAllUsersWithRoles } from '@/services/auth-services'
import {
  createEFileFolder, getAllEFileFolders, deleteEFileFolder,
  deleteEFile, getAllEFiles, getEFileSignedUrl, updateEFile, uploadEFile,
} from '@/services/efile-service'
import {
  Plus, Folder, File, FileArchive, FileCode, FileImage, FileText, FileSpreadsheet, Trash2,
  FolderPlus, Download, AlertCircle, Move, Search, Filter, X
} from 'lucide-react'

// Adjust these role identifiers to match your actual role names/ids
const SECRETARY_GENERAL_ROLE = 'Secretary General' // or whatever your system uses

export default function EFilingPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()

  const [folders, setFolders] = useState<EFileFolder[]>([])
  const [files, setFiles] = useState<EFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderNotes, setFolderNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('all')
  const [filterFolderName, setFilterFolderName] = useState('')
  const [filterAffiliate, setFilterAffiliate] = useState<string>('all')

  // Move file state
  const [movingFileId, setMovingFileId] = useState<string | null>(null)
  const [targetFolderId, setTargetFolderId] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)

  const isSecretaryGeneral = user?.role === SECRETARY_GENERAL_ROLE

  // Load roles & permissions
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const [loadedRoles, loadedPermissions] = await Promise.all([
        getAllRoles(supabase, session),
        getAllPermissions(supabase, session),
      ])

      if (!cancelled) {
        setRoles(loadedRoles ?? [])
        setPermissions(loadedPermissions ?? [])
      }
    }

    const loadUsersAndRoles = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const loadedUsers = await getAllUsersWithRoles(supabase, session)
      const usersList = loadedUsers ?? []

      if (!cancelled) {
        setUsers(usersList)
      }
    }

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })
    void loadUsersAndRoles().catch((error: unknown) => {
      console.error('Unable to load users and roles:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user])

  // Load folders from Supabase.
  useEffect(() => {
    if (!user) return

    const loadFolders = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (supabase) {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()
          if (error) throw error
          if (!session) return

          if (!session) return
          setFolders(await getAllEFileFolders(supabase, user.branchId))
        }
      } catch (err) {
        console.error('Unable to load e-filing folders:', err)
        toast.error('Unable to load folders.')
      }
    }

    void loadFolders()
  }, [user])

  // Load files from Supabase when the selected folder changes.
  useEffect(() => {
    if (!selectedFolder) {
      setFiles([])
      return
    }

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const folderFiles = await getAllEFiles(supabase, user?.branchId, selectedFolder!)
        setFiles(folderFiles)
      } catch (err) {
        console.error('Unable to load e-files:', err)
        toast.error('Unable to load files.')
        setFiles([])
      }
    }

    void load()
  }, [selectedFolder, user?.branchId])

  // Visibility helper
  const canViewFolder = (folder: EFileFolder) => {
    if (isSecretaryGeneral) return true

    // Creator
    if (folder.user_id === user?.id) return true

    // Same role
    const creatorRole = users.find(u => u.id === folder.user_id)?.role?.name
    if (creatorRole && creatorRole === user?.role) return true

    return false
  }

  // Filtered folders
  const visibleFolders = useMemo(() => {
    return folders.filter((folder) => {
      if (!canViewFolder(folder)) return false

      if (filterBranch !== 'all' && folder.branch_id !== filterBranch) return false

      if (
        filterFolderName.trim() &&
        !folder.name.toLowerCase().includes(filterFolderName.toLowerCase())
      ) {
        return false
      }

      // Affiliate – adjust field name if your type uses something else
      if (
        filterAffiliate !== 'all' &&
        (folder as any).affiliate_id !== filterAffiliate &&
        (folder as any).affiliate !== filterAffiliate
      ) {
        return false
      }

      return true
    })
  }, [folders, filterBranch, filterFolderName, filterAffiliate, user, isSecretaryGeneral])

  // Unique branches / affiliates for filters (derived from data)
  const branchOptions = useMemo(() => {
    const set = new Set(folders.map((f) => f.branch_id).filter(Boolean))
    return Array.from(set)
  }, [folders])

  const affiliateOptions = useMemo(() => {
    const set = new Set(
      folders
        .map((f) => (f as any).affiliate_id || (f as any).affiliate)
        .filter(Boolean)
    )
    return Array.from(set)
  }, [folders])

  const handleAddFolder = async () => {
    if (!folderName.trim() || !user) return

    try {
      setIsUploading(true)
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const newFolder: EFileFolder = {
        id: '',
        user_id: user.id,
        branch_id: user.branchId?.trim() || null,
        name: folderName.trim(),
        notes: folderNotes,
        created_at: new Date()
      } as EFileFolder

      const created = await createEFileFolder(supabase, newFolder)

      setFolders((prev) => [created, ...prev])
      setFolderName('')
      setFolderNotes('')
      setShowNewFolder(false)

      if (created) {
        recordActivityLog('Create', `Created folder - ${created.name}`, user.id, user.name, ip!)
        toast.success(`Folder "${created.name}" created successfully.`)
      }
    } catch (error) {
      toast.error(`Failed to create folder:` + error)
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id)
    if (!folder) return

    // Only creator can delete (Secretary General only own)
    const isCreator = folder.user_id === user?.id

    if (!isCreator) {
      toast.error('You can only delete folders you created.')
      return
    }

    if (!confirm(`Delete folder "${folder.name}" and all its files?`)) return

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteEFileFolder(supabase, id)

      setFolders((prev) => prev.filter((f) => f.id !== id))

      setFiles((prev) => prev.filter((f) => f.folder_id !== id))

      if (selectedFolder === id) setSelectedFolder(null)

      recordActivityLog(
        'Delete',
        `Deleted folder - ${folder.name}`,
        user?.id,
        user?.name,
        ip!
      )
      toast.success('Folder deleted.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete folder.')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFolder) {
      setUploadError('Please select a folder first')
      return
    }

    const input = e.currentTarget
    const selectedFiles = input.files
    if (!selectedFiles?.length) return

    setIsUploading(true)
    setUploadError('')

    try {
      for (const file of Array.from(selectedFiles)) {
        const stored: EFile = {
          id: '',
          name: file.name,
          folder_id: selectedFolder,
          branch_id: user!.branchId || null,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          uploaded_by: user!.id,
          uploaded_at: new Date().toISOString(),
          storage_path: null,
          file,
        }
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const uploaded = await uploadEFile(supabase, stored)
        setFiles((prev) => [uploaded, ...prev])
      }
      toast.success('File(s) uploaded successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Upload failed.')
    } finally {
      setIsUploading(false)
      input.value = ''
    }
  }

  const handleDeleteFile = async (id: string) => {
    const file = files.find((f) => f.id === id)
    if (!file) return

    const isCreator = file.uploaded_by === user?.id

    if (!isCreator) {
      toast.error('You can only delete files you uploaded.')
      return
    }

    if (!confirm(`Delete file "${file.name}"?`)) return

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteEFile(supabase, id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
      recordActivityLog(
        'Delete',
        `Deleted file - ${file.name}`,
        user?.id,
        user?.name,
        ip!
      )
      toast.success('File deleted.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete file.')
    }
  }

  const handleMoveFile = async () => {
    if (!movingFileId || !targetFolderId) return

    const file = files.find((f) => f.id === movingFileId)
    if (!file) return

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const updatedFile = await updateEFile(supabase, movingFileId, {
        ...file,
        folder_id: targetFolderId,
      })

      // Local update
      setFiles((prev) =>
        prev.map((f) =>
          f.id === movingFileId
            ? { ...f, folder_id: targetFolderId, folderId: targetFolderId }
            : f
        )
      )

      setFiles((prev) => prev.filter((f) => f.id !== updatedFile.id))

      toast.success(`Moved "${file.name}" successfully.`)
      recordActivityLog(
        'Move',
        `Moved file - ${file.name} to folder ${targetFolderId}`,
        user?.id,
        user?.name,
        ip!
      )

      setMovingFileId(null)
      setTargetFolderId('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to move file.')
    }
  }

  const getFileIcon = (type: string, name: string) => {
    const extension = name.split('.').pop()?.toLowerCase()

    if (type.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-blue-500" />
    }
    if (type === 'application/pdf' || extension === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />
    }
    if (type.includes('word') || extension === 'doc' || extension === 'docx') {
      return <FileText className="w-5 h-5 text-blue-700" />
    }
    if (
      type.includes('spreadsheet') ||
      type.includes('excel') ||
      ['xls', 'xlsx', 'csv'].includes(extension ?? '')
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />
    }
    if (type.includes('zip') || ['zip', 'rar', '7z'].includes(extension ?? '')) {
      return <FileArchive className="w-5 h-5 text-orange-500" />
    }
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'sql'].includes(extension ?? '')) {
      return <FileCode className="w-5 h-5 text-purple-500" />
    }
    return <File className="w-5 h-5 text-gray-500" />
  }

  const openEFile = async (file: EFile, download = false) => {
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const url = await getEFileSignedUrl(supabase, file.id)
      if (download) {
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.rel = 'noopener noreferrer'
        link.click()
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      console.error('Unable to open e-file:', err)
      toast.error('Unable to open file.')
    }
  }

  // Permission gate
  if (canSee(user?.role ?? '', roles.map((role) => role.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You don&apos;t have permission to access e-filing.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedFolderData = selectedFolder
    ? folders.find((f) => f.id === selectedFolder)
    : null

  const folderFiles = selectedFolder
    ? files.filter((f) => f.folder_id === selectedFolder)
    : []

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            E-Filing
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure document management • {isSecretaryGeneral ? 'Full access' : 'Role-based view'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Branch filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Branch</Label>
              <Select
                value={filterBranch}
                onValueChange={(value) => {
                  if (value !== null) {
                    setFilterBranch(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Folder name search */}
            <div className="space-y-1.5">
              <Label className="text-xs">Folder name</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search folders..."
                  value={filterFolderName}
                  onChange={(e) => setFilterFolderName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Affiliate filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Affiliate</Label>
              <Select value={filterAffiliate}
                onValueChange={(value) => {
                  if (value !== null) setFilterAffiliate(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All affiliates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All affiliates</SelectItem>
                  {affiliateOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(filterBranch !== 'all' || filterFolderName || filterAffiliate !== 'all') && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterBranch('all')
                  setFilterFolderName('')
                  setFilterAffiliate('all')
                }}
                className="gap-1 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Folders</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewFolder(true)}
                disabled={isUploading}
                className="gap-1"
              >
                <FolderPlus className="w-4 h-4" />
                New
              </Button>
            </div>
            <CardDescription>
              {visibleFolders.length} visible folder
              {visibleFolders.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {showNewFolder && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/40 space-y-3">
                <div>
                  <Label htmlFor="folder-name" className="text-xs">
                    Folder Name
                  </Label>
                  <Input
                    id="folder-name"
                    placeholder="e.g. Board Minutes"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-notes" className="text-xs">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="folder-notes"
                    placeholder="Instructions or description..."
                    value={folderNotes}
                    onChange={(e) => setFolderNotes(e.target.value)}
                    disabled={isUploading}
                    className="min-h-16 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddFolder}
                    disabled={isUploading || !folderName.trim()}
                    className="flex-1 gap-1"
                  >
                    {isUploading && <Spinner className="w-3 h-3" />}
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewFolder(false)
                      setFolderName('')
                      setFolderNotes('')
                    }}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {visibleFolders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No folders match the current filters
              </p>
            ) : (
              <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                {visibleFolders.map((folder) => {
                  const isCreator = folder.user_id === user?.id

                  return (
                    <div
                      key={folder.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors flex items-center justify-between group border ${selectedFolder === folder.id
                        ? 'bg-primary/10 border-primary/40'
                        : 'hover:bg-muted/60 border-transparent'
                        }`}
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{folder.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {folder.branch_id}
                            {folder.user_id ? ` • ${users.find(u => u.id === folder.user_id)?.full_name}` : ''}
                          </p>
                        </div>
                      </div>

                      {isCreator && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFolder(folder.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8 flex-shrink-0"
                          disabled={isUploading}
                          title="Delete folder (creator only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate">
                  {selectedFolder
                    ? folders.find((f) => f.id === selectedFolder)?.name || 'Files'
                    : 'Select a Folder'}
                </CardTitle>
                {selectedFolder && (
                  <CardDescription>
                    {folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}
                  </CardDescription>
                )}
              </div>

              {selectedFolder && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => inputRef.current?.click()}
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
            {/* Folder notes */}
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
                <AlertDescription className="text-xs">{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Move dialog (inline) */}
            {movingFileId && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Move file to another folder</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setMovingFileId(null)
                      setTargetFolderId('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Select value={targetFolderId}
                  onValueChange={(value) => {
                    if (value !== null) setTargetFolderId(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose destination folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleFolders
                      .filter((f) => f.id !== selectedFolder)
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMovingFileId(null)
                      setTargetFolderId('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleMoveFile}
                    disabled={!targetFolderId}
                    className="gap-1"
                  >
                    <Move className="w-3.5 h-3.5" />
                    Move
                  </Button>
                </div>
              </div>
            )}

            {!selectedFolder ? (
              <div className="text-center py-16 text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium">Select a folder</p>
                <p className="text-sm mt-1">Choose a folder on the left to view its files</p>
              </div>
            ) : folderFiles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium">No files in this folder</p>
                <p className="text-sm mt-1">Upload documents using the button above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderFiles.map((file) => {
                  const isCreator = file.uploaded_by === user?.id

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.mime_type, file.name)}
                        <div className="flex-1 min-w-0">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left justify-start"
                            onClick={() => void openEFile(file)}
                          >
                            <span className="truncate max-w-[280px] sm:max-w-md">
                              {file.name}
                            </span>
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {file.size_bytes
                              ? `${(file.size_bytes / 1024).toFixed(1)} KB`
                              : 'Unknown size'}
                            {' • '}
                            Uploaded by {users.find(u => u.id === file.uploaded_by)?.full_name || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Download"
                          onClick={() => void openEFile(file, true)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Move to another folder"
                          onClick={() => {
                            setMovingFileId(file.id)
                            setTargetFolderId('')
                          }}
                        >
                          <Move className="w-4 h-4" />
                        </Button>

                        {isCreator && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete (creator only)"
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-destructive"
                            disabled={isUploading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
