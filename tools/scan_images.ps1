$imagesDir = (Get-Item -Path (Join-Path $PSScriptRoot "..\images")).FullName
$stateFile = (Get-Item -Path (Join-Path $PSScriptRoot "..\js\state.js")).FullName

if (-not (Test-Path $imagesDir)) {
    Write-Host "Erreur : Le dossier images est introuvable." -ForegroundColor Red
    exit
}

# Récupérer tous les fichiers et calculer le chemin relatif proprement
$files = Get-ChildItem -Path $imagesDir -Recurse -File | Where-Object { $_.Extension -match "\.(png|jpg|jpeg|gif|webp)$" } | ForEach-Object {
    $rel = $_.FullName.Substring($imagesDir.Length).TrimStart("\").TrimStart("/")
    $rel.Replace("\", "/")
} | Sort-Object

# Formater pour le JS
$listStr = "const imageGalleryList = [`n    " + (($files | ForEach-Object { "`"$_`"" }) -join ",`n    ") + "`n];"

# Lire et mettre à jour le fichier state.js avec .NET pour éviter les problèmes d'encodage/regex de PS
$content = [System.IO.File]::ReadAllText($stateFile)
$regex = [regex]::new("const imageGalleryList = \[[\s\S]*?\];")
$newContent = $regex.Replace($content, $listStr)

[System.IO.File]::WriteAllText($stateFile, $newContent)

Write-Host "Succès ! $($files.Count) images ont été indexées." -ForegroundColor Green
Write-Host "Chemins exemples : $($files[0..2] -join ', ')"
Pause
