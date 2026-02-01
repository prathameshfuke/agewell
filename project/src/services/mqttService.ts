import { supabase } from '../lib/supabase';

export interface MQTTMessage {
  topic: string;
  payload: string | object;
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

export interface MedicineDispenserCommand {
  action: 'dispense' | 'status' | 'configure' | 'test';
  slot?: number;
  quantity?: number;
  timestamp?: string;
}

export interface MedicineDispenserStatus {
  online: boolean;
  slots: Array<{
    number: number;
    filled: boolean;
    remaining: number;
  }>;
  lastDispensed?: {
    slot: number;
    timestamp: string;
  };
  battery?: number;
  errors?: string[];
}

export interface SensorData {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class MQTTService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Array<(message: any) => void>> = new Map();
  private isConnecting: boolean = false;
  private userId: string | null = null;

  constructor() {}

  async connect(userId: string, brokerUrl?: string): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    const wsUrl = brokerUrl || this.getDefaultBrokerUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('MQTT WebSocket connected');
        this.isConnecting = false;
        this.subscribeToUserTopics();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('MQTT WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('MQTT WebSocket closed');
        this.isConnecting = false;
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private getDefaultBrokerUrl(): string {
    return 'wss://mqtt.example.com:8084/mqtt';
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectInterval);
  }

  private async subscribeToUserTopics(): Promise<void> {
    if (!this.userId) return;

    const { data: devices } = await supabase
      .from('iot_devices')
      .select('mqtt_topic')
      .eq('user_id', this.userId);

    if (devices) {
      devices.forEach((device) => {
        this.subscribe(device.mqtt_topic);
      });
    }
  }

  subscribe(topic: string, handler?: (message: any) => void): void {
    if (handler) {
      const handlers = this.messageHandlers.get(topic) || [];
      handlers.push(handler);
      this.messageHandlers.set(topic, handlers);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMsg = {
        type: 'subscribe',
        topic: topic,
      };
      this.ws.send(JSON.stringify(subscribeMsg));
    }
  }

  unsubscribe(topic: string): void {
    this.messageHandlers.delete(topic);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMsg = {
        type: 'unsubscribe',
        topic: topic,
      };
      this.ws.send(JSON.stringify(unsubscribeMsg));
    }
  }

  publish(topic: string, payload: string | object, options?: { qos?: 0 | 1 | 2; retain?: boolean }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('MQTT not connected');
      return;
    }

    const message = {
      type: 'publish',
      topic: topic,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      qos: options?.qos || 0,
      retain: options?.retain || false,
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { topic, payload } = message;

      const handlers = this.messageHandlers.get(topic) || [];
      handlers.forEach((handler) => {
        try {
          const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
          handler(parsedPayload);
        } catch (e) {
          handler(payload);
        }
      });

      this.processIncomingMessage(topic, payload);
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  private async processIncomingMessage(topic: string, payload: any): Promise<void> {
    if (!this.userId) return;

    const { data: device } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('mqtt_topic', topic)
      .maybeSingle();

    if (!device) return;

    await supabase
      .from('iot_devices')
      // @ts-expect-error Supabase type inference issue
      .update({
        status: 'online',
        last_seen: new Date().toISOString(),
      })
      .eq('id', device.id);

    if (device.device_type === 'medicine_dispenser') {
      await this.processMedicineDispenserMessage(device.id, device.user_id, payload);
    } else if (this.isSensorMessage(payload)) {
      await this.processSensorMessage(device.id, device.user_id, payload);
    }
  }

  private async processMedicineDispenserMessage(_deviceId: string, userId: string, payload: any): Promise<void> {
    if (payload.event === 'dispensed') {
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('slot_number', payload.slot)
        .eq('active', true)
        .maybeSingle();

      if (medications) {
        // @ts-expect-error Supabase type inference issue
        await supabase.from('medication_logs').insert({
          medication_id: medications.id,
          user_id: userId,
          scheduled_time: new Date().toISOString(),
          actual_time: new Date().toISOString(),
          status: 'taken',
          dispensed_by_device: true,
          notes: `Auto-dispensed from slot ${payload.slot}`,
        });

        console.log(`Medication dispensed: ${medications.name} from slot ${payload.slot}`);
      }
    } else if (payload.event === 'status') {
      console.log('Dispenser status update:', payload);
    }
  }

  private isSensorMessage(payload: any): boolean {
    return payload.type && payload.value !== undefined && payload.unit;
  }

  private async processSensorMessage(deviceId: string, userId: string, payload: SensorData): Promise<void> {
    // @ts-expect-error Supabase type inference issue
    await supabase.from('sensor_readings').insert({
      device_id: deviceId,
      user_id: userId,
      sensor_type: payload.type,
      value: payload.value,
      unit: payload.unit,
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: payload.metadata || {},
    });

    await this.checkSensorThresholds(userId, payload);
  }

  private async checkSensorThresholds(userId: string, sensor: SensorData): Promise<void> {
    const thresholds: Record<string, { min?: number; max?: number; unit: string }> = {
      spo2: { min: 90, unit: '%' },
      heart_rate: { min: 50, max: 120, unit: 'bpm' },
      temperature: { min: 18, max: 28, unit: '°C' },
      co2: { max: 1000, unit: 'ppm' },
    };

    const threshold = thresholds[sensor.type];
    if (!threshold) return;

    let alertSeverity: 'warning' | 'critical' | 'emergency' | null = null;
    let alertMessage = '';

    if (threshold.min !== undefined && sensor.value < threshold.min) {
      alertSeverity = sensor.type === 'spo2' && sensor.value < 85 ? 'emergency' : 'critical';
      alertMessage = `${sensor.type.toUpperCase()} is low: ${sensor.value}${sensor.unit} (minimum: ${threshold.min}${threshold.unit})`;
    } else if (threshold.max !== undefined && sensor.value > threshold.max) {
      alertSeverity = 'warning';
      alertMessage = `${sensor.type.toUpperCase()} is high: ${sensor.value}${sensor.unit} (maximum: ${threshold.max}${threshold.unit})`;
    }

    if (alertSeverity) {
      // @ts-expect-error Supabase type inference issue
      await supabase.from('alerts').insert({
        user_id: userId,
        alert_type: `sensor_${sensor.type}`,
        severity: alertSeverity,
        title: `${sensor.type.toUpperCase()} Alert`,
        message: alertMessage,
        data: { sensor_data: sensor },
        status: 'pending',
      });
    }
  }

  async dispenseMedicine(userId: string, slotNumber: number): Promise<void> {
    const { data: device } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_type', 'medicine_dispenser')
      .eq('status', 'online')
      .maybeSingle();

    if (!device) {
      throw new Error('Medicine dispenser not found or offline');
    }

    const command: MedicineDispenserCommand = {
      action: 'dispense',
      slot: slotNumber,
      quantity: 1,
      timestamp: new Date().toISOString(),
    };

    this.publish(device.mqtt_topic, command, { qos: 1 });

    // @ts-expect-error Supabase type inference issue
    await supabase.from('automation_logs').insert({
      user_id: userId,
      device_id: device.id,
      action: 'dispense_medicine',
      reason: `Manual dispense request for slot ${slotNumber}`,
      success: true,
      details: { slot: slotNumber },
    });
  }

  async getDispenserStatus(userId: string): Promise<MedicineDispenserStatus | null> {
    const { data: device } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_type', 'medicine_dispenser')
      .maybeSingle();

    if (!device) return null;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      this.subscribe(`${device.mqtt_topic}/status`, (status) => {
        clearTimeout(timeout);
        resolve(status);
      });

      this.publish(device.mqtt_topic, { action: 'status' }, { qos: 1 });
    });
  }

  async controlDevice(userId: string, deviceId: string, command: object): Promise<void> {
    const { data: device } = await supabase
      .from('iot_devices')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!device) {
      throw new Error('Device not found');
    }

    this.publish(device.mqtt_topic, command, { qos: 1 });

    // @ts-expect-error Supabase type inference issue
    await supabase.from('automation_logs').insert({
      user_id: userId,
      device_id: device.id,
      action: `control_${device.device_type}`,
      reason: 'Manual device control',
      success: true,
      details: { command },
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
    this.userId = null;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const mqttService = new MQTTService();
