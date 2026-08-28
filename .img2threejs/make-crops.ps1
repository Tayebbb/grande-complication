$img = "public/reference/reference-watch.png"
$crops = @(
  @{id="mat-case-polished";  l=2726; t=2152; w=307; h=646},
  @{id="mat-case-brushed";   l=2995; t=1862; w=192; h=215},
  @{id="mat-dial-plate";     l=1536; t=2368; w=269; h=323},
  @{id="mat-hands-polished"; l=2285; t=1587; w=192; h=215},
  @{id="mat-chrono-frosted"; l=1901; t=2986; w=115; h=323},
  @{id="mat-moonphase";      l=1766; t=2852; w=326; h=296},
  @{id="mat-strap";          l=1613; t=3874; w=614; h=538},
  @{id="mat-stitch";         l=1286; t=3874; w=134; h=430},
  @{id="mat-aperture-disc";  l=1594; t=1749; w=269; h=188}
)
New-Item -ItemType Directory -Force -Path ".img2threejs/material-crops" | Out-Null
foreach ($c in $crops) {
  $out = ".img2threejs/material-crops/$($c.id).png"
  npx --yes sharp-cli extract $($c.t) $($c.l) $($c.w) $($c.h) --input $img --output $out
}
Get-ChildItem .img2threejs/material-crops
