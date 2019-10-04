'use strict';

module.exports = {
  'name': 'Wetterstation der AG Klimatologie Uni Münster',
  'sensors': [
    {
      'title': 'Temperatur',
      'unit': '°C',
      'sensorType': 'Young Typ 41382VC Kombisensor (Platin-Widerstandsthermometer + kapazitiver Feuchtesensor)'
    },
    {
      'title': 'Luftdruck',
      'unit': 'hPa',
      'sensorType': 'Young Typ 61302V Kapazitiver Drucksensor'
    },
    {
      'title': 'Luftfeuchtigkeit',
      'unit': '%',
      'sensorType': 'Young Typ 41382VC Kombisensor (Platin-Widerstandsthermometer + kapazitiver Feuchtesensor)'
    },
    {
      'title': 'Kurzwellige Strahlung',
      'unit': 'W/m²',
      'sensorType': 'Kipp & Zonen Typ CMP6 Pyranometer'
    },
    {
      'title': 'Windgeschwindigkeit',
      'unit': 'm/s',
      'sensorType': 'Gill WindSonic Anemometer RS232'
    },
    {
      'title': 'maximale Windböe',
      'unit': 'm/s',
      'sensorType': 'Gill WindSonic Anemometer RS232'
    }
  ],
  'exposure': 'outdoor',
  'location': [7.595878, 51.969263, 99.1239]
};
