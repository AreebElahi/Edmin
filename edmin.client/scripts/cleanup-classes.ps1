<#
.SYNOPSIS
  M365 Fluent UI v9 – Repository-wide CSS class cleanup (v2 – PS2+ compatible)
#>

$rootPath = "d:\Edmin\edmin.client\app\dashboard"

$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx","*.ts"

$replacements = [ordered]@{
    'rounded-3xl'       = 'rounded-[2px]'
    'rounded-2xl'       = 'rounded-[2px]'
    'rounded-xl'        = 'rounded-[2px]'
    'rounded-lg'        = 'rounded-[2px]'
    'rounded-md'        = 'rounded-[2px]'
    'rounded-full'      = 'rounded-[2px]'
    'shadow-2xl'        = 'shadow-none'
    'shadow-xl'         = 'shadow-none'
    'shadow-lg'         = 'shadow-none'
    'shadow-md'         = 'shadow-none'
    'shadow-sm'         = 'shadow-none'
    'bg-emerald-50'     = 'bg-[#F3F2F1]'
    'bg-amber-50'       = 'bg-[#FFF4CE]'
    'bg-rose-50'        = 'bg-[#FDE7E9]'
    'bg-violet-50'      = 'bg-[#F3F2F1]'
    'bg-purple-50'      = 'bg-[#F3F2F1]'
    'bg-teal-50'        = 'bg-[#F3F2F1]'
    'bg-sky-50'         = 'bg-[#EFF6FC]'
    'bg-indigo-50'      = 'bg-[#EFF6FC]'
    'bg-blue-50'        = 'bg-[#EFF6FC]'
    'bg-blue-100'       = 'bg-[#DEECF9]'
    'bg-slate-100'      = 'bg-[#F3F2F1]'
    'bg-gray-50'        = 'bg-[#F3F2F1]'
    'bg-gray-100'       = 'bg-[#F3F2F1]'
    'bg-gray-200'       = 'bg-[#EDEBE9]'
    'text-emerald-600'  = 'text-[#107C10]'
    'text-emerald-700'  = 'text-[#107C10]'
    'text-amber-600'    = 'text-[#835B00]'
    'text-amber-700'    = 'text-[#835B00]'
    'text-rose-600'     = 'text-[#A4262C]'
    'text-rose-700'     = 'text-[#A4262C]'
    'text-violet-600'   = 'text-[#0078D4]'
    'text-purple-600'   = 'text-[#0078D4]'
    'text-teal-600'     = 'text-[#0078D4]'
    'text-sky-600'      = 'text-[#0078D4]'
    'text-sky-700'      = 'text-[#0078D4]'
    'text-indigo-600'   = 'text-[#0078D4]'
    'text-indigo-700'   = 'text-[#0078D4]'
    'text-blue-600'     = 'text-[#0078D4]'
    'text-blue-700'     = 'text-[#0078D4]'
    'text-slate-600'    = 'text-[#605E5C]'
    'text-slate-700'    = 'text-[#323130]'
    'text-slate-800'    = 'text-[#11100F]'
    'text-gray-500'     = 'text-[#A19F9D]'
    'text-gray-600'     = 'text-[#605E5C]'
    'text-gray-700'     = 'text-[#323130]'
    'text-gray-800'     = 'text-[#11100F]'
    'text-gray-900'     = 'text-[#11100F]'
    'text-zinc-500'     = 'text-[#A19F9D]'
    'border-gray-100'   = 'border-[#EDEBE9]'
    'border-gray-200'   = 'border-[#EDEBE9]'
    'border-slate-100'  = 'border-[#EDEBE9]'
    'border-slate-200'  = 'border-[#EDEBE9]'
    'font-black'        = 'font-semibold'
    'font-extrabold'    = 'font-semibold'
    'active:scale-95'   = ''
    'active:scale-90'   = ''
}

$totalFiles = 0

foreach ($file in $files) {
    $lines = Get-Content -Path $file.FullName -Encoding UTF8
    if ($null -eq $lines) { continue }

    $joined = $lines -join "`n"
    $original = $joined

    foreach ($find in $replacements.Keys) {
        $replace = $replacements[$find]
        $joined = $joined -replace [regex]::Escape($find), $replace
    }

    if ($joined -ne $original) {
        $joined | Set-Content -Path $file.FullName -Encoding UTF8
        $totalFiles++
        Write-Host "  Updated: $($file.Name)"
    }
}

Write-Host ""
Write-Host "Done. Updated $totalFiles files."
