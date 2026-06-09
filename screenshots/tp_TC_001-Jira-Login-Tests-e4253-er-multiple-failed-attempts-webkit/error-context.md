# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tp_TC_001.spec.ts >> Jira Login Tests >> TC_10: Login after multiple failed attempts
- Location: tests\tp_TC_001.spec.ts:72:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.error-message')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.error-message')
    - waiting for" http://192.168.2.67/cpdss/?realm=null&logoUrl=assets/images/company-logo/mol.png&token=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJTSElQX0pXVF9UT0tFTiIsIlVTRVJfSUQiOjExLCJleHAiOjE3ODEwMDcxMDYsImlhdCI6MTc4MTAwMzU…" navigation to finish...
    - navigated to "http://192.168.2.67/cpdss/?realm=null&logoUrl=assets/images/company-logo/mol.png&token=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJTSElQX0pXVF9UT0tFTiIsIlVTRVJfSUQiOjExLCJleHAiOjE3ODEwMDcxMDYsImlhdCI6MTc4MTAwMzU…"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - img [ref=e6]
    - list [ref=e9]:
      - listitem [ref=e10] [cursor=pointer]:
        - generic [ref=e12]: Dashboard
      - listitem [ref=e13] [cursor=pointer]:
        - generic [ref=e15]: Cargo Planning
      - listitem [ref=e16] [cursor=pointer]:
        - generic [ref=e18]: Voyages
      - listitem [ref=e19] [cursor=pointer]:
        - generic [ref=e21]: Synoptical
      - listitem [ref=e22] [cursor=pointer]:
        - generic [ref=e24]: Admin
      - listitem [ref=e25] [cursor=pointer]:
        - generic [ref=e27]: Operations
      - listitem [ref=e28] [cursor=pointer]:
        - generic [ref=e30]: Files
    - list [ref=e32]:
      - listitem
      - listitem
      - listitem [ref=e33]:
        - generic [ref=e35] [cursor=pointer]: 
      - listitem [ref=e36]
      - listitem [ref=e38]:
        - generic [ref=e40] [cursor=pointer]: 
      - listitem [ref=e41]
  - generic [ref=e45]:
    - generic [ref=e46]:
      - generic [ref=e49]:
        - img "Flag Url" [ref=e51]
        - generic [ref=e52]:
          - heading "PACIFIC VOYAGER" [level=5] [ref=e53]
          - generic [ref=e54]: IMO 9362889
      - generic [ref=e55]:
        - generic [ref=e56]: Voyage
        - generic [ref=e58] [cursor=pointer]:
          - generic [ref=e59]:
            - listbox "8JuneR1 (Active)"
          - generic [ref=e60]: 8JuneR1 (Active)
          - button "" [ref=e61]:
            - generic [ref=e62]: 
      - generic [ref=e63]: Voyage Distance
      - generic [ref=e64]: 0.00 NM
      - generic [ref=e65]:
        - generic [ref=e66]:
          - generic [ref=e67]: UNIT
          - generic [ref=e69] [cursor=pointer]:
            - generic [ref=e70]:
              - listbox "BBLS@60F"
            - generic [ref=e71]: BBLS@60F
            - button "" [ref=e72]:
              - generic [ref=e73]: 
        - generic [ref=e74] [cursor=pointer]: Create New Voyage
    - generic [ref=e83]:
      - button "" [disabled] [ref=e84]:
        - generic [ref=e85]: 
      - generic [ref=e87]:
        - generic [ref=e91] [cursor=pointer]:
          - heading "Arrival" [level=5] [ref=e94]
          - generic [ref=e97]:
            - generic [ref=e98]: Port
            - generic [ref=e99]: RAS TANURA
          - generic [ref=e100]:
            - generic [ref=e101]: Ata
            - generic [ref=e102]: 06-May-2026
          - generic [ref=e103]:
            - generic [ref=e104]: Time
            - generic [ref=e105]: 10:11 (UTC +03:00)
        - generic [ref=e111] [cursor=pointer]:
          - generic [ref=e112]:
            - heading "Departure" [level=5] [ref=e114]
            - generic [ref=e116]: 0.00 NM
          - generic [ref=e118]:
            - generic [ref=e119]: Port
            - generic [ref=e120]: RAS TANURA
          - generic [ref=e121]:
            - generic [ref=e122]: Atd
            - generic [ref=e123]: 07-May-2026
          - generic [ref=e124]:
            - generic [ref=e125]: Time
            - generic [ref=e126]: 10:11 (UTC +03:00)
        - generic [ref=e132] [cursor=pointer]:
          - heading "Arrival" [level=5] [ref=e135]
          - generic [ref=e138]:
            - generic [ref=e139]: Port
            - generic [ref=e140]: UBE
          - generic [ref=e141]:
            - generic [ref=e142]: Eta
            - generic [ref=e143]: 08-May-2026
          - generic [ref=e144]:
            - generic [ref=e145]: Time
            - generic [ref=e146]: 10:11 (UTC +09:00)
        - generic [ref=e152] [cursor=pointer]:
          - heading "Departure" [level=5] [ref=e155]
          - generic [ref=e158]:
            - generic [ref=e159]: Port
            - generic [ref=e160]: UBE
          - generic [ref=e162]: Etd
          - generic [ref=e165]: Time
      - button "" [disabled] [ref=e169]:
        - generic [ref=e170]: 
    - generic [ref=e171]:
      - generic [ref=e177]:
        - table [ref=e180]:
          - rowgroup [ref=e181]:
            - row "Parameters Value" [ref=e182]:
              - columnheader "Parameters" [ref=e183]
              - columnheader "Value" [ref=e184]
          - rowgroup
        - table [ref=e186]:
          - rowgroup [ref=e187]:
            - row "FO + DO 4,908.00" [ref=e188]:
              - cell "FO + DO" [ref=e189] [cursor=pointer]
              - cell "4,908.00" [ref=e190] [cursor=pointer]
            - row "Cargo MT 0.00" [ref=e191]:
              - cell "Cargo MT" [ref=e192] [cursor=pointer]
              - cell "0.00" [ref=e193] [cursor=pointer]
            - row "Ballast 95,516.20" [ref=e194]:
              - cell "Ballast" [ref=e195] [cursor=pointer]
              - cell "95,516.20" [ref=e196] [cursor=pointer]
            - row "FW + DW + BW 710.00" [ref=e197]:
              - cell "FW + DW + BW" [ref=e198] [cursor=pointer]
              - cell "710.00" [ref=e199] [cursor=pointer]
            - row "Others 0.00" [ref=e200]:
              - cell "Others" [ref=e201] [cursor=pointer]
              - cell "0.00" [ref=e202] [cursor=pointer]
            - row "S.G 1.0320" [ref=e203]:
              - cell "S.G" [ref=e204] [cursor=pointer]
              - cell "1.0320" [ref=e205] [cursor=pointer]
            - row "Constant 665.00" [ref=e206]:
              - cell "Constant" [ref=e207] [cursor=pointer]
              - cell "665.00" [ref=e208] [cursor=pointer]
            - row "Total DWT 101,799.20" [ref=e209]:
              - cell "Total DWT" [ref=e210] [cursor=pointer]
              - cell "101,799.20" [ref=e211] [cursor=pointer]
            - row "Displacement 143,617.20" [ref=e212]:
              - cell "Displacement" [ref=e213] [cursor=pointer]
              - cell "143,617.20" [ref=e214] [cursor=pointer]
        - generic:
          - generic:
            - table:
              - rowgroup
      - generic [ref=e217]:
        - generic [ref=e219]:
          - generic [ref=e220]: "!"
          - text: The data displayed here will be planned values if actuals are not updated
        - generic [ref=e229]:
          - generic [ref=e230]: View All
          - generic [ref=e233]:
            - switch
        - generic [ref=e241]:
          - generic [ref=e242]:
            - generic [ref=e243]:
              - heading "SPP" [level=5] [ref=e245]
              - generic [ref=e246]: 0.00%
            - generic [ref=e247]:
              - heading "5P" [level=5] [ref=e249]
              - generic [ref=e250]: 0.00%
            - generic [ref=e251]:
              - heading "5C" [level=5] [ref=e253]
              - generic [ref=e254]: 0.00%
            - generic [ref=e255]:
              - heading "SLS" [level=5] [ref=e257]
              - generic [ref=e258]: 0.00%
            - generic [ref=e259]:
              - heading "5S" [level=5] [ref=e261]
              - generic [ref=e262]: 0.00%
          - generic [ref=e263]:
            - generic [ref=e264]:
              - heading "4P" [level=5] [ref=e266]
              - generic [ref=e267]: 0.00%
            - generic [ref=e268]:
              - heading "4C" [level=5] [ref=e270]
              - generic [ref=e271]: 0.00%
            - generic [ref=e272]:
              - heading "4S" [level=5] [ref=e274]
              - generic [ref=e275]: 0.00%
          - generic [ref=e276]:
            - generic [ref=e277]:
              - heading "3P" [level=5] [ref=e279]
              - generic [ref=e280]: 0.00%
            - generic [ref=e281]:
              - heading "3C" [level=5] [ref=e283]
              - generic [ref=e284]: 0.00%
            - generic [ref=e285]:
              - heading "3S" [level=5] [ref=e287]
              - generic [ref=e288]: 0.00%
          - generic [ref=e289]:
            - generic [ref=e290]:
              - heading "2P" [level=5] [ref=e292]
              - generic [ref=e293]: 0.00%
            - generic [ref=e294]:
              - heading "2C" [level=5] [ref=e296]
              - generic [ref=e297]: 0.00%
            - generic [ref=e298]:
              - heading "2S" [level=5] [ref=e300]
              - generic [ref=e301]: 0.00%
          - generic [ref=e302]:
            - generic [ref=e303]:
              - heading "1P" [level=5] [ref=e305]
              - generic [ref=e306]: 0.00%
            - generic [ref=e307]:
              - heading "1C" [level=5] [ref=e309]
              - generic [ref=e310]: 0.00%
            - generic [ref=e311]:
              - heading "1S" [level=5] [ref=e313]
              - generic [ref=e314]: 0.00%
      - grid [ref=e321]:
        - rowgroup [ref=e322]:
          - row "Grades Planned Actual +/-" [ref=e323]:
            - columnheader "Grades" [ref=e324]
            - columnheader "Planned" [ref=e325]
            - columnheader "Actual" [ref=e326]
            - columnheader "+/-" [ref=e327]
        - rowgroup [ref=e328]:
          - row "AMCO 0 0 0" [ref=e329]:
            - gridcell "AMCO" [ref=e330] [cursor=pointer]: AMCO
            - gridcell "0" [ref=e332] [cursor=pointer]
            - gridcell "0" [ref=e333] [cursor=pointer]
            - gridcell "0" [ref=e334] [cursor=pointer]
          - row "AXCO 0 0 0" [ref=e335]:
            - gridcell "AXCO" [ref=e336] [cursor=pointer]: AXCO
            - gridcell "0" [ref=e338] [cursor=pointer]
            - gridcell "0" [ref=e339] [cursor=pointer]
            - gridcell "0" [ref=e340] [cursor=pointer]
        - rowgroup [ref=e341]:
          - row "Total 0 0 0" [ref=e342]:
            - gridcell "Total" [ref=e343]
            - gridcell "0" [ref=e344]
            - gridcell "0" [ref=e345]
            - gridcell "0" [ref=e346]
    - generic [ref=e347]:
      - generic [ref=e351]:
        - generic [ref=e352]: PORT
        - generic [ref=e353]:
          - text: List
          - heading "0.00°" [level=5] [ref=e354]
        - generic [ref=e355]: STBD
      - generic [ref=e361]:
        - generic [ref=e363]:
          - generic [ref=e364]: Water Line
          - generic [ref=e366]:
            - text: Trim
            - heading "2.47M B/S" [level=5] [ref=e367]
        - generic [ref=e368]:
          - text: Hog
          - heading "27.43CM" [level=5] [ref=e369]
      - generic [ref=e372]:
        - generic [ref=e373]: Draft
        - grid [ref=e377]:
          - rowgroup [ref=e378]:
            - row "AFT MID FORE" [ref=e379]:
              - columnheader "AFT" [ref=e380]
              - columnheader "MID" [ref=e381]
              - columnheader "FORE" [ref=e382]
          - rowgroup [ref=e383]:
            - row "10.63M 9.12M 8.16M" [ref=e384]:
              - gridcell "10.63M" [ref=e385] [cursor=pointer]
              - gridcell "9.12M" [ref=e386] [cursor=pointer]
              - gridcell "8.16M" [ref=e387] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Jira Login Tests', () => {
  4  |   const validUsername = 'valid_user';
  5  |   const validPassword = 'valid_password';
  6  |   const dashboardUrl = '/dashboard';
  7  | 
  8  |   test.beforeEach(async ({ page }) => {
  9  |     await page.goto(process.env.TEST_URL || '/login');
  10 |   });
  11 | 
  12 |   test('TC_01: Successful login with valid credentials', async ({ page }) => {
  13 |     await page.fill('.username', validUsername);
  14 |     await page.fill('#password', validPassword);
  15 |     await page.press('#password', 'Enter');
  16 |     await expect(page).toHaveURL(dashboardUrl);
  17 |   });
  18 | 
  19 |   test('TC_02: Login with invalid username', async ({ page }) => {
  20 |     await page.fill('.username', process.env.TEST_USER || 'invalid_user');
  21 |     await page.fill('#password', validPassword);
  22 |     await page.press('#password', 'Enter');
  23 |     await expect(page.locator('.error-message')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('TC_03: Login with invalid password', async ({ page }) => {
  27 |     await page.fill('.username', validUsername);
  28 |     await page.fill('#password', process.env.TEST_PASS || 'invalid_password');
  29 |     await page.press('#password', 'Enter');
  30 |     await expect(page.locator('.error-message')).toBeVisible();
  31 |   });
  32 | 
  33 |   test('TC_04: Login with empty username', async ({ page }) => {
  34 |     await page.fill('#password', validPassword);
  35 |     await page.press('#password', 'Enter');
  36 |     await expect(page.locator('.error-message')).toHaveText('Username is required');
  37 |   });
  38 | 
  39 |   test('TC_05: Login with empty password', async ({ page }) => {
  40 |     await page.fill('.username', validUsername);
  41 |     await page.press('#password', 'Enter');
  42 |     await expect(page.locator('.error-message')).toHaveText('Password is required');
  43 |   });
  44 | 
  45 |   test('TC_06: Login with empty username and password', async ({ page }) => {
  46 |     await page.press('#password', 'Enter');
  47 |     await expect(page.locator('.error-message')).toHaveText('Username and password are required');
  48 |   });
  49 | 
  50 |   test('TC_07: Login with SQL injection in username', async ({ page }) => {
  51 |     await page.fill('.username', process.env.TEST_USER || "admin' OR '1'='1");
  52 |     await page.fill('#password', validPassword);
  53 |     await page.press('#password', 'Enter');
  54 |     await expect(page.locator('.error-message')).toBeVisible();
  55 |   });
  56 | 
  57 |   test('TC_08: Login with XSS in password', async ({ page }) => {
  58 |     await page.fill('.username', validUsername);
  59 |     await page.fill('#password', process.env.TEST_PASS || '<script>alert("XSS")</script>');
  60 |     await page.press('#password', 'Enter');
  61 |     await expect(page.locator('.error-message')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('TC_09: Login with maximum length credentials', async ({ page }) => {
  65 |     const maxLengthString = 'a'.repeat(255);
  66 |     await page.fill('.username', maxLengthString);
  67 |     await page.fill('#password', maxLengthString);
  68 |     await page.press('#password', 'Enter');
  69 |     await expect(page).toHaveURL(dashboardUrl);
  70 |   });
  71 | 
  72 |   test('TC_10: Login after multiple failed attempts', async ({ page }) => {
  73 |     // Simulate failed attempts
  74 |     for (let i = 0; i < 3; i++) {
  75 |       await page.fill('.username', process.env.TEST_USER || 'wrong_user');
  76 |       await page.fill('#password', process.env.TEST_PASS || 'wrong_pass');
  77 |       await page.press('#password', 'Enter');
> 78 |       await expect(page.locator('.error-message')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  79 |       await page.reload();
  80 |     }
  81 | 
  82 |     // Successful attempt
  83 |     await page.fill('.username', validUsername);
  84 |     await page.fill('#password', validPassword);
  85 |     await page.press('#password', 'Enter');
  86 |     await expect(page).toHaveURL(dashboardUrl);
  87 |   });
  88 | });
```