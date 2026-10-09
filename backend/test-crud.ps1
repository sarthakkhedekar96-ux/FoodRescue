# FoodRescue Full CRUD & MongoDB Persistence Test Script
# Usage: .\test-crud.ps1 (while Spring Boot backend is running on http://localhost:8080)

$baseUrl = "http://localhost:8080/api"
$results = @()

function Test-Endpoint($entityName, $step, $scriptBlock) {
    Write-Host -NoNewline "Testing $entityName [$step]... "
    try {
        $result = & $scriptBlock
        Write-Host -ForegroundColor Green "PASS"
        return [PSCustomObject]@{ Entity = $entityName; Operation = $step; Status = "PASS"; Details = "OK" }
    } catch {
        Write-Host -ForegroundColor Red "FAIL ($($_.Exception.Message))"
        return [PSCustomObject]@{ Entity = $entityName; Operation = $step; Status = "FAIL"; Details = $_.Exception.Message }
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FoodRescue MongoDB Atlas Full CRUD Verification Suite   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Health Check
$health = Invoke-RestMethod -Uri "http://localhost:8080/health/db" -Method Get
Write-Host "Database Health: $($health.status) | Database: $($health.database)" -ForegroundColor Yellow

# 1. USER CRUD
$testUserId = "test-user-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "User" "CREATE (POST)" {
    $body = @{ id = $testUserId; name = "Audit Test User"; email = "$testUserId@audit.com"; phone = "+91 9999900000"; role = "DONOR" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "User" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Get
}
$results += Test-Endpoint "User" "UPDATE (PUT)" {
    $body = @{ name = "Audit Test User Updated"; email = "$testUserId@audit.com"; phone = "+91 9999911111"; role = "DONOR" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "User" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Delete
}

# 2. NGO CRUD
$testNgoId = "test-ngo-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "Ngo" "CREATE (POST)" {
    $body = @{ id = $testNgoId; userId = $testUserId; name = "Audit Test NGO"; regNumber = "REG-999"; contactPerson = "Audit Contact"; phone = "+91 9999922222"; address = "Pune"; location = @{ type = "Point"; coordinates = @(73.85, 18.52) }; acceptedFoodTypes = @("COOKED_FOOD") } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/ngos" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Ngo" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/ngos/$testNgoId" -Method Get
}
$results += Test-Endpoint "Ngo" "UPDATE (PUT)" {
    $body = @{ id = $testNgoId; userId = $testUserId; name = "Audit Test NGO Updated"; regNumber = "REG-999-REV"; contactPerson = "Audit Contact"; phone = "+91 9999933333"; address = "Pune Central"; location = @{ type = "Point"; coordinates = @(73.85, 18.52) }; acceptedFoodTypes = @("COOKED_FOOD", "BAKERY") } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/ngos/$testNgoId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Ngo" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/ngos/$testNgoId" -Method Delete
}

# 3. VOLUNTEER CRUD
$testVolId = "test-vol-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "Volunteer" "CREATE (POST)" {
    $body = @{ id = $testVolId; userId = $testUserId; name = "Audit Test Volunteer"; phone = "+91 9999944444"; vehicleType = "BIKE"; location = @{ type = "Point"; coordinates = @(73.86, 18.53) }; availability = "AVAILABLE"; completedPickups = 0 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/volunteers" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Volunteer" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/volunteers/$testVolId" -Method Get
}
$results += Test-Endpoint "Volunteer" "UPDATE (PUT)" {
    $body = @{ id = $testVolId; userId = $testUserId; name = "Audit Test Volunteer Updated"; phone = "+91 9999955555"; vehicleType = "VAN"; location = @{ type = "Point"; coordinates = @(73.86, 18.53) }; availability = "BUSY"; completedPickups = 1 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/volunteers/$testVolId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Volunteer" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/volunteers/$testVolId" -Method Delete
}

# 4. DONATION CRUD
$testDonId = "test-don-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "Donation" "CREATE (POST)" {
    $body = @{ id = $testDonId; donorId = "U101"; category = "COOKED_FOOD"; foodItems = @(@{ name = "Audit Item"; quantity = 10; unit = "KG" }); address = "Audit Address"; location = @{ type = "Point"; coordinates = @(73.8567, 18.5204) }; preparedAt = (Get-Date).ToUniversalTime().ToString("o"); expiryAt = (Get-Date).AddHours(4).ToUniversalTime().ToString("o"); status = "AVAILABLE" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/donations" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Donation" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/donations/$testDonId" -Method Get
}
$results += Test-Endpoint "Donation" "UPDATE (PUT)" {
    $body = @{ id = $testDonId; donorId = "U101"; category = "COOKED_FOOD"; foodItems = @(@{ name = "Audit Item Updated"; quantity = 15; unit = "KG" }); address = "Audit Address Updated"; location = @{ type = "Point"; coordinates = @(73.8567, 18.5204) }; preparedAt = (Get-Date).ToUniversalTime().ToString("o"); expiryAt = (Get-Date).AddHours(3).ToUniversalTime().ToString("o"); status = "AVAILABLE" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/donations/$testDonId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Donation" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/donations/$testDonId" -Method Delete
}

# 5. PICKUP CRUD
$testPickId = "test-pick-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "Pickup" "CREATE (POST)" {
    $body = @{ id = $testPickId; donationId = "D1001"; ngoId = "N201"; volunteerId = "V301"; status = "ASSIGNED" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/pickups" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Pickup" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/pickups/$testPickId" -Method Get
}
$results += Test-Endpoint "Pickup" "UPDATE (PUT)" {
    $body = @{ id = $testPickId; donationId = "D1001"; ngoId = "N201"; volunteerId = "V301"; status = "DELIVERED" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/pickups/$testPickId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Pickup" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/pickups/$testPickId" -Method Delete
}

# 6. FEEDBACK CRUD
$testFbId = "test-fb-" + [Guid]::NewGuid().ToString().Substring(0, 8)
$results += Test-Endpoint "Feedback" "CREATE (POST)" {
    $body = @{ id = $testFbId; donationId = $testDonId; fromUserId = $testUserId; rating = 5; comment = "Audit verification rating" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/feedback" -Method Post -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Feedback" "READ (GET)" {
    Invoke-RestMethod -Uri "$baseUrl/feedback/$testFbId" -Method Get
}
$results += Test-Endpoint "Feedback" "UPDATE (PUT)" {
    $body = @{ id = $testFbId; donationId = $testDonId; fromUserId = $testUserId; rating = 4; comment = "Updated audit feedback" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/feedback/$testFbId" -Method Put -ContentType "application/json" -Body $body
}
$results += Test-Endpoint "Feedback" "DELETE (DELETE)" {
    Invoke-RestMethod -Uri "$baseUrl/feedback/$testFbId" -Method Delete
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "                Summary of CRUD Tests                    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize
