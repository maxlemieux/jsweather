$(document).ready(function() {
    const apiKey = '8d0d2314d6e034efd962fbaf225561c3';
    
    let cityList = [];

    const updateCityList = (cityName) => {
        if (cityList.includes(cityName)) {
            return;
        } else {
            cityList.push(cityName);
        }
        /* Reset the unordered list of cities and rebuild it */
        const cityListElement = $('#city-list');
        cityListElement.empty();
        for (const city of cityList) {
            console.log(city);
            const cityElement = $('<li>');
            cityElement.attr('class', 'list-group-item city-item');
            cityElement.attr('data-city', city);
            cityElement.text(city);
            cityListElement.append(cityElement);
        };

        $('.city-item').on('click', function(event) {
            /* Show saved info on the right */
            showCityInfo($(this).attr('data-city'));
        });
    };

    $('#search-form').on('submit', function(event) {
        event.preventDefault();
        let cityName = $('#search-field').val();
        updateCityList(cityName);
        citySearch(cityName);
    });

    $('#search-button').on('click', function() {
        let cityName = $('#search-field').val();
        updateCityList(cityName);
        citySearch(cityName);
    });

    /* Request city info from localStorage or the Open Weather API */
    const citySearch = (cityName) => {
        let weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
        let forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`;
        if (localStorage.getItem(cityName)) {
            console.log('Local storage found');
            showCityInfo(cityName);
        } else {
            let weatherObject = {
                weather: null,
                forecast: null,
                forecastArray: [],
            };
            console.log('Local storage not found, getting from API')
            
            /* Get both objects before processing the results */
            $.when(
                $.ajax({
                    url: weatherURL,
                    method: "GET"
                }),
                $.ajax({
                    url: forecastURL,
                    method: "GET"
                })
            ).done(function(thisWeather, thisForecastList) {
                weatherObject.weather = thisWeather[0];
                weatherObject.forecast = thisForecastList[0].list;
                
                /*
                    Build an array of objects that includes the following information for each of the next 5 days:
                    The date as .format('M/DD/YYYY')
                    The overall weather (sunny, cloudy etc) along with the icon for that weather
                    The temperature (high)
                    The humidity (high)
                    {date: }
                    Step through all of the 3 hour datapoints in the .list. Build a results object
                    and update the object's entries for a day if a new high temp or humidity is found.
                */
                for (thisForecast of weatherObject.forecast) {
                    //console.log(thisForecast);
                    const weatherIcon = `http://openweathermap.org/img/wn/${thisForecast.weather[0].icon}@2x.png`;
                    const weatherDate = moment(thisForecast.dt_txt).format('M/DD/YYYY');
                    const weatherHour = moment(thisForecast.dt_txt).format('HH');
                    const fahrenheitTemp = ((thisForecast.main.temp - 273.15) * 9/5 + 32).toPrecision(3);
                    if (weatherHour === '15') {
                        weatherObject.forecastArray.push(
                            {
                                date: weatherDate,
                                weather: weatherIcon,
                                temperature: fahrenheitTemp,
                                humidity: thisForecast.main.humidity
                            }
                        );
                    };
                };
                console.log(weatherObject.forecastArray);
                //console.log(thisWeather);
                //console.log(thisForecast);
                localStorage.setItem(cityName, JSON.stringify(weatherObject));
                showCityInfo(cityName);
            });
        };
        
    };

    /* Print information about the weather on the right side of the screen */
    const showCityInfo = (cityName) => {
        cityInfo = JSON.parse(localStorage.getItem(cityName));
        console.log(cityInfo.weather);
        const weatherDate = moment.unix(cityInfo.weather.dt).format('M/DD/YYYY');
        const kelvinTemp = cityInfo.weather.main.temp;
        const fahrenheitTemp = ((kelvinTemp - 273.15) * 9/5 + 32).toPrecision(3);
        const weatherIcon = cityInfo.weather.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
        $('#city').text(`${cityName} (${weatherDate})`);
        $('#icon').attr('src', iconUrl);
        $('#temp').text(`Temperature: ${fahrenheitTemp}`);
        $('#humidity').text(`Humidity: ${cityInfo.weather.main.humidity}`);
        $('#wind').text(cityInfo.weather.wind.speed);
        $('#uv').text(cityInfo.weather.main.uv);
        $('#forecast-container').text(cityInfo.forecastArray);
    };
});