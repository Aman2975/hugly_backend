# Railway Deployment Configuration for Email Service

## Environment Variables Required for Railway

Add these environment variables in your Railway project dashboard:

### Database Configuration
```
DB_HOST=your-mysql-host
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
DB_PORT=3306
```

### Email Configuration
```
GMAIL_USER=amankachura2975@gmail.com
GMAIL_APP_PASSWORD=ilsk pond lszj xjsi
```

### Application Configuration
```
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

## Railway-Specific Optimizations Applied

### 1. Email Service Improvements
- ✅ **Extended timeouts** for Railway's network environment
- ✅ **Retry logic** for connection timeouts and resets
- ✅ **Connection pooling** for better performance
- ✅ **Rate limiting** to prevent email service blocks

### 2. SMTP Configuration
- ✅ **Explicit host and port** configuration
- ✅ **Connection timeout**: 60 seconds
- ✅ **Socket timeout**: 60 seconds
- ✅ **Greeting timeout**: 30 seconds
- ✅ **Retry attempts**: 3 attempts with 5-second delays

### 3. Error Handling
- ✅ **Specific timeout error detection**
- ✅ **Automatic retry** for network issues
- ✅ **Detailed logging** for debugging

## Common Railway Email Issues & Solutions

### Issue: Connection Timeout
**Solution**: The updated configuration includes:
- Extended timeouts (60 seconds)
- Retry logic (3 attempts)
- Connection pooling

### Issue: SMTP Authentication Failed
**Solution**: Ensure Gmail App Password is correct:
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: `ilsk pond lszj xjsi`
3. Use App Password, not regular password

### Issue: Rate Limiting
**Solution**: The configuration includes:
- Rate limiting (5 emails per 20 seconds)
- Connection pooling
- Proper error handling

## Testing Email Service on Railway

1. **Check logs** for email sending attempts
2. **Look for retry messages** if initial attempts fail
3. **Verify environment variables** are set correctly
4. **Test with different email providers** if Gmail fails

## Monitoring

Watch for these log messages:
- `📧 Sending OTP email to [email] (attempt 1)`
- `✅ OTP email sent successfully: [email]`
- `🔄 Retrying OTP email in 5 seconds... (attempt 2)`
- `❌ Error sending OTP email (attempt 3): [error]`

## Alternative Email Services

If Gmail continues to have issues on Railway, consider:
1. **SendGrid** (recommended for production)
2. **Mailgun**
3. **Amazon SES**
4. **Outlook/Hotmail SMTP**

## Deployment Checklist

- [ ] Environment variables set in Railway
- [ ] Database connection working
- [ ] Email service tested
- [ ] Frontend URL configured
- [ ] JWT secret set
- [ ] NODE_ENV=production
