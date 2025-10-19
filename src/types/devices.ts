export interface Device {
  deviceId: string;
  name: string;
  description: string;
  online: boolean;
  releaseChannel: string;
  deviceType: string;
  deviceFamily: string;
  deviceGroup: string;
  generation: string;
  formFactor: string;
}

export interface DeviceStatus {
  activeCard: string;
  ambientLightSensorReading: number;
  averageDownloadSpeedBytesSecond: number;
  batteryLevelPercentage: number;
  batteryLevelPercentageRaw: number;
  buzzErrors: number;
  cardInsertionState: number;
  dayMode: number;
  deviceId: string;
  errorsLogged: number;
  firmwareVersion: string;
  freeDiskSpaceBytes: number;
  isAudioDeviceConnected: boolean;
  isBackgroundDownloadActive: boolean;
  isBluetoothAudioConnected: boolean;
  isCharging: boolean;
  isNfcLocked: number;
  isOnline: boolean;
  networkSsid: string;
  nightlightMode: string;
  playingSource: number;
  powerCapabilities: string | null;
  powerSource: number;
  systemVolumePercentage: number;
  taskWatchdogTimeoutCount: number;
  temperatureCelcius: string;
  totalDiskSpaceBytes: number;
  updatedAt: string;
  uptime: number;
  userVolumePercentage: number;
  utcOffsetSeconds: number;
  utcTime: number;
  wifiStrength: number;
}

export interface DeviceStatusRaw {
  activeCard: string;
  aliveTime: string | null;
  als: number;
  battery: number | null;
  batteryLevel: number;
  batteryLevelRaw: number;
  batteryRemaining: number | null;
  bgDownload: number;
  bluetoothHp: number;
  buzzErrors: number;
  bytesPS: number;
  cardInserted: number;
  chgStatLevel: number | null;
  charging: number;
  day: number;
  dayBright: number | null;
  dbatTimeout: number | null;
  dnowBrightness: number | null;
  deviceId: string;
  errorsLogged: number;
  failData: unknown | null;
  failReason: string | null;
  free: number | null;
  free32: number | null;
  freeDisk: number;
  freeDMA: number | null;
  fwVersion: string;
  headphones: number;
  lastSeenAt: string | null;
  missedLogs: number | null;
  nfcErrs: string;
  nfcLock: number;
  nightBright: number | null;
  nightlightMode: string;
  playingStatus: number;
  powerCaps: string | null;
  powerSrc: number;
  qiOtp: string | null;
  sd_info: unknown | null;
  shutDown: number | null;
  shutdownTimeout: number | null;
  ssid: string;
  statusVersion: string | null;
  temp: string;
  timeFormat: string | null;
  totalDisk: number;
  twdt: number;
  updatedAt: string;
  upTime: number;
  userVolume: number;
  utcOffset: number;
  utcTime: number;
  volume: number;
  wifiRestarts: number | null;
  wifiStrength: number;
}

export interface DeviceConfigSettings {
  locale: string;
  bluetoothEnabled: string;
  repeatAll: boolean;
  showDiagnostics: boolean;
  btHeadphonesEnabled: boolean;
  pauseVolumeDown: boolean;
  pausePowerButton: boolean;
  displayDimTimeout: string;
  shutdownTimeout: string;
  headphonesVolumeLimited: boolean;
  dayTime: string;
  maxVolumeLimit: string;
  ambientColour: string;
  dayDisplayBrightness: string;
  dayYotoDaily: string;
  dayYotoRadio: string;
  daySoundsOff: string;
  nightTime: string;
  nightMaxVolumeLimit: string;
  nightAmbientColour: string;
  nightDisplayBrightness: string;
  nightYotoDaily: string;
  nightYotoRadio: string;
  nightSoundsOff: string;
  hourFormat: string;
  displayDimBrightness: string;
  systemVolume: string;
  volumeLevel: string;
  clockFace: string;
  logLevel: string;
  alarms: unknown[];
}

export interface ShortcutCommand {
  cmd: string;
  params: {
    card: string;
    chapter: string;
    track: string;
  };
}

export interface ShortcutMode {
  content: ShortcutCommand[];
}

export interface DeviceShortcuts {
  versionId: string;
  modes: {
    day: ShortcutMode;
    night: ShortcutMode;
  };
}

export interface DeviceConfig {
  device: {
    deviceId: string;
    errorCode: string | null;
    fwVersion: string;
    popCode: string;
    releaseChannelId: string;
    releaseChannelVersion: string;
    activationPopCode: string;
    registrationCode: string;
    deviceType: string;
    deviceFamily: string;
    deviceGroup: string;
    mac: string;
    online: boolean;
    geoTimezone: string;
    getPosix: string;
    status: DeviceStatusRaw;
    config: DeviceConfigSettings;
    shortcuts: DeviceShortcuts;
  };
}

export interface UpdateDeviceConfigRequest {
  name?: string;
  volume?: number;
  maxVolume?: number;
  ambientColor?: string;
  nightLightEnabled?: boolean;
}

export type DeviceCommand =
  | "play"
  | "pause"
  | "next"
  | "previous"
  | "volumeUp"
  | "volumeDown"
  | "stop";

export interface SendCommandRequest {
  command: DeviceCommand;
}

export interface DeviceShortcut {
  position: number;
  contentId?: string;
}

export interface UpdateShortcutsRequest {
  shortcuts: DeviceShortcut[];
}
