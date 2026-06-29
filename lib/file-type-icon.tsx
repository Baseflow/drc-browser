// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react"
import type { LucideProps } from "lucide-react"

const EXT_MAP: Record<string, { icon: React.FC<LucideProps>; className: string }> = {
  // Documents
  pdf: { icon: FileText, className: "text-red-500" },
  doc: { icon: FileText, className: "text-blue-600" },
  docx: { icon: FileText, className: "text-blue-600" },
  odt: { icon: FileText, className: "text-blue-500" },
  rtf: { icon: FileText, className: "text-blue-400" },
  txt: { icon: FileText, className: "text-muted-foreground" },
  // Spreadsheets
  xls: { icon: FileSpreadsheet, className: "text-green-600" },
  xlsx: { icon: FileSpreadsheet, className: "text-green-600" },
  ods: { icon: FileSpreadsheet, className: "text-green-500" },
  csv: { icon: FileSpreadsheet, className: "text-green-400" },
  // Presentations
  ppt: { icon: FileText, className: "text-orange-500" },
  pptx: { icon: FileText, className: "text-orange-500" },
  odp: { icon: FileText, className: "text-orange-400" },
  // Images
  png: { icon: FileImage, className: "text-purple-500" },
  jpg: { icon: FileImage, className: "text-purple-500" },
  jpeg: { icon: FileImage, className: "text-purple-500" },
  gif: { icon: FileImage, className: "text-purple-400" },
  webp: { icon: FileImage, className: "text-purple-400" },
  svg: { icon: FileImage, className: "text-purple-600" },
  bmp: { icon: FileImage, className: "text-purple-300" },
  tiff: { icon: FileImage, className: "text-purple-300" },
  // Video
  mp4: { icon: FileVideo, className: "text-pink-500" },
  mov: { icon: FileVideo, className: "text-pink-500" },
  avi: { icon: FileVideo, className: "text-pink-400" },
  mkv: { icon: FileVideo, className: "text-pink-400" },
  // Audio
  mp3: { icon: FileAudio, className: "text-yellow-500" },
  wav: { icon: FileAudio, className: "text-yellow-400" },
  ogg: { icon: FileAudio, className: "text-yellow-400" },
  // Archives
  zip: { icon: FileArchive, className: "text-amber-500" },
  tar: { icon: FileArchive, className: "text-amber-500" },
  gz: { icon: FileArchive, className: "text-amber-400" },
  "7z": { icon: FileArchive, className: "text-amber-400" },
  // Code
  json: { icon: FileCode, className: "text-cyan-500" },
  xml: { icon: FileCode, className: "text-cyan-500" },
  html: { icon: FileCode, className: "text-cyan-400" },
}

export function FileTypeIcon({
  filename,
  className: extraClass,
  ...props
}: { filename: string; className?: string } & Omit<LucideProps, "className">) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const match = EXT_MAP[ext]
  const Icon = match?.icon ?? File
  const colorClass = match?.className ?? "text-muted-foreground"

  return <Icon className={`${colorClass} ${extraClass ?? ""}`.trim()} {...props} />
}
