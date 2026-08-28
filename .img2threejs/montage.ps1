param(
  [string]$OutFile,
  [string[]]$Files,
  [int]$Cols = 4,
  [int]$CellW = 470
)
Add-Type -AssemblyName System.Drawing
$imgs = @()
foreach ($f in $Files) {
  if (Test-Path $f) { $imgs += [System.Drawing.Image]::FromFile((Resolve-Path $f)) }
}
if ($imgs.Count -eq 0) { Write-Error 'no images'; exit 1 }
$ratio = $imgs[0].Height / $imgs[0].Width
$cellH = [int]($CellW * $ratio)
$rows = [Math]::Ceiling($imgs.Count / $Cols)
$pad = 6
$labelH = 26
$W = $Cols * ($CellW + $pad) + $pad
$H = $rows * ($cellH + $labelH + $pad) + $pad
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(18, 18, 20))
$font = New-Object System.Drawing.Font('Consolas', 12)
$brush = [System.Drawing.Brushes]::White
for ($i = 0; $i -lt $imgs.Count; $i++) {
  $r = [Math]::Floor($i / $Cols)
  $c = $i % $Cols
  $x = $pad + $c * ($CellW + $pad)
  $y = $pad + $r * ($cellH + $labelH + $pad)
  $g.DrawImage($imgs[$i], $x, $y, $CellW, $cellH)
  $name = [System.IO.Path]::GetFileNameWithoutExtension($Files[$i])
  $g.DrawString($name, $font, $brush, $x, $y + $cellH + 3)
}
$g.Dispose()
$bmp.Save((Join-Path (Get-Location) $OutFile), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
$imgs | ForEach-Object { $_.Dispose() }
Write-Output "saved $OutFile"
