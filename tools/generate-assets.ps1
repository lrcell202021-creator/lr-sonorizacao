# Gera os assets de marca (favicon, icones e imagem social) a partir das cores
# oficiais da LR Sonorizacao. Rode de novo se as cores ou o texto mudarem:
#
#   powershell -ExecutionPolicy Bypass -File tools\generate-assets.ps1
#
# Os acentos sao montados por codigo de caractere para o script funcionar
# independente da codificacao com que o arquivo for salvo.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
New-Item -ItemType Directory -Path $assets -Force | Out-Null

# Paleta identica a de style.css
$gold = [System.Drawing.ColorTranslator]::FromHtml("#D98A16")
$goldLight = [System.Drawing.ColorTranslator]::FromHtml("#E8A33D")
$black = [System.Drawing.ColorTranslator]::FromHtml("#171717")
$line = [System.Drawing.ColorTranslator]::FromHtml("#B8B8B8")
$white = [System.Drawing.Color]::White

$cCedilla = [char]0x00C7
$aTilde = [char]0x00C3
$aGrave = [char]0x00C0

$brandName = "LR SONORIZA" + $cCedilla + $aTilde + "O"
$tagline = "SEU EVENTO  " + [char]0x2022 + "  SEU SOM  " + [char]0x2022 + "  SEU RESULTADO"
$kicker = "SONORIZA" + $cCedilla + $aTilde + "O PROFISSIONAL"
$headlineTop = "SEU EVENTO MERECE"
$headlineBottom = "UM SOM " + $aGrave + " ALTURA."
$region = "MOGI GUA" + $cCedilla + "U  " + [char]0x2022 + "  SP"

function New-HighQualityGraphics([System.Drawing.Bitmap] $bitmap) {
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  return $g
}

# Proporcao do logotipo, igual ao viewBox de assets/logo-lr.svg.
$LOGO_W = 788.0
$LOGO_H = 417.0

# Le os paths de assets/logo-lr.svg. O SVG e a unica fonte da geometria: ele e
# gerado por tools/build-logo-svg.js e usa apenas os comandos M, L, C e Z.
function Get-LogoPaths([string] $svgPath) {
  $svg = Get-Content -Path $svgPath -Raw
  $matches = [regex]::Matches($svg, '<path\s+fill="(?<fill>#[0-9A-Fa-f]{6})"\s+d="(?<d>[^"]+)"')
  if ($matches.Count -eq 0) { throw "nenhum path encontrado em $svgPath" }
  return $matches | ForEach-Object {
    [pscustomobject]@{ Fill = $_.Groups["fill"].Value.ToUpper(); D = $_.Groups["d"].Value }
  }
}

# Converte um path SVG (M/L/C/Z) em GraphicsPath, aplicando escala e offset.
function ConvertTo-GraphicsPath([string] $d, [double] $sc, [double] $offX, [double] $offY) {
  $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $tokens = [regex]::Matches($d, '([MLCZ])|(-?[0-9]*\.?[0-9]+)')
  $nums = New-Object System.Collections.Generic.List[double]
  $cmds = New-Object System.Collections.Generic.List[object]
  foreach ($m in $tokens) {
    if ($m.Groups[1].Success) {
      $cmds.Add([pscustomobject]@{ Cmd = $m.Groups[1].Value; At = $nums.Count })
    } else {
      $nums.Add([double]::Parse($m.Groups[2].Value, [System.Globalization.CultureInfo]::InvariantCulture))
    }
  }
  $pt = { param($i)
    New-Object System.Drawing.PointF(
      [float]($nums[$i] * $sc + $offX),
      [float]($nums[$i + 1] * $sc + $offY))
  }
  $cur = $null; $startPt = $null
  for ($c = 0; $c -lt $cmds.Count; $c++) {
    $cmd = $cmds[$c].Cmd
    $i = $cmds[$c].At
    $end = if ($c + 1 -lt $cmds.Count) { $cmds[$c + 1].At } else { $nums.Count }
    switch ($cmd) {
      "M" {
        $cur = & $pt $i; $startPt = $cur
        for ($k = $i + 2; $k -lt $end; $k += 2) {
          $next = & $pt $k; $gp.AddLine($cur, $next); $cur = $next
        }
      }
      "L" {
        for ($k = $i; $k -lt $end; $k += 2) {
          $next = & $pt $k; $gp.AddLine($cur, $next); $cur = $next
        }
      }
      "C" {
        for ($k = $i; $k -lt $end; $k += 6) {
          $c1 = & $pt $k; $c2 = & $pt ($k + 2); $next = & $pt ($k + 4)
          $gp.AddBezier($cur, $c1, $c2, $next); $cur = $next
        }
      }
      "Z" {
        if ($startPt -ne $null -and $cur -ne $null) { $gp.CloseFigure() }
      }
    }
  }
  return $gp
}

# Desenha o logotipo na largura pedida, trocando as cores: o que e escuro no
# SVG vira $letterColor e o waveform dourado vira $waveColor.
function Draw-Logo(
  [System.Drawing.Graphics] $g,
  [float] $offX, [float] $offY, [float] $drawW,
  [System.Drawing.Color] $letterColor,
  [System.Drawing.Color] $waveColor
) {
  $sc = $drawW / $LOGO_W
  $letterBrush = New-Object System.Drawing.SolidBrush($letterColor)
  $waveBrush = New-Object System.Drawing.SolidBrush($waveColor)
  foreach ($p in $script:LogoPaths) {
    $brush = if ($p.Fill -eq "#D98A16") { $waveBrush } else { $letterBrush }
    $gp = ConvertTo-GraphicsPath $p.D $sc $offX $offY
    $g.FillPath($brush, $gp)
    $gp.Dispose()
  }
  $waveBrush.Dispose()
  $letterBrush.Dispose()
}

$script:LogoPaths = Get-LogoPaths (Join-Path $assets "logo-lr.svg")

# Icone quadrado: fundo escuro com o logotipo claro, como o logotipo original.
function New-BrandIcon([int] $size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = New-HighQualityGraphics $bmp
  $g.Clear($black)

  $pad = [math]::Round($size * 0.0625)
  $drawW = $size - ($pad * 2)
  $drawH = $drawW * $LOGO_H / $LOGO_W
  Draw-Logo $g ([float]$pad) ([float](($size - $drawH) / 2.0)) ([float]$drawW) $white $gold

  $g.Dispose()
  return $bmp
}

function Save-Png([System.Drawing.Bitmap] $bitmap, [string] $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "gerado: $path"
}

# ICO com um unico PNG de 32x32 embutido (suportado por todos os navegadores atuais).
function Save-Ico([System.Drawing.Bitmap] $bitmap, [string] $path) {
  $ms = New-Object System.IO.MemoryStream
  $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $png = $ms.ToArray()
  $ms.Dispose()

  $fs = [System.IO.File]::Create($path)
  $writer = New-Object System.IO.BinaryWriter($fs)
  try {
    $writer.Write([uint16]0)               # reservado
    $writer.Write([uint16]1)               # tipo: icone
    $writer.Write([uint16]1)               # quantidade de imagens
    $writer.Write([byte]$bitmap.Width)
    $writer.Write([byte]$bitmap.Height)
    $writer.Write([byte]0)                 # paleta
    $writer.Write([byte]0)                 # reservado
    $writer.Write([uint16]1)               # planos
    $writer.Write([uint16]32)              # bits por pixel
    $writer.Write([uint32]$png.Length)
    $writer.Write([uint32]22)              # offset dos dados
    $writer.Write($png)
  } finally {
    $writer.Dispose()
    $fs.Dispose()
  }
  Write-Host "gerado: $path"
}

function Save-Jpeg([System.Drawing.Bitmap] $bitmap, [string] $path, [int] $quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)
  $bitmap.Save($path, $codec, $params)
  $params.Dispose()
  Write-Host "gerado: $path"
}

function Draw-Text([System.Drawing.Graphics] $g, [string] $text, [string] $family,
                   [float] $size, [System.Drawing.FontStyle] $style,
                   [System.Drawing.Color] $color, [float] $x, [float] $y) {
  $font = New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.DrawString($text, $font, $brush, $x, $y)
  $brush.Dispose()
  $font.Dispose()
}

# --- Favicon e icones de app ---
$icon32 = New-BrandIcon 32
Save-Ico $icon32 (Join-Path $assets "favicon.ico")
$icon32.Dispose()

foreach ($spec in @(
  @{ Size = 180; Name = "apple-touch-icon.png" },
  @{ Size = 192; Name = "icon-192.png" },
  @{ Size = 512; Name = "icon-512.png" }
)) {
  $bmp = New-BrandIcon $spec.Size
  Save-Png $bmp (Join-Path $assets $spec.Name)
  $bmp.Dispose()
}

# --- Imagem social (Open Graph / Twitter) ---
$ogWidth = 1200
$ogHeight = 630
$og = New-Object System.Drawing.Bitmap($ogWidth, $ogHeight)
$g = New-HighQualityGraphics $og
$g.Clear($black)

# Logotipo da marca, claro sobre o fundo escuro
$markX = 84
$markY = 92
$markW = 200
$markH = $markW * $LOGO_H / $LOGO_W
$goldBrush = New-Object System.Drawing.SolidBrush($gold)
Draw-Logo $g ([float]$markX) ([float]$markY) ([float]$markW) $white $gold

Draw-Text $g $brandName "Arial" 52 ([System.Drawing.FontStyle]::Bold) $white ($markX + $markW + 34) 96
Draw-Text $g $tagline "Arial" 20 ([System.Drawing.FontStyle]::Regular) $line ($markX + $markW + 38) 160

# Linha divisoria, no mesmo tom das bordas do site
$linePen = New-Object System.Drawing.Pen($line, 2)
$g.DrawLine($linePen, 84, 268, ($ogWidth - 84), 268)

Draw-Text $g $kicker "Arial" 26 ([System.Drawing.FontStyle]::Bold) $goldLight 84 316
Draw-Text $g $headlineTop "Arial" 62 ([System.Drawing.FontStyle]::Bold) $white 80 364
Draw-Text $g $headlineBottom "Arial" 62 ([System.Drawing.FontStyle]::Bold) $gold 80 434
Draw-Text $g $region "Arial" 22 ([System.Drawing.FontStyle]::Bold) $line 84 528

# Barra dourada no pe da imagem
$g.FillRectangle($goldBrush, 0, ($ogHeight - 16), $ogWidth, 16)

$linePen.Dispose()
$goldBrush.Dispose()
$g.Dispose()

Save-Jpeg $og (Join-Path $assets "og-image.jpg") 88
$og.Dispose()

Write-Host ""
Write-Host "Assets gerados em: $assets"
