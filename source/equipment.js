/* jshint esversion: 6 */

var Accessory, Service, Characteristic;
var Chalk = require('chalk');

module.exports = function (accessory, service, characteristic) {
  Accessory = accessory;
  Service = service;
  Characteristic = characteristic;

  return EcobeeEquipment;
};


function EcobeeEquipment(log, config, platform, homebridgeAccessory) {
  this.log = log;
  this.name = config.name;
  this.isEquipment = true;
  this.prefix = Chalk.blue("[" + config.name + "]");
  this.log.debug(this.prefix, "Initializing equipment...");
  this.log.debug(config);

  this.homebridgeAccessory = homebridgeAccessory;
  this.homebridgeAccessory.on('identify', this.identify.bind(this));

  var informationService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
  informationService.getCharacteristic(Characteristic.Name).setValue(config.name);
  informationService.getCharacteristic(Characteristic.Manufacturer).setValue("ecobee Inc.");
  informationService.getCharacteristic(Characteristic.Model).setValue("ecobee3 equipment");
  informationService.getCharacteristic(Characteristic.SerialNumber).setValue('ecobee3-equipment-' + config.name);

  if (platform.excludeEquipmentSensors) return;

  var service = this.homebridgeAccessory.getService(Service.ContactSensor);
  if (!service) {
    service = this.homebridgeAccessory.addService(Service.ContactSensor);
    service.displayName = 'Equipment';
  }
  this.switchState = service.getCharacteristic(Characteristic.ContactSensorState);

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
  this.update(true);
}


EcobeeEquipment.prototype.update = function (status) {
  this.log.debug(this.prefix, "Updating equipment measurement " + this.name);

  if (this.switchState) {
    var currentValue = status ?
      Characteristic.ContactSensorState.CONTACT_NOT_DETECTED :
      Characteristic.ContactSensorState.CONTACT_DETECTED;
    this.switchState.setValue(currentValue);
    this.log.info(this.prefix + " - " + status);
  }
  const activeClimates = status.climates
  const currentclimate = activeClimates.find((climate) => climate.climateRef === status.currentClimateRef)
  // Need to check here to make sure we got a value?
  var temperatureThreshold;
  if (this.coolingtemperatureCharacteristic) {
    temperatureThreshold = f2c(currentclimate.coolTemp);
    this.coolingtemperatureCharacteristic.updateValue(temperatureThreshold, null, this);
  }
    
  if (this.heatingtemperatureCharacteristic) {
    temperatureThreshold = f2c(currentclimate.heatTemp);
    this.heatingtemperatureCharacteristic.updateValue(temperatureThreshold, null, this);
  }
  this.log.info(this.prefix + " - " + currentclimate);
};


EcobeeEquipment.prototype.identify = function (callback) {
  this.log.info(this.prefix, "Identify");
  if (callback) callback();
};
