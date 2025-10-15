var Accessory, Service, Characteristic;
var Chalk = require('chalk');

module.exports = function (accessory, service, characteristic) {
  Accessory = accessory;
  Service = service;
  Characteristic = characteristic;

  return EcobeeExtras;
};

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

  var temperatureServiceCT = null, temperatureServiceHT = null;

  temperatureServiceCT = this.homebridgeAccessory.getService(Service.TemperatureSensor);
  if (!temperatureServiceCT) {
    temperatureServiceCT = this.homebridgeAccessory.addService(Service.TemperatureSensor);
    temperatureServiceCT.displayName = "Cooling Threshold";
  }
  this.coolingtemperatureCharacteristic = temperatureServiceCT.getCharacteristic(Characteristic.CurrentTemperature);
  
  temperatureServiceHT = this.homebridgeAccessory.getService(Service.TemperatureSensor);
  if (!temperatureServiceHT) {
    temperatureServiceHT = this.homebridgeAccessory.addService(Service.TemperatureSensor);
    temperatureServiceHT.displayName = "Heating Threshold";
  }
  this.heatingtemperatureCharacteristic = temperatureServiceHT.getCharacteristic(Characteristic.CurrentTemperature);
  
  this.log.info(this.prefix, "Initialized | " + config.name);

  this.update(config.climate);  // Update services with the climate
}

EcobeeExtras.prototype.update = function (status) {
  this.log.debug(this.prefix, "Updating extras measurement " + this.name);
  // status is actually the current climate

  //const activeClimates = status.climates
  //const currentclimate = activeClimates.find((climate) => climate.climateRef === status.currentClimateRef)
  // Need to check here to make sure we got a value?
  var temperatureThreshold;
  if (this.coolingtemperatureCharacteristic) {
    temperatureThreshold = f2c(status.coolTemp);
    this.coolingtemperatureCharacteristic.updateValue(temperatureThreshold, null, this);
  }
    
  if (this.heatingtemperatureCharacteristic) {
    temperatureThreshold = f2c(status.heatTemp);
    this.heatingtemperatureCharacteristic.updateValue(temperatureThreshold, null, this);
  }
  this.log.info(this.prefix + " - " + status);
};

EcobeeExtras.prototype.identify = function (callback) {
  this.log.info(this.prefix, "Identify");
  if (callback) callback();
};

function f2c(fahrenheit10x) {
  var celsius = (parseInt(fahrenheit10x, 10) - 320) * 5 / 90;
  return celsius;
};
