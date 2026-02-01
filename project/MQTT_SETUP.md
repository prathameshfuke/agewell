# AGEWELL MQTT Integration Guide

## Overview

The AGEWELL platform uses MQTT (Message Queuing Telemetry Transport) protocol for real-time communication with IoT devices, including the medicine dispenser box, environmental sensors, and home automation devices.

## Architecture

```
┌──────────────┐         MQTT/WebSocket         ┌──────────────┐
│   Frontend   │◄─────────────────────────────►│ MQTT Broker  │
│  (Browser)   │                                 │  (WSS/WS)    │
└──────────────┘                                 └──────────────┘
                                                        │
                                                        │ MQTT
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    │                   │                   │
                              ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
                              │ Medicine  │      │  Sensors  │      │Home Auto  │
                              │ Dispenser │      │ (Health & │      │  Devices  │
                              │    Box    │      │  Environ) │      │           │
                              └───────────┘      └───────────┘      └───────────┘
```

## Medicine Dispenser Box Integration

### Device Requirements

The medicine dispenser box should be an IoT-enabled device with:
- Multiple slots (typically 7-28 for daily/weekly medication)
- Motor/actuator system for dispensing
- WiFi/Ethernet connectivity
- MQTT client capability
- Optional: LED indicators, buzzer, LCD display

### MQTT Topics Structure

Each device communicates through specific topics:

```
agewell/{user_id}/dispenser/{device_id}/command    # Commands FROM server TO device
agewell/{user_id}/dispenser/{device_id}/status     # Status updates FROM device TO server
agewell/{user_id}/dispenser/{device_id}/event      # Events FROM device TO server
```

### Command Format (Server → Device)

**Dispense Medication:**
```json
{
  "action": "dispense",
  "slot": 3,
  "quantity": 1,
  "timestamp": "2025-10-18T10:30:00Z"
}
```

**Request Status:**
```json
{
  "action": "status",
  "timestamp": "2025-10-18T10:30:00Z"
}
```

**Configure Dispenser:**
```json
{
  "action": "configure",
  "slots": {
    "1": { "enabled": true, "medication": "Aspirin" },
    "2": { "enabled": true, "medication": "Metformin" },
    "3": { "enabled": false }
  }
}
```

**Test Dispense:**
```json
{
  "action": "test",
  "slot": 1
}
```

### Status Format (Device → Server)

```json
{
  "online": true,
  "timestamp": "2025-10-18T10:30:15Z",
  "slots": [
    {
      "number": 1,
      "filled": true,
      "remaining": 14,
      "medication": "Aspirin"
    },
    {
      "number": 2,
      "filled": true,
      "remaining": 8,
      "medication": "Metformin"
    }
  ],
  "lastDispensed": {
    "slot": 1,
    "timestamp": "2025-10-18T08:00:00Z"
  },
  "battery": 87,
  "errors": []
}
```

### Event Format (Device → Server)

**Medication Dispensed:**
```json
{
  "event": "dispensed",
  "slot": 3,
  "timestamp": "2025-10-18T10:30:20Z",
  "success": true
}
```

**Low Medication Warning:**
```json
{
  "event": "low_medication",
  "slot": 2,
  "remaining": 2,
  "timestamp": "2025-10-18T10:30:20Z"
}
```

**Device Error:**
```json
{
  "event": "error",
  "error_code": "MOTOR_JAM",
  "slot": 4,
  "message": "Motor jam detected in slot 4",
  "timestamp": "2025-10-18T10:30:20Z"
}
```

## Setting Up MQTT Broker

### Option 1: Public MQTT Broker (Testing Only)

For testing, you can use public brokers like:
- `mqtt.eclipseprojects.io` (Port: 1883 TCP, 443 WebSocket)
- `broker.hivemq.com` (Port: 1883 TCP, 8000 WebSocket)

**Not recommended for production due to security concerns.**

### Option 2: Self-Hosted MQTT Broker (Recommended)

#### Using Mosquitto (Most Popular)

1. **Install Mosquitto:**
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Docker
docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

2. **Configure WebSocket Support:**

Edit `/etc/mosquitto/mosquitto.conf`:
```
# MQTT Protocol
listener 1883
protocol mqtt

# WebSocket Support
listener 9001
protocol websockets

# Authentication (optional but recommended)
allow_anonymous false
password_file /etc/mosquitto/passwd
```

3. **Create User Accounts:**
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd agewell_user
```

4. **Restart Mosquitto:**
```bash
sudo systemctl restart mosquitto
```

### Option 3: Cloud MQTT Providers

#### AWS IoT Core
- Fully managed MQTT broker
- Built-in security with X.509 certificates
- Scales automatically

#### HiveMQ Cloud
- Free tier available
- Easy setup
- Web-based management console

#### Azure IoT Hub
- Enterprise-grade
- Integration with Azure services

## Frontend Configuration

Update the MQTT broker URL in `src/services/mqttService.ts`:

```typescript
private getDefaultBrokerUrl(): string {
  // For local development
  return 'ws://localhost:9001';

  // For production with SSL
  // return 'wss://your-mqtt-broker.com:8084/mqtt';
}
```

## Device Registration

### In AGEWELL Platform

1. Log in as a caregiver
2. Navigate to device management
3. Add new device with:
   - Device Type: `medicine_dispenser`
   - Device Name: e.g., "Bedroom Medicine Box"
   - MQTT Topic: `agewell/{user_id}/dispenser/{device_id}/command`
   - Location: e.g., "Master Bedroom"

### In Dispenser Device Firmware

Configure the device to:
1. Connect to WiFi
2. Establish MQTT connection to broker
3. Subscribe to command topic: `agewell/{user_id}/dispenser/{device_id}/command`
4. Publish to status topic: `agewell/{user_id}/dispenser/{device_id}/status`
5. Publish to event topic: `agewell/{user_id}/dispenser/{device_id}/event`

## Sample Arduino/ESP32 Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "your-mqtt-broker.com";
const int mqtt_port = 1883;

const char* user_id = "user-uuid-here";
const char* device_id = "device-uuid-here";

char command_topic[100];
char status_topic[100];
char event_topic[100];

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Initialize motors, sensors, etc.
  initializeHardware();

  // Setup MQTT topics
  sprintf(command_topic, "agewell/%s/dispenser/%s/command", user_id, device_id);
  sprintf(status_topic, "agewell/%s/dispenser/%s/status", user_id, device_id);
  sprintf(event_topic, "agewell/%s/dispenser/%s/event", user_id, device_id);

  // Connect to WiFi
  setupWiFi();

  // Connect to MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  // Check scheduled dispensing
  checkSchedule();

  // Publish status every 5 minutes
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 300000) {
    publishStatus();
    lastStatus = millis();
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  // Parse JSON command
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);

  String action = doc["action"];

  if (action == "dispense") {
    int slot = doc["slot"];
    dispenseMedication(slot);
  } else if (action == "status") {
    publishStatus();
  } else if (action == "configure") {
    configureSlots(doc);
  }
}

void dispenseMedication(int slot) {
  // Activate motor for slot
  bool success = activateSlotMotor(slot);

  // Publish event
  DynamicJsonDocument doc(256);
  doc["event"] = "dispensed";
  doc["slot"] = slot;
  doc["timestamp"] = getTimestamp();
  doc["success"] = success;

  String output;
  serializeJson(doc, output);
  client.publish(event_topic, output.c_str());
}

void publishStatus() {
  DynamicJsonDocument doc(1024);
  doc["online"] = true;
  doc["timestamp"] = getTimestamp();
  doc["battery"] = getBatteryLevel();

  JsonArray slots = doc.createNestedArray("slots");
  for (int i = 1; i <= 7; i++) {
    JsonObject slot = slots.createNestedObject();
    slot["number"] = i;
    slot["filled"] = isSlotFilled(i);
    slot["remaining"] = getSlotRemaining(i);
  }

  String output;
  serializeJson(doc, output);
  client.publish(status_topic, output.c_str());
}
```

## Environmental Sensors

### Temperature Sensor

**Topic:** `agewell/{user_id}/sensor/temperature`

**Payload:**
```json
{
  "type": "temperature",
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2025-10-18T10:30:00Z",
  "location": "bedroom"
}
```

### Air Quality Sensor

**Topic:** `agewell/{user_id}/sensor/air_quality`

**Payload:**
```json
{
  "type": "co2",
  "value": 450,
  "unit": "ppm",
  "timestamp": "2025-10-18T10:30:00Z",
  "metadata": {
    "o2": 20.9,
    "humidity": 45
  }
}
```

### Health Sensors

**Topic:** `agewell/{user_id}/sensor/health`

**Payload:**
```json
{
  "type": "heart_rate",
  "value": 72,
  "unit": "bpm",
  "timestamp": "2025-10-18T10:30:00Z"
}
```

## Security Best Practices

1. **Use TLS/SSL:** Always use `wss://` (WebSocket Secure) in production
2. **Authentication:** Enable username/password or certificate-based auth
3. **Topic ACLs:** Restrict users to their own topics only
4. **Data Encryption:** Encrypt sensitive health data in payloads
5. **Firewall Rules:** Limit MQTT broker access to known IPs
6. **Regular Updates:** Keep MQTT broker and device firmware updated

## Troubleshooting

### Device Not Connecting

1. Check WiFi credentials
2. Verify MQTT broker is running: `netstat -an | grep 1883`
3. Test with MQTT client: `mosquitto_sub -h localhost -t "#" -v`
4. Check firewall rules

### Messages Not Being Received

1. Verify topic subscription
2. Check QoS levels (use QoS 1 for important messages)
3. Monitor broker logs: `tail -f /var/log/mosquitto/mosquitto.log`
4. Test publish: `mosquitto_pub -h localhost -t "test/topic" -m "hello"`

### WebSocket Connection Fails

1. Ensure WebSocket listener is enabled in broker config
2. Check browser console for errors
3. Verify correct port (usually 9001 or 8083)
4. Test WebSocket connection with online tools

## Production Deployment Checklist

- [ ] Set up dedicated MQTT broker with SSL/TLS
- [ ] Configure authentication (username/password minimum)
- [ ] Implement topic ACLs for user isolation
- [ ] Set up monitoring and alerting for broker
- [ ] Test device reconnection after network loss
- [ ] Implement device firmware OTA updates
- [ ] Create backup power solution for dispenser
- [ ] Test emergency scenarios (power loss, network outage)
- [ ] Document device configuration for support team
- [ ] Train caregivers on device management

## Support

For technical support or questions about MQTT integration, contact the AGEWELL development team.
