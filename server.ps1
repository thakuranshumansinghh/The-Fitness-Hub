$port = 8085
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }
$cache = @{}

# Set up HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Output "HTTP server started successfully."
    Write-Output "Listening on http://localhost:$port/"
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

# Serve files loop
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        
        # ----------------------------------------------------
        # REST API ENDPOINTS
        # ----------------------------------------------------
        
        # 1. API: Load or Save website content (texts + gallery images)
        if ($path -eq "/api/content") {
            $contentFile = Join-Path $root "data.json"
            if ($request.HttpMethod -eq "GET") {
                if (-not (Test-Path $contentFile)) {
                    # Create default content if missing
                    $defaultData = '{"heroTitle1":"FORGE YOUR LEGACY.","heroSubtitle1":"Premium equipment. Elite trainers. The ultimate fitness experience in Kurla, Mumbai.","heroTitle2":"BUILT ON RAW POWER.","heroSubtitle2":"Precision machinery and specialized platforms for max effort strength training.","heroTitle3":"JOIN THE FITNESS HUB.","heroSubtitle3":"Unleash your potential today. Book a session with our championship-grade coaching team.","aboutSubtitle":"We don\u0027t build gym memberships. We forge relentless athletic capability and physical fortitude.","aboutStory1":"Founded in Kurla, Mumbai, THE FITNESS HUB was established to bridge the gap between commercialized fitness franchises and hardcore strength athletics. We set out to create a sanctuary where physical potential is realized through raw science, top-tier infrastructure, and unyielding discipline.","aboutStory2":"Every bar, platform, and program at the Hub is curated for serious results. We offer a high-intensity, zero-compromise environment designed to push you past your boundaries.","galleryImages":[]}'
                    [System.IO.File]::WriteAllText($contentFile, $defaultData)
                }
                $bytes = [System.IO.File]::ReadAllBytes($contentFile)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($contentFile, $body)
                
                $response.StatusCode = 200
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            $response.Close()
            continue
        }
        
        # 2. API: Load bookings or Submit new booking
        elseif ($path -eq "/api/bookings") {
            $bookingsFile = Join-Path $root "bookings.json"
            if ($request.HttpMethod -eq "GET") {
                if (-not (Test-Path $bookingsFile)) {
                    [System.IO.File]::WriteAllText($bookingsFile, "[]")
                }
                $bytes = [System.IO.File]::ReadAllBytes($bookingsFile)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                
                $bookings = @()
                if (Test-Path $bookingsFile) {
                    $raw = Get-Content $bookingsFile -Raw
                    if ($raw -and $raw.Trim() -ne "") {
                        $bookings = @(ConvertFrom-Json $raw)
                    }
                }
                $newBooking = ConvertFrom-Json $body
                $bookings += $newBooking
                $bookingsJson = ConvertTo-Json -InputObject $bookings -Depth 5
                [System.IO.File]::WriteAllText($bookingsFile, $bookingsJson)
                
                $response.StatusCode = 200
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            $response.Close()
            continue
        }
        
        # 3. API: Delete individual booking entry
        elseif ($path -eq "/api/delete-booking") {
            $bookingsFile = Join-Path $root "bookings.json"
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                $reqData = ConvertFrom-Json $body
                $bookingId = $reqData.id
                
                if (Test-Path $bookingsFile) {
                    $raw = Get-Content $bookingsFile -Raw
                    if ($raw -and $raw.Trim() -ne "") {
                        $bookings = @(ConvertFrom-Json $raw)
                        $filtered = @()
                        foreach ($b in $bookings) {
                            if ($b.id -ne $bookingId) {
                                $filtered += $b
                            }
                        }
                        $bookingsJson = ConvertTo-Json -InputObject $filtered -Depth 5
                        [System.IO.File]::WriteAllText($bookingsFile, $bookingsJson)
                    }
                }
                
                $response.StatusCode = 200
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            $response.Close()
            continue
        }
        
        # 4. API: Clear all bookings
        elseif ($path -eq "/api/clear-bookings") {
            $bookingsFile = Join-Path $root "bookings.json"
            if ($request.HttpMethod -eq "POST") {
                [System.IO.File]::WriteAllText($bookingsFile, "[]")
                $response.StatusCode = 200
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            $response.Close()
            continue
        }
        
        # 5. API: Load or Save admin users list
        elseif ($path -eq "/api/admin-users") {
            $usersFile = Join-Path $root "admin-users.json"
            if ($request.HttpMethod -eq "GET") {
                if (-not (Test-Path $usersFile)) {
                    $defaultUsers = '[{"username":"The Fitness HUB","password":"thefitnesshub@25"}]'
                    [System.IO.File]::WriteAllText($usersFile, $defaultUsers)
                }
                $bytes = [System.IO.File]::ReadAllBytes($usersFile)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($usersFile, $body)
                
                $response.StatusCode = 200
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success"}')
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            $response.Close()
            continue
        }
        
        # ----------------------------------------------------
        # STATIC FILES SERVING
        # ----------------------------------------------------
        if ($path -eq "/") { $path = "/index.html" }
        
        # Prevent path traversal outside the root
        $normalizedPath = $path.Replace("\", "/").TrimStart('/')
        $localPath = [System.IO.Path]::GetFullPath((Join-Path $root $normalizedPath))
        
        if (-not $localPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path $localPath -PathType Leaf) {
            if ($cache.ContainsKey($localPath)) {
                $cacheEntry = $cache[$localPath]
                $bytes = $cacheEntry.bytes
                $contentType = $cacheEntry.contentType
            } else {
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                
                # Identify MIME type
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $contentType = "application/octet-stream"
                if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
                elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
                elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
                elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
                elseif ($ext -eq ".png") { $contentType = "image/png" }
                elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
                
                # Cache static files under 2MB in memory
                if ($bytes.Length -lt 2MB) {
                    $cache[$localPath] = [PSCustomObject]@{
                        bytes = $bytes
                        contentType = $contentType
                    }
                }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        Write-Host "Request handling error: $_"
    }
}
