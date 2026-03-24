export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function getFileIcon(type: string): { icon: string; color: string } {
  switch (type.toLowerCase()) {
    case "pdf":
      return { icon: "📄", color: "text-red-600" }
    case "xlsx":
    case "xls":
      return { icon: "📊", color: "text-green-600" }
    case "docx":
    case "doc":
      return { icon: "📝", color: "text-blue-600" }
    case "jpg":
    case "jpeg":
    case "png":
      return { icon: "🖼️", color: "text-yellow-600" }
    case "zip":
    case "rar":
      return { icon: "🗜️", color: "text-purple-600" }
    default:
      return { icon: "📎", color: "text-gray-600" }
  }
}

export function getFileColorClass(type: string): string {
  switch (type.toLowerCase()) {
    case "pdf":   return "bg-red-100 text-red-700 border-red-200"
    case "xlsx":
    case "xls":   return "bg-green-100 text-green-700 border-green-200"
    case "docx":
    case "doc":   return "bg-blue-100 text-blue-700 border-blue-200"
    case "jpg":
    case "jpeg":
    case "png":   return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "zip":
    case "rar":   return "bg-purple-100 text-purple-700 border-purple-200"
    default:      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}
