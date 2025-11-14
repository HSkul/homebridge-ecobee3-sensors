var Accessory, Service, Characteristic;
var Chalk = require('chalk');

module.exports = function (accessory, service, characteristic) {
  Accessory = accessory;
  Service = service;
  Characteristic = characteristic;

  return EcobeeExtras;
};

// config.name
// config.code
// config.temp (F*10)

function EcobeeExtras(log, config, platform, homebridgeAccessory) {
  this.log = log;
  this.name = config.name;
  this.isExtras = true;
  this.prefix = Chalk.blue("[" + config.name + "]");
  this.log.debug(this.prefix, "Initializing extras...");
  this.log.debug(config);

  this.homebridgeAccessory = homebridgeAccessory;
  this.homebridgeAccessory.on('identify', this.identify.bind(this));

  var informationService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
  informationService.getCharacteristic(Characteristic.Name).setValue(config.name);
  informationService.getCharacteristic(Characteristic.Manufacturer).setValue("ecobee Inc.");
  informationService.getCharacteristic(Characteristic.Model).setValue("ecobee3 extras");
  informationService.getCharacteristic(Characteristic.SerialNumber).setValue('ecobee3-extras-' + config.name);

  if (platform.excludeExtras) return;

  var temperatureService = null;
  temperatureService = this.homebridgeAccessory.getService(Service.TemperatureSensor);
  if (!temperatureService) {
    temperatureService = this.homebridgeAccessory.addService(Service.TemperatureSensor);
    temperatureService.displayName = config.name;
  }
  this.temperatureCharacteristic = temperatureService.getCharacteristic(Characteristic.CurrentTemperature);  
  this.log.info(this.prefix, "Initialized | " + config.name);

  this.update(config);  // Update services with the config with name, code and temp
}

EcobeeExtras.prototype.update = function (status) {
  this.log.debug(this.prefix, "Updating extras measurement " + this.name);
  // status is actually the name, code and current temp (F*10)
  var temperatureCharacteristic;
  if (this.temperatureCharacteristic) {
    temperatureCharacteristic = f2c(status.temp);
    this.temperatureCharacteristic.updateValue(temperatureCharacteristic, null, this);
  }
  this.log.info(this.prefix + " - " + f2c(status.temp).toFixed(1).toString());
};

EcobeeExtras.prototype.identify = function (callback) {
  this.log.info(this.prefix, "Identify");
  if (callback) callback();
};

function f2c(fahrenheit10x) {
  var celsius = (parseInt(fahrenheit10x, 10) - 320) * 5 / 90;
  return celsius;
};
