$root = "C:\Users\HP\Downloads\laravel\hosting\adopsi\adopsi\frontend\src"
Get-ChildItem -Path $root -Recurse -Include *.jsx,*.js,*.tsx | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    $new = $content -replace 'fa-angle-double-left','fa-bars' -replace 'fa-angle-double-right','fa-bars'
    if ($new -ne $content) {
        Set-Content -Path $path -Value $new -Encoding UTF8
    }
}
