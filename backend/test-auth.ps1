# FoodRescue Authentication & RBAC Verification Suite
# Usage: .\test-auth.ps1 (requires running backend on http://localhost:8080)
# Note: Tokens and passwords are never printed or logged.

$baseUrl = "http://localhost:8080/api"
$healthUrl = "http://localhost:8080/health/db"

$adminEmail = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@foodrescue.org" }
$adminPassword = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "Admin@SecurePass2026!" }
$jwtSecret = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "FoodRescueSuperSecretKeyForJwtAuthentication2026_Minimum32Bytes!" }

$uniqueSuffix = [Guid]::NewGuid().ToString().Substring(0, 8)
$results = @()

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$Token = $null,
        [object]$Body = $null
    )
    $headers = @{}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    $bodyJson = $null
    if ($Body -ne $null) {
        if ($Body -is [string]) {
            $bodyJson = $Body
        } else {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
        }
    }

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $headers
        }
        if ($bodyJson -ne $null) {
            $params["Body"] = $bodyJson
            $params["ContentType"] = "application/json"
        }
        $resp = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $content = $resp.Content
        $jsonObj = $null
        try { $jsonObj = $content | ConvertFrom-Json } catch {}
        return [PSCustomObject]@{
            StatusCode = [int]$resp.StatusCode
            Content = $content
            Json = $jsonObj
            Success = $true
        }
    } catch {
        $ex = $_.Exception
        $statusCode = 0
        $content = ""
        if ($ex.Response) {
            $statusCode = [int]$ex.Response.StatusCode
            try {
                $reader = [System.IO.StreamReader]::new($ex.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Close()
            } catch {}
        }
        $jsonObj = $null
        try { $jsonObj = $content | ConvertFrom-Json } catch {}
        return [PSCustomObject]@{
            StatusCode = $statusCode
            Content = $content
            Json = $jsonObj
            Success = $false
        }
    }
}

function New-ExpiredJwt {
    param([string]$Secret)
    $headerJson = '{"alg":"HS256","typ":"JWT"}'
    $payloadJson = '{"sub":"U101","role":"DONOR","email":"donor@expired.com","exp":1000000000,"iat":900000000}'
    $headerB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($headerJson)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $payloadB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payloadJson)).TrimEnd('=').Replace('+','-').Replace('/','_')
    $toSign = "$headerB64.$payloadB64"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($Secret))
    $signatureBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($toSign))
    $sigB64 = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    return "$toSign.$sigB64"
}

function Report-Test {
    param(
        [string]$Category,
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    $status = if ($Condition) { "PASS" } else { "FAIL" }
    $color = if ($Condition) { "Green" } else { "Red" }
    Write-Host -NoNewline "[$Category] $Name... "
    Write-Host -ForegroundColor $color $status
    if (-not $Condition -and $Details) {
        Write-Host -ForegroundColor DarkRed "   -> $Details"
    }
    $script:results += [PSCustomObject]@{
        Category = $Category
        TestName = $Name
        Status = $status
        Details = $Details
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FoodRescue Security & RBAC Automated Test Suite         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Health check - only UP/DOWN, no database name leak
$health = Invoke-ApiRequest -Method "GET" -Uri $healthUrl
$healthUpNoDbName = ($health.StatusCode -eq 200 -and $health.Json.status -eq "UP" -and ($health.Content -notmatch "database"))
Report-Test "Health" "Public Health Endpoint (/health/db) Reports UP without Database Name" $healthUpNoDbName "Status: $($health.StatusCode), Body: $($health.Content)"

# 1. Admin Bootstrap Login
$adminLoginBody = @{ email = $adminEmail; password = $adminPassword }
$adminLoginResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body $adminLoginBody
$adminToken = $adminLoginResp.Json.token
$adminHasNoPw = ($adminLoginResp.Content -notmatch "passwordHash")
Report-Test "Bootstrap" "Admin Login via Environment Credentials" ($adminLoginResp.StatusCode -eq 200 -and $adminToken) "Status: $($adminLoginResp.StatusCode)"
Report-Test "Sanitization" "Admin Login Response Omits passwordHash" $adminHasNoPw "Content contains passwordHash"

if (-not $adminToken) {
    Write-Host "FATAL: Could not authenticate as Admin. Aborting suite." -ForegroundColor Red
    exit 1
}

# 2. Baseline Collection Counts (Queried by Admin)
$usersBefore = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/users" -Token $adminToken).Json.Count
$donationsBefore = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations" -Token $adminToken).Json.Count
$pickupsBefore = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/pickups" -Token $adminToken).Json.Count
$ngosBefore = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/ngos" -Token $adminToken).Json.Count
$volsBefore = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers" -Token $adminToken).Json.Count

Write-Host "Baseline Counts - Users: $usersBefore | Donations: $donationsBefore | Pickups: $pickupsBefore | NGOs: $ngosBefore | Vols: $volsBefore" -ForegroundColor Yellow

# 3. Registration Security - Prohibit ADMIN Role
$adminRegBody = @{
    name = "Malicious Admin"
    email = "fakeadmin_$uniqueSuffix@test.com"
    password = "SecretPassword123!"
    role = "ADMIN"
}
$adminRegResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body $adminRegBody
Report-Test "Registration" "Prohibit Registration with Role ADMIN" ($adminRegResp.StatusCode -eq 400) "Expected 400, got $($adminRegResp.StatusCode)"

# 4. Register Legitimate Entities (DONOR 1, DONOR 2, NGO 1, NGO 2, VOLUNTEER 1, VOLUNTEER 2)
$pw = "TestSecurePassword123!"

$donor1Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test Donor 1"
    email = "donor1_$uniqueSuffix@test.com"
    password = $pw
    role = "DONOR"
    phone = "+91 9111111111"
}
$donor1Token = $donor1Reg.Json.token
$donor1UserId = $donor1Reg.Json.user.id
Report-Test "Registration" "Register Donor 1 (DONOR)" ($donor1Reg.StatusCode -eq 201 -and $donor1Token) "Status: $($donor1Reg.StatusCode)"

$donor2Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test Donor 2"
    email = "donor2_$uniqueSuffix@test.com"
    password = $pw
    role = "DONOR"
    phone = "+91 9222222222"
}
$donor2Token = $donor2Reg.Json.token
$donor2UserId = $donor2Reg.Json.user.id
Report-Test "Registration" "Register Donor 2 (DONOR)" ($donor2Reg.StatusCode -eq 201 -and $donor2Token) "Status: $($donor2Reg.StatusCode)"

$ngo1Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test NGO Contact 1"
    email = "ngo1_$uniqueSuffix@test.com"
    password = $pw
    role = "NGO"
    phone = "+91 9333333333"
    organizationName = "Test Care NGO 1"
    registrationNumber = "REG-TEST-$uniqueSuffix-1"
    address = "Kothrud, Pune"
    latitude = 18.5074
    longitude = 73.8077
}
$ngo1Token = $ngo1Reg.Json.token
$ngo1UserId = $ngo1Reg.Json.user.id
$ngo1Id = $ngo1Reg.Json.user.ngoId
Report-Test "Registration" "Register NGO 1 (NGO with linked profile)" ($ngo1Reg.StatusCode -eq 201 -and $ngo1Id) "Status: $($ngo1Reg.StatusCode)"

$ngo2Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test NGO Contact 2"
    email = "ngo2_$uniqueSuffix@test.com"
    password = $pw
    role = "NGO"
    phone = "+91 9444444444"
    organizationName = "Test Care NGO 2"
    registrationNumber = "REG-TEST-$uniqueSuffix-2"
    address = "Viman Nagar, Pune"
    latitude = 18.5679
    longitude = 73.9143
}
$ngo2Token = $ngo2Reg.Json.token
$ngo2UserId = $ngo2Reg.Json.user.id
$ngo2Id = $ngo2Reg.Json.user.ngoId
Report-Test "Registration" "Register NGO 2 (NGO with linked profile)" ($ngo2Reg.StatusCode -eq 201 -and $ngo2Id) "Status: $($ngo2Reg.StatusCode)"

$vol1Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test Volunteer 1"
    email = "vol1_$uniqueSuffix@test.com"
    password = $pw
    role = "VOLUNTEER"
    phone = "+91 9555555555"
    vehicleType = "BIKE"
    latitude = 18.5204
    longitude = 73.8567
}
$vol1Token = $vol1Reg.Json.token
$vol1UserId = $vol1Reg.Json.user.id
$vol1Id = $vol1Reg.Json.user.volunteerId
Report-Test "Registration" "Register Volunteer 1 (VOLUNTEER with linked profile)" ($vol1Reg.StatusCode -eq 201 -and $vol1Id) "Status: $($vol1Reg.StatusCode)"

$vol2Reg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{
    name = "Test Volunteer 2"
    email = "vol2_$uniqueSuffix@test.com"
    password = $pw
    role = "VOLUNTEER"
    phone = "+91 9666666666"
    vehicleType = "VAN"
    latitude = 18.5304
    longitude = 73.8667
}
$vol2Token = $vol2Reg.Json.token
$vol2UserId = $vol2Reg.Json.user.id
$vol2Id = $vol2Reg.Json.user.volunteerId
Report-Test "Registration" "Register Volunteer 2 (VOLUNTEER with linked profile)" ($vol2Reg.StatusCode -eq 201 -and $vol2Id) "Status: $($vol2Reg.StatusCode)"

# Verify passwordHash omission across registrations
$allRegOmitPw = ($donor1Reg.Content -notmatch "passwordHash") -and ($ngo1Reg.Content -notmatch "passwordHash") -and ($vol1Reg.Content -notmatch "passwordHash")
Report-Test "Sanitization" "Registration Responses Omit passwordHash" $allRegOmitPw "passwordHash detected in registration payload"

# 5. Login as Each Role & Verify GET /api/auth/me
$donor1Me = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $donor1Token
Report-Test "Auth Context" "GET /api/auth/me for Donor 1" ($donor1Me.StatusCode -eq 200 -and $donor1Me.Json.role -eq "DONOR" -and $donor1Me.Json.email -eq "donor1_$uniqueSuffix@test.com") "Status: $($donor1Me.StatusCode)"

$ngo1Me = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $ngo1Token
Report-Test "Auth Context" "GET /api/auth/me for NGO 1 (resolves ngoId)" ($ngo1Me.StatusCode -eq 200 -and $ngo1Me.Json.role -eq "NGO" -and $ngo1Me.Json.ngoId -eq $ngo1Id) "Status: $($ngo1Me.StatusCode)"

$vol1Me = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $vol1Token
Report-Test "Auth Context" "GET /api/auth/me for Volunteer 1 (resolves volunteerId)" ($vol1Me.StatusCode -eq 200 -and $vol1Me.Json.role -eq "VOLUNTEER" -and $vol1Me.Json.volunteerId -eq $vol1Id) "Status: $($vol1Me.StatusCode)"

# 6. Authentication Security & Lockout
# 6a. Generic 401 error consistency
$badPwResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body @{ email = "donor1_$uniqueSuffix@test.com"; password = "WrongPassword999!" }
$badEmailResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body @{ email = "nonexistent_$uniqueSuffix@test.com"; password = "WrongPassword999!" }
$badPwMsg = $badPwResp.Json.message
$badEmailMsg = $badEmailResp.Json.message
$bothGeneric401 = ($badPwResp.StatusCode -eq 401) -and ($badEmailResp.StatusCode -eq 401) -and ($badPwMsg -eq "Invalid email or password") -and ($badEmailMsg -eq "Invalid email or password")
Report-Test "BruteForce/Enumeration" "Identical 401 Generic Error for Bad Password & Unknown Email" $bothGeneric401 "BadPw: $($badPwResp.StatusCode) '$badPwMsg' | BadEmail: $($badEmailResp.StatusCode) '$badEmailMsg'"

# 6b. Lockout & Enumeration: Compare Real Account vs Non-Existent Account
$lockoutEmail = "lockout_$uniqueSuffix@test.com"
$nonExistentEmail = "ghost_$uniqueSuffix@nonexistent.org"

# Register dummy user to test lockout on known account
$lockUserReg = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body @{ name = "Lock User"; email = $lockoutEmail; password = $pw; role = "DONOR" }
$lockUserId = $lockUserReg.Json.user.id

Write-Host "   --- Lockout & Timing: Real Email vs Non-Existent Email ---" -ForegroundColor DarkCyan

$realTimings = @()
$ghostTimings = @()
$realStatuses = @()
$ghostStatuses = @()
$realMessages = @()
$ghostMessages = @()

for ($i = 1; $i -le 6; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $rResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body @{ email = $lockoutEmail; password = "WrongPass_$i" }
    $sw.Stop()
    $realTimings += $sw.ElapsedMilliseconds
    $realStatuses += $rResp.StatusCode
    $realMessages += $rResp.Json.message

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $gResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body @{ email = $nonExistentEmail; password = "WrongPass_$i" }
    $sw.Stop()
    $ghostTimings += $sw.ElapsedMilliseconds
    $ghostStatuses += $gResp.StatusCode
    $ghostMessages += $gResp.Json.message
}

Write-Host "   [Raw Timing Output]" -ForegroundColor Yellow
for ($i = 0; $i -lt 6; $i++) {
    $att = $i + 1
    Write-Host "     Attempt #$att -> Real: $($realStatuses[$i]) ($($realTimings[$i])ms) '$($realMessages[$i])' | Ghost: $($ghostStatuses[$i]) ($($ghostTimings[$i])ms) '$($ghostMessages[$i])'" -ForegroundColor DarkGray
}

$lockoutMatched = ($realStatuses[0..4] -eq 401) -and ($realStatuses[5] -eq 429) -and `
                  ($ghostStatuses[0..4] -eq 401) -and ($ghostStatuses[5] -eq 429) -and `
                  ($realMessages[5] -eq "Invalid email or password") -and ($ghostMessages[5] -eq "Invalid email or password")

Report-Test "Rate Limiting/Anti-Enum" "Lockout Threshold, 429 Status, and Message Identical for Real and Non-Existent Email" $lockoutMatched "Real: $($realStatuses -join ',') | Ghost: $($ghostStatuses -join ',')"

# 6c. Token validation: Missing, Tampered, and Expired
$noTokenResp = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me"
Report-Test "Security" "Missing Token Rejection (401)" ($noTokenResp.StatusCode -eq 401) "Status: $($noTokenResp.StatusCode)"

$tamperedResp = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token "tampered.jwt.signature"
Report-Test "Security" "Tampered/Malformed Token Rejection (401)" ($tamperedResp.StatusCode -eq 401) "Status: $($tamperedResp.StatusCode)"

$expiredJwt = New-ExpiredJwt -Secret $jwtSecret
$expiredResp = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $expiredJwt
Report-Test "Security" "Expired Token Rejection (401)" ($expiredResp.StatusCode -eq 401) "Status: $($expiredResp.StatusCode)"

# 7. Mass Assignment & Role Escalation Defense
$escalationResp = Invoke-ApiRequest -Method "PUT" -Uri "$baseUrl/users/$donor1UserId" -Token $donor1Token -Body @{
    name = "Escalation Attempt"
    role = "ADMIN"
    passwordHash = "hacked_password_hash"
}
$donorAfterEscalation = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $donor1Token
$adminEndpointProbe = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/users" -Token $donor1Token
$escalationBlocked = ($donorAfterEscalation.Json.role -eq "DONOR") -and ($adminEndpointProbe.StatusCode -eq 403) -and ($escalationResp.Content -notmatch "passwordHash")
Report-Test "Mass Assignment" "Role Escalation & passwordHash Mass-Assignment Blocked on PUT /api/users/{id}" $escalationBlocked "Role: $($donorAfterEscalation.Json.role), AdminProbe: $($adminEndpointProbe.StatusCode)"

# 8. Role-Based Permissions & Invalid Action Rejection
# 8a. NGO creating a donation -> 403
$ngoCreateDon = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/donations" -Token $ngo1Token -Body @{
    foodCategory = "COOKED_MEALS"
    quantityKg = 10
    expiryHours = 4
    pickupAddress = "Pune"
}
Report-Test "RBAC Permissions" "NGO Prohibited from Creating Donation (403)" ($ngoCreateDon.StatusCode -eq 403) "Status: $($ngoCreateDon.StatusCode)"

# 8b. Donor creating a pickup -> 403
$donorCreatePick = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/pickups" -Token $donor1Token -Body @{
    donationId = "dummy-donation-id"
}
Report-Test "RBAC Permissions" "Donor Prohibited from Creating Pickup (403)" ($donorCreatePick.StatusCode -eq 403) "Status: $($donorCreatePick.StatusCode)"

# 8c. Legitimate Donation Creation by Donors
$don1Resp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/donations" -Token $donor1Token -Body @{
    foodCategory = "COOKED_MEALS"
    quantityKg = 15
    expiryHours = 6
    address = "Shivajinagar, Pune"
    pickupAddress = "Shivajinagar, Pune"
    latitude = 18.5308
    longitude = 73.8475
    dietaryType = "VEG"
    specialInstructions = "Fresh meals"
}
$don1Id = $don1Resp.Json.id
Report-Test "Donation" "Donor 1 Creates Donation 1" ($don1Resp.StatusCode -in @(200, 201) -and $don1Id) "Status: $($don1Resp.StatusCode)"

$don2Resp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/donations" -Token $donor2Token -Body @{
    foodCategory = "BAKERY"
    quantityKg = 25
    expiryHours = 12
    address = "Aundh, Pune"
    pickupAddress = "Aundh, Pune"
    latitude = 18.5580
    longitude = 73.8075
    dietaryType = "VEG"
    specialInstructions = "Breads"
}
$don2Id = $don2Resp.Json.id
Report-Test "Donation" "Donor 2 Creates Donation 2" ($don2Resp.StatusCode -in @(200, 201) -and $don2Id) "Status: $($don2Resp.StatusCode)"

# 8d. Donation Deletion Rule Matrix Verification
# Scenario i: Donor 1 creates a temporary AVAILABLE donation
$donTempResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/donations" -Token $donor1Token -Body @{
    foodCategory = "COOKED_MEALS"
    quantityKg = 5
    expiryHours = 2
    pickupAddress = "Kothrud, Pune"
}
$donTempId = $donTempResp.Json.id

# Scenario ii: Donor 2 attempts to delete Donor 1's donation -> 403
$otherDonorDel = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$donTempId" -Token $donor2Token
Report-Test "Donation Delete Rule" "Donor 2 Blocked from Deleting Donor 1's Donation (403)" ($otherDonorDel.StatusCode -eq 403) "Status: $($otherDonorDel.StatusCode)"

# Scenario iii: NGO attempts to delete donation -> 403
$ngoDel = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$donTempId" -Token $ngo1Token
Report-Test "Donation Delete Rule" "NGO Blocked from Deleting Donation (403)" ($ngoDel.StatusCode -eq 403) "Status: $($ngoDel.StatusCode)"

# Scenario iv: Volunteer attempts to delete donation -> 403
$volDel = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$donTempId" -Token $vol1Token
Report-Test "Donation Delete Rule" "Volunteer Blocked from Deleting Donation (403)" ($volDel.StatusCode -eq 403) "Status: $($volDel.StatusCode)"

# Scenario v: Donor 1 deletes own AVAILABLE donation -> 204 OK
$ownAvailDel = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$donTempId" -Token $donor1Token
Report-Test "Donation Delete Rule" "Donor 1 Successfully Deletes Own AVAILABLE Donation (204 OK)" ($ownAvailDel.StatusCode -eq 204) "Status: $($ownAvailDel.StatusCode)"

# Scenario vi: NGO 1 claims Donation 1 into Pickup 1
$pick1Resp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/pickups" -Token $ngo1Token -Body @{
    donationId = $don1Id
    volunteerId = $vol1Id
    notes = "Claimed by NGO 1, assigned to Vol 1"
}
$pick1Id = $pick1Resp.Json.id
Report-Test "Pickup" "NGO 1 Claims Donation 1 (Pickup 1 Created)" ($pick1Resp.StatusCode -in @(200, 201) -and $pick1Id) "Status: $($pick1Resp.StatusCode)"

# Scenario vii: Donor 1 attempts to delete own CLAIMED/non-AVAILABLE donation -> 403
$donorDelClaimed = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$don1Id" -Token $donor1Token
Report-Test "Donation Delete Rule" "Donor 1 Blocked from Deleting Own CLAIMED Donation (403)" ($donorDelClaimed.StatusCode -eq 403) "Status: $($donorDelClaimed.StatusCode)"

# Scenario viii: Donor 1 attempts to edit own CLAIMED donation -> 403
$donorEditNonAvail = Invoke-ApiRequest -Method "PUT" -Uri "$baseUrl/donations/$don1Id" -Token $donor1Token -Body @{
    foodCategory = "COOKED_MEALS"
    quantityKg = 50
    pickupAddress = "Changed Address"
    status = "AVAILABLE"
}
Report-Test "RBAC Permissions" "Donor Prohibited from Editing Non-AVAILABLE Donation (403)" ($donorEditNonAvail.StatusCode -eq 403) "Status: $($donorEditNonAvail.StatusCode)"

# Scenario ix: Admin deletes any donation -> OK (we create and test a temp claimed donation)
$donAdminDelResp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/donations" -Token $donor2Token -Body @{
    foodCategory = "PRODUCE"
    quantityKg = 8
    expiryHours = 4
    pickupAddress = "Baner, Pune"
}
$donAdminDelId = $donAdminDelResp.Json.id
$adminDelResp = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$donAdminDelId" -Token $adminToken
Report-Test "Donation Delete Rule" "Admin Successfully Deletes Donation (204 OK)" ($adminDelResp.StatusCode -eq 204) "Status: $($adminDelResp.StatusCode)"

# 8e. Volunteer 2 vs Volunteer 1 Pickup Isolation (403)
$vol2ViewPick1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/pickups/$pick1Id" -Token $vol2Token
Report-Test "RBAC Ownership" "Volunteer 2 Blocked from Viewing Volunteer 1's Pickup (403)" ($vol2ViewPick1.StatusCode -eq 403) "Status: $($vol2ViewPick1.StatusCode)"

$vol2UpdatePick1 = Invoke-ApiRequest -Method "PUT" -Uri "$baseUrl/pickups/$pick1Id/status" -Token $vol2Token -Body @{ status = "DELIVERED" }
Report-Test "RBAC Ownership" "Volunteer 2 Blocked from Updating Volunteer 1's Pickup (403)" ($vol2UpdatePick1.StatusCode -eq 403) "Status: $($vol2UpdatePick1.StatusCode)"

# 8f. Over-Exposed Data & Privacy Restrictions
# 8f-1: Volunteer Privacy: Volunteer cannot list other volunteers
$volListVols = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers" -Token $vol1Token
Report-Test "Data Privacy" "Volunteer Blocked from Listing Volunteers (403)" ($volListVols.StatusCode -eq 403) "Status: $($volListVols.StatusCode)"

$donorListVols = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers" -Token $donor1Token
Report-Test "Data Privacy" "Donor Blocked from Listing Volunteers (403)" ($donorListVols.StatusCode -eq 403) "Status: $($donorListVols.StatusCode)"

$vol1ViewVol2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers/$vol2Id" -Token $vol1Token
Report-Test "Data Privacy" "Volunteer 1 Blocked from Viewing Volunteer 2 Details (403)" ($vol1ViewVol2.StatusCode -eq 403) "Status: $($vol1ViewVol2.StatusCode)"

# 8f-2: NGO Volunteer List Scoping & Field Sanitization
$ngo1Vols = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers" -Token $ngo1Token
$ngo1VolIds = @($ngo1Vols.Json | ForEach-Object { $_.id })
$ngo1OnlyAssignedVol = ($ngo1VolIds -contains $vol1Id) -and ($ngo1VolIds -notcontains $vol2Id)
# Sensitive fields check: non-admin callers must NOT receive phone, userId, location
$vol1InNgo = $ngo1Vols.Json | Where-Object { $_.id -eq $vol1Id } | Select-Object -First 1
$volSanitized = ($null -eq $vol1InNgo.phone) -and ($null -eq $vol1InNgo.userId) -and ($null -eq $vol1InNgo.location)
Report-Test "Data Privacy" "NGO Volunteers Scoped to Assigned Pickups & Omits Sensitive Fields (phone, userId, GPS)" ($ngo1OnlyAssignedVol -and $volSanitized) "Assigned: $ngo1OnlyAssignedVol, Sanitized: $volSanitized"

# 8f-3: NGO Data Sanitization: Non-admins receive only minimum necessary fields
$donorViewNgos = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/ngos" -Token $donor1Token
$ngo1InList = $donorViewNgos.Json | Where-Object { $_.id -eq $ngo1Id } | Select-Object -First 1
$ngoSanitized = ($ngo1InList.organizationName) -and ($null -eq $ngo1InList.phone) -and ($null -eq $ngo1InList.contactPerson) -and ($null -eq $ngo1InList.userId)
Report-Test "Data Privacy" "NGO Profile List Exposes Only Minimum Fields to Non-Admins" $ngoSanitized "Phone/Contact/UserId omitted"

# 8g. Cross-Donor Data Isolation
$donor1AllDonations = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations" -Token $donor1Token
$donor1DonationIds = @($donor1AllDonations.Json | ForEach-Object { $_.id })
$donor1Isolated = ($donor1DonationIds -contains $don1Id) -and ($donor1DonationIds -notcontains $don2Id)
Report-Test "RBAC Ownership" "Donor 1 GET /api/donations Scoped Strictly to Own Donations" $donor1Isolated "Contains Don1: $($donor1DonationIds -contains $don1Id), Contains Don2: $($donor1DonationIds -contains $don2Id)"

$donor1ReadOther = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/$don2Id" -Token $donor1Token
Report-Test "RBAC Ownership" "Donor 1 Blocked from Reading Donor 2's Donation (403)" ($donor1ReadOther.StatusCode -eq 403) "Status: $($donor1ReadOther.StatusCode)"

$donor1DonorEndpointOther = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/donor/$donor2UserId" -Token $donor1Token
Report-Test "RBAC Ownership" "Donor 1 Blocked from Querying Donor 2 via /donor/{id} (403)" ($donor1DonorEndpointOther.StatusCode -eq 403) "Status: $($donor1DonorEndpointOther.StatusCode)"

# 8h. NGO Cross-Claim Isolation & Unclaimed Address Privacy
# NGO 2 Claims Donation 2 into Pickup 2
$pick2Resp = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/pickups" -Token $ngo2Token -Body @{
    donationId = $don2Id
    volunteerId = $vol2Id
    notes = "Pickup initiated by NGO 2"
}
$pick2Id = $pick2Resp.Json.id
Report-Test "Pickup" "NGO 2 Claims Donation 2 (Pickup 2 Created)" ($pick2Resp.StatusCode -in @(200, 201) -and $pick2Id) "Status: $($pick2Resp.StatusCode)"

# NGO 2 attempts to read Donation 1 (claimed by NGO 1) -> 403
$ngo2ReadDon1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/$don1Id" -Token $ngo2Token
Report-Test "RBAC Ownership" "NGO 2 Blocked from Reading Donation Claimed by NGO 1 (403)" ($ngo2ReadDon1.StatusCode -eq 403) "Status: $($ngo2ReadDon1.StatusCode)"

# NGO 1 attempts to read Donation 2 (claimed by NGO 2) -> 403
$ngo1ReadDon2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/$don2Id" -Token $ngo1Token
Report-Test "RBAC Ownership" "NGO 1 Blocked from Reading Donation Claimed by NGO 2 (403)" ($ngo1ReadDon2.StatusCode -eq 403) "Status: $($ngo1ReadDon2.StatusCode)"

# NGO 2 GET /api/donations: should see AVAILABLE donations + its own claimed (Donation 2), but NOT Donation 1
$ngo2AllDons = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations" -Token $ngo2Token
$ngo2DonationIds = @($ngo2AllDons.Json | ForEach-Object { $_.id })
$ngo2CannotSeeDon1 = ($ngo2DonationIds -notcontains $don1Id) -and ($ngo2DonationIds -contains $don2Id)
Report-Test "Data Privacy" "NGO 2 Donation List Excludes Donations Claimed by Other NGOs" $ngo2CannotSeeDon1 "Excluded Don1: $($ngo2DonationIds -notcontains $don1Id)"

# Address & Contact privacy: NGO 1 reading its OWN claimed Donation 1 receives revealed address and donor contact
$ngo1OwnDon1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/$don1Id" -Token $ngo1Token
$ngo1SeesFull = ($ngo1OwnDon1.Json.address -eq "Shivajinagar, Pune") -and ($ngo1OwnDon1.Json.donorEmail -eq "donor1_$uniqueSuffix@test.com")
Report-Test "Data Privacy" "Claiming NGO 1 Receives Revealed Address and Donor Contact Details" $ngo1SeesFull "Address: $($ngo1OwnDon1.Json.address), Email: $($ngo1OwnDon1.Json.donorEmail)"

# 8i. Non-admin blocked from listing users or deleting users
$donor1ListUsers = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/users" -Token $donor1Token
Report-Test "RBAC Role" "Non-Admin (Donor 1) Blocked from GET /api/users (403)" ($donor1ListUsers.StatusCode -eq 403) "Status: $($donor1ListUsers.StatusCode)"

$donor1DeleteUser = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$donor2UserId" -Token $donor1Token
Report-Test "RBAC Role" "Non-Admin (Donor 1) Blocked from DELETE /api/users/{id} (403)" ($donor1DeleteUser.StatusCode -eq 403) "Status: $($donor1DeleteUser.StatusCode)"

$ngo1UpdateOtherPickup = Invoke-ApiRequest -Method "PUT" -Uri "$baseUrl/pickups/$pick2Id/status" -Token $ngo1Token -Body @{ status = "COMPLETED" }
Report-Test "RBAC Ownership" "NGO 1 Blocked from Updating Other NGO's Pickup (403)" ($ngo1UpdateOtherPickup.StatusCode -eq 403) "Status: $($ngo1UpdateOtherPickup.StatusCode)"

# 9. Admin Super-Access Verification
$adminReadDon1 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations/$don1Id" -Token $adminToken
$adminReadPick2 = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/pickups/$pick2Id" -Token $adminToken
$adminListUsers = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/users" -Token $adminToken
$adminAllSuccess = ($adminReadDon1.StatusCode -eq 200) -and ($adminReadPick2.StatusCode -eq 200) -and ($adminListUsers.StatusCode -eq 200)
Report-Test "Admin Access" "Admin Super-Access Across Donations, Pickups, and Users" $adminAllSuccess "Don1: $($adminReadDon1.StatusCode) | Pick2: $($adminReadPick2.StatusCode) | Users: $($adminListUsers.StatusCode)"

# 10. Immediate Revocation upon User Deletion
# Delete Donor 2 while Donor 2 has an active, valid unexpired JWT
$delDonor2 = Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$donor2UserId" -Token $adminToken
$donor2TokenRevoked = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/me" -Token $donor2Token
Report-Test "Immediate Revocation" "Deleted User Immediately Rejected with Valid JWT (401)" ($delDonor2.StatusCode -eq 204 -and $donor2TokenRevoked.StatusCode -eq 401) "Delete: $($delDonor2.StatusCode), AuthMe: $($donor2TokenRevoked.StatusCode)"

# 11. Teardown & Cleanup of Test Entities
Write-Host "Teardown: Cleaning up remaining test entities..." -ForegroundColor DarkYellow
if ($pick1Id) { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/pickups/$pick1Id" -Token $adminToken | Out-Null }
if ($pick2Id) { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/pickups/$pick2Id" -Token $adminToken | Out-Null }
if ($don1Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$don1Id" -Token $adminToken | Out-Null }
if ($don2Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/donations/$don2Id" -Token $adminToken | Out-Null }
if ($ngo1Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/ngos/$ngo1Id" -Token $adminToken | Out-Null }
if ($ngo2Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/ngos/$ngo2Id" -Token $adminToken | Out-Null }
if ($vol1Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/volunteers/$vol1Id" -Token $adminToken | Out-Null }
if ($vol2Id)  { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/volunteers/$vol2Id" -Token $adminToken | Out-Null }

if ($donor1UserId) { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$donor1UserId" -Token $adminToken | Out-Null }
if ($lockUserId)   { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$lockUserId" -Token $adminToken | Out-Null }
if ($ngo1UserId)   { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$ngo1UserId" -Token $adminToken | Out-Null }
if ($ngo2UserId)   { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$ngo2UserId" -Token $adminToken | Out-Null }
if ($vol1UserId)   { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$vol1UserId" -Token $adminToken | Out-Null }
if ($vol2UserId)   { Invoke-ApiRequest -Method "DELETE" -Uri "$baseUrl/users/$vol2UserId" -Token $adminToken | Out-Null }

# 12. Final State Count Verification
$usersAfter = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/users" -Token $adminToken).Json.Count
$donationsAfter = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/donations" -Token $adminToken).Json.Count
$pickupsAfter = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/pickups" -Token $adminToken).Json.Count
$ngosAfter = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/ngos" -Token $adminToken).Json.Count
$volsAfter = (Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/volunteers" -Token $adminToken).Json.Count

Write-Host "Post-Cleanup Counts - Users: $usersAfter | Donations: $donationsAfter | Pickups: $pickupsAfter | NGOs: $ngosAfter | Vols: $volsAfter" -ForegroundColor Yellow

$countsMatch = ($usersBefore -eq $usersAfter) -and ($donationsBefore -eq $donationsAfter) -and ($pickupsBefore -eq $pickupsAfter) -and ($ngosBefore -eq $ngosAfter) -and ($volsBefore -eq $volsAfter)
Report-Test "Teardown" "Final Collection Counts Match Initial Baseline" $countsMatch "Users: $usersBefore->$usersAfter | Don: $donationsBefore->$donationsAfter | Pick: $pickupsBefore->$pickupsAfter | NGO: $ngosBefore->$ngosAfter | Vol: $volsBefore->$volsAfter"

Write-Host "==========================================================" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$total = $results.Count
Write-Host "  Results: $passed / $total Tests Passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($passed -ne $total) {
    exit 1
}
