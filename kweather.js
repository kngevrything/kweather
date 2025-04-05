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
		debug: false,
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

		// The weather module expects the weather data to be in metric units, if ever it 
		// is updated to accept the value based on the config.units value, the following 
		// three lines can be uncommented and used instead.  
		
		//const unit = (this.config.units === "imperial") ? "e" : "m";
		const unit = "m"; 
		
		if (this.config.type === "current")
		{
			return `${this.apiBase}/${this.currentEndpoint}?stationId=${this.config.stationId}&format=json&units=${unit}&apiKey=${this.config.apiKey}`;
		}
		else if (this.config.type === "forecast")
		{
			Log.log( `${this.apiBase}/${this.forecastEndpoint}?geocode=${this.config.lat},${this.config.lon}&language=en-US&format=json&units=${unit}&apiKey=${this.config.apiKey}`);
			return `${this.apiBase}/${this.forecastEndpoint}?geocode=${this.config.lat},${this.config.lon}&language=en-US&format=json&units=${unit}&apiKey=${this.config.apiKey}`;
		}
	},

	generateWeatherDayFromCurrentWeather(currentWeatherData) {
		const currentWeather = new WeatherObject();

		currentWeather.date = currentWeatherData.obsTimeLocal;
		currentWeather.humidity = parseFloat(currentWeatherData.humidity);
		currentWeather.windFromDirection = currentWeatherData.winddir;
		currentWeather.weatherType = "unknown";
		
		// The weather module expects the weather data to be in metric units, if ever it 
		// is updated to accept the value based on the config.units value, the following 
		// three lines can be uncommented and used instead.  

		//currentWeather.temperature = parseFloat((this.config.units === "imperial") ? currentWeatherData.imperial.temp : currentWeatherData.metric.temp);
		//currentWeather.windSpeed = parseFloat((this.config.units === "imperial") ? currentWeatherData.imperial.windSpeed : currentWeatherData.metric.windSpeed);
		//currentWeather.rain = (this.config.units === "imperial") ? currentWeatherData.imperial.precipTotal : currentWeatherDatalog.metric.precipTotal;

		currentWeather.temperature = currentWeatherData.metric.temp;
		currentWeather.windSpeed = currentWeatherData.metric.windSpeed;
		currentWeather.rain = currentWeatherData.metric.precipTotal;
		
		return currentWeather;
	},

	generateWeatherForecast(forecastData){
		const days = [];
		Log.log(forecastData);
		for (let i = 0; i < 5; i++)
		{
			const weather = new WeatherObject();
			
			weather.date = moment(forecastData.validTimeLocal[i].replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
			weather.minTemperature = forecastData.temperatureMin[i];
			weather.maxTemperature = (forecastData.temperatureMax[i]) ? forecastData.temperatureMax[i] : 0;
			weather.weatherType = this.getWeatherIconFromCode(forecastData.daypart[0].iconCode[i]); 
			weather.rain = (forecastData.daypart[0].qpf[i*2]) ? forecastData.daypart[0].qpf[i*2] : 0;
			Log.log(weather);
			days.push(weather);
		}

		if (this.config.debug)
		{
			Log.info(forecastData);
			Log.info(days);
		}

		return days;
	},

	getWeatherIconFromCode(code) {
		const iconMap = {
		  0:  "tornado",
		  1:  "storm-showers",       // Tropical Storm
		  2:  "hurricane",
		  3:  "thunderstorm",        // Strong Storms
		  4:  "thunderstorm",
		  5:  "rain-mix",            // Rain / Snow
		  6:  "sleet",               // Rain / Sleet
		  7:  "rain-mix",            // Wintry Mix
		  8:  "snowflake-cold",      // Freezing Drizzle
		  9:  "sprinkle",            // Drizzle
		  10: "rain-mix",            // Freezing Rain
		  11: "showers",
		  12: "rain",
		  13: "snow",                // Flurries
		  14: "snow",                // Snow Showers
		  15: "snow-wind",           // Blowing / Drifting Snow
		  16: "snow",
		  17: "hail",
		  18: "sleet",
		  19: "dust",                // Blowing Dust / Sandstorm
		  20: "fog",
		  21: "day-haze",
		  22: "smoke",
		  23: "cloudy-gusts",        // Breezy
		  24: "strong-wind",         // Windy
		  25: "snowflake-cold",      // Frigid
		  26: "cloudy",
		  27: "night-alt-cloudy",    // Mostly Cloudy (night)
		  28: "day-cloudy",          // Mostly Cloudy (day)
		  29: "night-alt-partly-cloudy",
		  30: "day-sunny-overcast",
		  31: "night-clear",
		  32: "day-sunny",
		  33: "night-alt-cloudy",    // Fair / Mostly Clear
		  34: "day-sunny",           // Fair / Mostly Sunny
		  35: "hail",                // Mixed Rain and Hail
		  36: "hot",
		  37: "storm-showers",       // Isolated Thunderstorms
		  38: "storm-showers",       // Scattered Thunderstorms
		  39: "showers",             // Scattered Showers
		  40: "rain",                // Heavy Rain
		  41: "snow",                // Scattered Snow Showers
		  42: "snow-wind",           // Heavy Snow
		  43: "snow-wind",           // Blizzard
		  44: "na",                  // Not Available
		  45: "showers",
		  46: "snow",
		  47: "thunderstorm"
		};
	  
		return iconMap[code] || "na"; // fallback icon
	},
	
});
