# 🤖 OpenAI Usage Monitor System

## 📋 Overview

This system automatically monitors OpenAI API usage and sends alerts to administrators via Telegram when the usage approaches the $3.00 limit.

## 🚀 Features

- **Automatic Monitoring**: Checks usage every 6 hours
- **Smart Alerts**: Sends alerts when usage reaches $2.50
- **Telegram Notifications**: Notifies all admins instantly
- **Manual Controls**: API endpoints for manual checks
- **Usage Statistics**: Detailed usage information

## 🔧 Configuration

### Required Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_IDS=76599340,276043481,110435852
```

### Alert Thresholds

- **Warning Level**: $2.50 (sends alert)
- **Critical Level**: $3.00 (service may stop)
- **Reset Level**: $2.00 (resets alert flag)

## 📊 API Endpoints

### Get Usage Statistics
```http
GET /api/v1/admin/openai/usage
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "OpenAI usage statistics",
  "data": {
    "current_usage": 2.4567,
    "alert_threshold": 2.5,
    "critical_level": 3.0,
    "last_check": "2024-01-15 14:30:00",
    "alert_sent": true,
    "last_alert": "2024-01-15 14:25:00"
  }
}
```

### Manual Usage Check
```http
POST /api/v1/admin/openai/check
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Usage check completed",
  "success": true
}
```

### Send Test Alert
```http
POST /api/v1/admin/openai/test-alert
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Test alert sent to all admins",
  "success": true
}
```

## 🔄 How It Works

1. **Background Monitoring**: Runs every 6 hours automatically
2. **Usage Calculation**: Estimates cost based on token usage
3. **Alert Logic**: 
   - If usage ≥ $2.50 and no recent alert → Send alert
   - If usage < $2.00 → Reset alert flag
4. **Telegram Notification**: Sends formatted message to all admins

## 📱 Alert Message Format

```
🚨 **هشدار شارژ OpenAI**

💰 **شارژ فعلی**: $2.4567
⚠️ **وضعیت**: نزدیک به $3.00
🕐 **زمان**: 2024-01-15 14:30:00

📝 **توصیه**: لطفاً حساب OpenAI را شارژ کنید تا سرویس هوش مصنوعی قطع نشود.

🔗 **لینک مدیریت**: https://platform.openai.com/account/billing
```

## 🧪 Testing

### Test the System
```bash
# Run the test script
./test_openai_alert.bat

# Or manually
cd backend
go run scripts/test_openai_alert.go
```

### Test API Endpoints
```bash
# Test usage stats
curl -X GET "http://localhost:8080/api/v1/admin/openai/usage" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test manual check
curl -X POST "http://localhost:8080/api/v1/admin/openai/check" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test alert
curl -X POST "http://localhost:8080/api/v1/admin/openai/test-alert" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Setup Instructions

1. **Add to main.go** (already done):
   ```go
   // Initialize OpenAI monitor
   openaiMonitor := services.NewOpenAIMonitor(telegramService)
   go openaiMonitor.StartMonitoring()
   ```

2. **Configure Environment Variables**:
   - Set OpenAI API key
   - Set Telegram bot token
   - Set admin IDs

3. **Test the System**:
   ```bash
   ./test_openai_alert.bat
   ```

## 📈 Monitoring Dashboard

The system provides real-time monitoring through:

- **Usage Statistics**: Current usage, thresholds, last check time
- **Alert Status**: Whether alerts have been sent
- **Historical Data**: Usage patterns over time

## ⚠️ Important Notes

1. **API Limits**: OpenAI usage API has rate limits
2. **Cost Estimation**: Uses approximate calculations (may vary)
3. **Alert Frequency**: Prevents spam by tracking last alert time
4. **Admin Access**: Only admins can access monitoring endpoints

## 🛠️ Troubleshooting

### Common Issues

1. **No Alerts Received**:
   - Check Telegram bot token
   - Verify admin IDs
   - Check network connectivity

2. **Inaccurate Usage**:
   - OpenAI API may have delays
   - Cost estimation is approximate
   - Check API key permissions

3. **System Not Starting**:
   - Check database connection
   - Verify all dependencies
   - Check logs for errors

### Debug Commands

```bash
# Check if monitoring is running
ps aux | grep openai_monitor

# Check logs
tail -f /var/log/asl-market/backend.log

# Test database connection
mysql -u asl_user -p asl_market -e "SELECT 1"
```

## 📞 Support

For issues with the monitoring system:

1. Check the logs first
2. Test the API endpoints
3. Verify configuration
4. Contact the development team

---

**System Status**: ✅ Active  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0
