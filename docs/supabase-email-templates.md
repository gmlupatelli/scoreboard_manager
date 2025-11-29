# Supabase Email Templates for Scoreboard Manager

These are customized email templates for your Scoreboard Manager app. Copy each template into the corresponding section in your Supabase dashboard under **Authentication > Email Templates**.

**Brand Colors Used:**
- Primary: `#f77174` (coral/salmon)
- Secondary: `#eba977` (orange)
- Accent: `#38385e` (navy blue)
- Foreground: `#20203e` (dark navy)

---

## 1. Reset Password Email

**Subject Line:**
```
Reset your Scoreboard Manager password
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAFAFA;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAFAFA;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E2E8F0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">Scoreboard Manager</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #20203e; text-align: center;">Reset Your Password</h1>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 24px; color: #38385e; text-align: center;">
                We received a request to reset your password for your Scoreboard Manager account. Click the button below to create a new password.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 0; font-size: 14px; line-height: 22px; color: #38385e; text-align: center;">
                This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAFAFA; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #38385e; text-align: center;">
                This email was sent by Scoreboard Manager.<br>
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Confirm Signup Email

**Subject Line:**
```
Welcome to Scoreboard Manager - Confirm your email
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAFAFA;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAFAFA;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E2E8F0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">Scoreboard Manager</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #20203e; text-align: center;">Welcome to Scoreboard Manager!</h1>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 24px; color: #38385e; text-align: center;">
                Thanks for signing up! Please confirm your email address to get started creating and managing your scoreboards.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Confirm Email Address</a>
                  </td>
                </tr>
              </table>
              <div style="margin: 30px 0 0; padding: 20px; background-color: #FFF5F5; border-radius: 8px; border-left: 4px solid #f77174;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #20203e;">What you can do with Scoreboard Manager:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 22px; color: #38385e;">
                  <li>Create unlimited scoreboards</li>
                  <li>Real-time score updates</li>
                  <li>Share public scoreboards with anyone</li>
                  <li>Perfect for TV displays and live events</li>
                </ul>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAFAFA; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #38385e; text-align: center;">
                This email was sent by Scoreboard Manager.<br>
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Change Email Address

**Subject Line:**
```
Confirm your new email address - Scoreboard Manager
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAFAFA;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAFAFA;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E2E8F0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">Scoreboard Manager</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #20203e; text-align: center;">Confirm Your New Email</h1>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 24px; color: #38385e; text-align: center;">
                You requested to change your email address for your Scoreboard Manager account. Please click the button below to confirm this change.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Confirm New Email</a>
                  </td>
                </tr>
              </table>
              <div style="margin: 25px 0 0; padding: 16px; background-color: #FEF7EC; border-radius: 8px; border-left: 4px solid #eba977;">
                <p style="margin: 0; font-size: 14px; line-height: 22px; color: #20203e;">
                  <strong>Security Notice:</strong> If you didn't request this email change, please secure your account immediately by resetting your password.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAFAFA; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #38385e; text-align: center;">
                This email was sent by Scoreboard Manager.<br>
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Magic Link Email

**Subject Line:**
```
Your Scoreboard Manager login link
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAFAFA;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FAFAFA;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E2E8F0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">Scoreboard Manager</span>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #20203e; text-align: center;">Your Login Link</h1>
              <p style="margin: 0 0 25px; font-size: 16px; line-height: 24px; color: #38385e; text-align: center;">
                Click the button below to securely log in to your Scoreboard Manager account. No password needed!
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f77174 0%, #eba977 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">Log In to Scoreboard Manager</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 25px 0 0; font-size: 14px; line-height: 22px; color: #38385e; text-align: center;">
                This link will expire in 1 hour for security reasons. If you didn't request this login link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAFAFA; border-top: 1px solid #E2E8F0; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 20px; color: #38385e; text-align: center;">
                This email was sent by Scoreboard Manager.<br>
                If you have questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## How to Add These Templates to Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** > **Email Templates** in the left sidebar
3. Select the template type you want to customize (e.g., "Reset Password")
4. Copy the **Subject Line** into the "Subject" field
5. Copy the **Email Body (HTML)** into the "Body" field (make sure HTML mode is enabled)
6. Click **Save** to apply the template
7. Repeat for each template type

## Template Variables Reference

These templates use Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The full URL the user should click
- `{{ .Token }}` - The confirmation token (if you need to build custom URLs)
- `{{ .TokenHash }}` - A hashed version of the token
- `{{ .SiteURL }}` - Your configured site URL

Make sure to keep these variables in your templates for the authentication flow to work properly!
