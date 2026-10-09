# Seed baseline donations and pickups matching DataInitializer
$envFile = "..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$adminLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
    email = $env:ADMIN_EMAIL
    password = $env:ADMIN_PASSWORD
} | ConvertTo-Json)

$headers = @{ Authorization = "Bearer " + $adminLogin.token }

# 1. Clean any non-baseline users
$users = Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Headers $headers
$baselineUsers = @("U101", "U102", "U201", "U202", "U301", "U302", "U401")
foreach ($u in $users) {
    if ($baselineUsers -notcontains $u.id) {
        Invoke-RestMethod -Uri "http://localhost:8080/api/users/$($u.id)" -Method Delete -Headers $headers | Out-Null
    }
}

# 1b. Clean any non-baseline NGOs
$ngos = Invoke-RestMethod -Uri "http://localhost:8080/api/ngos" -Headers $headers
$baselineNgos = @("N201", "N202")
foreach ($n in $ngos) {
    if ($baselineNgos -notcontains $n.id) {
        Invoke-RestMethod -Uri "http://localhost:8080/api/ngos/$($n.id)" -Method Delete -Headers $headers | Out-Null
    }
}

# 1c. Clean any non-baseline Volunteers
$vols = Invoke-RestMethod -Uri "http://localhost:8080/api/volunteers" -Headers $headers
$baselineVols = @("V301", "V302")
foreach ($v in $vols) {
    if ($baselineVols -notcontains $v.id) {
        Invoke-RestMethod -Uri "http://localhost:8080/api/volunteers/$($v.id)" -Method Delete -Headers $headers | Out-Null
    }
}

# 2. Check donations count
$donations = Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Headers $headers
Write-Host "Current donations count: $($donations.Count)"

# If donations count != 6, reset donations and pickups to exact baseline
if ($donations.Count -ne 6) {
    # Delete any lingering pickups first
    $pickups = Invoke-RestMethod -Uri "http://localhost:8080/api/pickups" -Headers $headers
    foreach ($p in $pickups) {
        Invoke-RestMethod -Uri "http://localhost:8080/api/pickups/$($p.id)" -Method Delete -Headers $headers | Out-Null
    }

    # Delete any lingering donations
    foreach ($d in $donations) {
        Invoke-RestMethod -Uri "http://localhost:8080/api/donations/$($d.id)" -Method Delete -Headers $headers | Out-Null
    }

    $d1 = @{
        donorId = "U101"
        foodItems = @(
            @{ name = "Veg Paneer Biryani"; quantity = 25.0; unit = "KG" },
            @{ name = "Butter Chapati"; quantity = 120.0; unit = "PCS" }
        )
        category = "COOKED_FOOD"
        preparedAt = (Get-Date).AddHours(-2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddHours(5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8567, 18.5204) }
        address = "Royal Palace Banquet, Swargate, Pune"
        status = "AVAILABLE"
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d1 | Out-Null

    $d2 = @{
        donorId = "U102"
        foodItems = @(
            @{ name = "Whole Wheat Bread Loaves"; quantity = 40.0; unit = "PACKETS" },
            @{ name = "Fruit Muffins"; quantity = 60.0; unit = "PCS" }
        )
        category = "BAKERY"
        preparedAt = (Get-Date).AddHours(-4).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddHours(2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8400, 18.5100) }
        address = "Green Leaf Bakery, Deccan Gymkhana, Pune"
        status = "AVAILABLE"
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d2 | Out-Null

    $d3 = @{
        donorId = "U101"
        foodItems = @(
            @{ name = "Dal Tadka & Steamed Rice"; quantity = 30.0; unit = "KG" }
        )
        category = "COOKED_FOOD"
        preparedAt = (Get-Date).AddHours(-5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddMinutes(45).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8600, 18.5300) }
        address = "Royal Palace Express, Camp, Pune"
        status = "AVAILABLE"
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d3 | Out-Null

    $d4 = @{
        donorId = "U101"
        foodItems = @(
            @{ name = "Mix Vegetable Curry"; quantity = 15.0; unit = "KG" },
            @{ name = "Jeera Rice"; quantity = 20.0; unit = "KG" }
        )
        category = "COOKED_FOOD"
        preparedAt = (Get-Date).AddHours(-3).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddHours(4).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8500, 18.5200) }
        address = "Royal Palace Kitchen, Shivajinagar, Pune"
        status = "ACCEPTED"
    } | ConvertTo-Json -Depth 5
    $resD4 = Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d4

    $d5 = @{
        donorId = "U102"
        foodItems = @(
            @{ name = "Assorted Sandwiches"; quantity = 50.0; unit = "PCS" },
            @{ name = "Apple Pies"; quantity = 30.0; unit = "PCS" }
        )
        category = "PACKAGED_FOOD"
        preparedAt = (Get-Date).AddHours(-10).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddHours(2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8200, 18.5050) }
        address = "Green Leaf Kothrud, Pune"
        status = "COMPLETED"
    } | ConvertTo-Json -Depth 5
    $resD5 = Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d5

    $d6 = @{
        donorId = "U101"
        foodItems = @(
            @{ name = "Green Salad & Dahi Vada"; quantity = 10.0; unit = "KG" }
        )
        category = "COOKED_FOOD"
        preparedAt = (Get-Date).AddHours(-12).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        expiryAt = (Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        location = @{ type = "Point"; coordinates = @(73.8700, 18.5400) }
        address = "Royal Palace Viman Nagar, Pune"
        status = "EXPIRED"
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Method Post -ContentType "application/json" -Headers $headers -Body $d6 | Out-Null

    # Re-seed pickups
    $p1 = @{
        donationId = $resD4.id
        ngoId = "N201"
        volunteerId = "V302"
        status = "ASSIGNED"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/pickups" -Method Post -ContentType "application/json" -Headers $headers -Body $p1 | Out-Null

    $p2 = @{
        donationId = $resD5.id
        ngoId = "N202"
        volunteerId = "V301"
        status = "DELIVERED"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/pickups" -Method Post -ContentType "application/json" -Headers $headers -Body $p2 | Out-Null
}

$uFinal = (Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Headers $headers).Count
$dFinal = (Invoke-RestMethod -Uri "http://localhost:8080/api/donations" -Headers $headers).Count
$pFinal = (Invoke-RestMethod -Uri "http://localhost:8080/api/pickups" -Headers $headers).Count
$nFinal = (Invoke-RestMethod -Uri "http://localhost:8080/api/ngos" -Headers $headers).Count
$vFinal = (Invoke-RestMethod -Uri "http://localhost:8080/api/volunteers" -Headers $headers).Count

Write-Host "Restored Baseline: Users: $uFinal | Donations: $dFinal | Pickups: $pFinal | NGOs: $nFinal | Vols: $vFinal"
