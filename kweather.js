WeatherProvider.register("kweather", {
	providerName: "kweather",

	apiBase: "https://api.weather.com",
	currentEndpoint: "/v2/pws/observations/current",
	forecastEndpoint: "/v3/wx/forecast/daily/5day",

	// Set the default config properties that is specific to this provider
	defaults: {
		useCorsProxy: true,
		stationId: "STATION_ID",
		type: "current",
		apiKey: "YOUR_WU_API_KEY",
		lat: 0,
		lon: 0,
		ignoreToday: true,
		maxNumberOfDays: 5,
	},

	fetchCurrentWeather() {
		this.fetchData(this.getUrl())
			.then(data => {
				if (!data || !data.observations || data.observations.length < 1){
					Log.info("bad data: " + data);
					Log.info("url: " + this.getUrl());
					return;
				}
				const currentWeather = this.generateWeatherDayFromCurrentWeather(data.observations[0]);
				this.setCurrentWeather(currentWeather);
			})
			.catch(error => Log.info(error))
			.finally(() => {
				this.updateAvailable();
			});
	},

	fetchWeatherForecast() {
		this.fetchData(this.getUrl())
			.then(data => {
				if (!data){
					Log.info("bad data: " + data);
					Log.info("url: " + this.getUrl());
					return;
				}

				const forecast = this.generateWeatherForecast(data);
				this.setWeatherForecast(forecast);
			})
			.catch(error => Log.info(error))
			.finally(() => {
				this.updateAvailable();
			});
	},

	// Create a URL from the config and base URL.
	getUrl() {

		if (this.config.type === "current")
			return `${this.apiBase}/${this.currentEndpoint}?stationId=${this.config.stationId}&format=json&units=m&apiKey=${this.config.apiKey}`;
		else if (this.config.type === "forecast")
			return `${this.apiBase}/${this.forecastEndpoint}?geocode=${this.config.lat},${this.config.lon}&language=en-US&format=json&units=m&apiKey=${this.config.apiKey}`;
	},

	generateWeatherDayFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject();

		currentWeather.date = currentWeatherData.obsTimeLocal;
		currentWeather.humidity = parseFloat(currentWeatherData.humidity);
		currentWeather.temperature = parseFloat(currentWeatherData.metric.temp);
		currentWeather.windSpeed = parseFloat(currentWeatherData.metric.windSpeed);
		currentWeather.windFromDirection = currentWeatherData.winddir;
		currentWeather.weatherType = "unknown";
		currentWeather.rain = currentWeatherData.metric.precipTotal;
		Log.info(currentWeather);
		return currentWeather;
	},

	generateWeatherForecast(forecastData){
		const days = [];

		for (let i = 0; i < 5; i++)
		{
			const weather = new WeatherObject();

			weather.date = forecastData.validTimeLocal[i];
			weather.minTemperature = forecastData.temperatureMin[i];
			weather.maxTemperature = (forecastData.temperatureMax[i]) ? forecastData.temperatureMax[i] : 0;
			weather.weatherType = "tornado"; 
			weather.rain = (forecastData.daypart[0].qpf[i*2]) ? forecastData.daypart[0].qpf[i*2] : 0;

			days.push(weather);
		}

		Log.info(forecastData);
		Log.info(days);

		return days;
	},

	iconTable: {
		"Tornado": "tornado",
		"Tropical Storm": "hurricane",
		"Hurricane": "hurricane",
		"Strong Storms": "hurricane",
		"Thunderstorms": "wu_tstorms",
		"Rain / Snow": "day_rain_mix",
		"Rain / Sleet": "day_rain_mix",
		"Wintry Mix": "rain",
		"Freezing Drizzle": "rain",
		"Drizzle": "rain",
		"Freezing Rain": "",
		"Showers": "day_showers",
		"Rain": "wu_rain",
		"Flurries": "wu_flurries",
		"Snow Showers": "day_snow",
		"Blowing / Drifting Snow": "",
		"Snow": "wu_snow",
		"Hail": "day_hail",
		"Sleet": "wu_sleat",
		"Blowing Dust / Sandstorm": "",
		"Foggy": "day_fog",
		"Haze": "day_haze",
		"Smoke": "smoke",
		"Breezy": "day_windy",
		"Windy": "day_windy",
		"Frigid / Ice Crystals": "",
		"Cloudy": "wu_cloudy",
		"Mostly Cloudy": "wu_mostlycloudy",
		"Partly Cloudy": "wu_partlycloudy",
		"Clear": "wu_clear",
		"Sunny": "wu_sunny",
		"Fair / Mostly Clear": "wu_clear",
		"Fair / Mostly Sunny": "wu_mostlysunny",
		"Mixed Rain and Hail": "rain_mix",
		"Hot": "hot",
		"Isolated Thunderstorms": "day_thunderstorm",
		"Scattered Thunderstorms": "day_thunderstorm",
		"Scattered Showers": "day_showers",
		"Heavy Rain": "day_rain",
		"Scattered Snow Showers": "day_showers",
		"Heavy Snow": "day_snow",
		"Blizzard": "wu_snow",
		"Not Available (N/A)": "wu_unknown",
		"Scattered Showers": "",
		"Scattered Snow Showers": "day_snow",
		"Scattered Thunderstorms": "day_thunderstorm",
	},
});
